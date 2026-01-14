// src/actions/sale-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { StockMovementType } from "@prisma/client"
import { getSession } from "@/lib/auth" // 👈 Importamos autenticación

type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  description: string
  price: number
  quantity: number
}

type PaymentMethod = "CASH" | "TRANSFER"

export async function processSale(
    cart: CartItem[], 
    totalEstimado: number, 
    paymentMethod: PaymentMethod 
) {
  // 1. SEGURIDAD: Verificar sesión antes de procesar dinero
  const session = await getSession()
  if (!session) return { error: "Sesión expirada. Iniciá sesión nuevamente." }

  if (cart.length === 0) return { error: "El carrito está vacío" }

  try {
    let createdSaleId = ""
    let createdDate = new Date()

    const productIds = cart.filter(i => i.type === 'PRODUCT').map(i => i.id)
    
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: productIds } },
      include: { product: true }
    })

    await prisma.$transaction(async (tx) => {
      let totalReal = 0
      const saleItemsData = []
      const stockMovementsData = [] 
      const appointmentIdsToBill: string[] = []

      for (const item of cart) {
        if (item.type === 'PRODUCT') {
            const variant = dbVariants.find(v => v.id === item.id)
            if (!variant) throw new Error(`Producto no encontrado: ${item.description}`)
            
            const updateResult = await tx.productVariant.updateMany({
                where: { 
                    id: item.id,
                    stock: { gte: item.quantity } 
                },
                data: { 
                    stock: { decrement: item.quantity } 
                }
            })

            if (updateResult.count === 0) {
                throw new Error(`Stock insuficiente para: ${variant.product.name}`)
            }

            const subtotal = Number(variant.salePrice) * item.quantity
            totalReal += subtotal

            saleItemsData.push({
                variantId: variant.id,
                description: variant.product.name,
                quantity: item.quantity,
                costAtSale: variant.costPrice,
                priceAtSale: variant.salePrice
            })

            stockMovementsData.push({
                variantId: variant.id,
                quantity: -item.quantity,
                type: StockMovementType.SALE,
                reason: "Venta Mostrador",
                userId: session.userId // 👈 AUDITORÍA REAL
            })
        } 
        else if (item.type === 'SERVICE') {
            const subtotal = item.price * item.quantity
            totalReal += subtotal

            saleItemsData.push({
                variantId: null,
                description: item.description,
                quantity: item.quantity,
                costAtSale: 0,
                priceAtSale: item.price
            })

            appointmentIdsToBill.push(item.id)
        }
      }

      if (stockMovementsData.length > 0) {
          await tx.stockMovement.createMany({ data: stockMovementsData })
      }

      const sale = await tx.sale.create({
        data: {
          total: totalReal,
          paymentMethod: paymentMethod, 
          status: "COMPLETED",
          items: { create: saleItemsData }
        }
      })
      
      createdSaleId = sale.id
      createdDate = sale.createdAt

      if (appointmentIdsToBill.length > 0) {
        await tx.appointment.updateMany({
            where: { id: { in: appointmentIdsToBill } },
            data: { status: 'BILLED' }
        })
      }

    }, { maxWait: 5000, timeout: 10000 })

    revalidatePath("/products")
    revalidatePath("/pos")
    revalidatePath("/dashboard")
    revalidatePath("/sales")
    
    return { success: true, saleId: createdSaleId, date: createdDate }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

export async function cancelSale(saleId: string) {
  // SEGURIDAD
  const session = await getSession()
  if (!session) return { error: "No autorizado" }

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: { include: { variant: { include: { product: true } } } } } 
      })

      if (!sale) throw new Error("Venta no encontrada")
      if (sale.status === 'CANCELLED') throw new Error("Ya está anulada")

      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      const movementsToCreate = []
      const adjustmentsToCreate = []

      for (const item of sale.items) {
        if (item.variantId && item.variant) {
          
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          })

          movementsToCreate.push({
            variantId: item.variantId,
            quantity: item.quantity,
            type: StockMovementType.SALE_CANCELLED,
            reason: `Anulación Venta #${sale.id.slice(0, 8)}`,
            userId: session.userId // 👈 ID DEL USUARIO QUE CANCELA
          })

          if (item.isSettled) {
            const amountOwedBack = Number(item.costAtSale) * item.quantity
            adjustmentsToCreate.push({
                ownerId: item.variant.product.ownerId,
                amount: -amountOwedBack,
                description: `Devolución Liq. - Prod: ${item.description}`,
                isApplied: false
            })
          }
        }
      }

      if (movementsToCreate.length > 0) {
          await tx.stockMovement.createMany({ data: movementsToCreate })
      }
      
      if (adjustmentsToCreate.length > 0) {
          await tx.balanceAdjustment.createMany({ data: adjustmentsToCreate })
      }

    })

    revalidatePath("/sales")
    revalidatePath("/products") 
    revalidatePath("/owners/balance")
    return { success: true }

  } catch (error: any) {
    return { error: error.message }
  }
}