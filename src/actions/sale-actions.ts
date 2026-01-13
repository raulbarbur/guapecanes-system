// src/actions/sale-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
  if (cart.length === 0) return { error: "El carrito está vacío" }

  try {
    let createdSaleId = ""
    let createdDate = new Date()

    // --- 1. PREPARACIÓN FUERA DE LA TRANSACCIÓN ---
    // Buscamos todos los datos necesarios ANTES de bloquear la base de datos.
    // Esto ahorra tiempo de red dentro del túnel de la transacción.
    const productIds = cart.filter(i => i.type === 'PRODUCT').map(i => i.id)
    
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: productIds } },
      include: { product: true }
    })

    // --- 2. TRANSACCIÓN CON TIMEOUT EXTENDIDO ---
    await prisma.$transaction(async (tx) => {
      let totalReal = 0
      const saleItemsData = []
      const appointmentIdsToBill: string[] = []

      for (const item of cart) {
        if (item.type === 'PRODUCT') {
            const variant = dbVariants.find(v => v.id === item.id)
            if (!variant) throw new Error(`Producto no encontrado: ${item.description}`)
            
            // ACTUALIZACIÓN ATÓMICA DE STOCK
            // Seguimos usando updateMany para el check de stock gte cantidad (Concurrency Safe)
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

            await tx.stockMovement.create({
                data: {
                    variantId: variant.id,
                    quantity: -item.quantity,
                    type: "SALE",
                    reason: "Venta Mostrador",
                    userId: "sistema"
                }
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

      const sale = await tx.sale.create({
        data: {
          total: totalReal,
          paymentMethod: paymentMethod, 
          status: "COMPLETED",
          items: {
            create: saleItemsData
          }
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
    }, {
      // CONFIGURACIÓN DE TIMEOUT (Solución al error de expiración)
      maxWait: 10000, // Tiempo máximo para esperar a obtener una conexión (10s)
      timeout: 20000  // Tiempo máximo de ejecución de la transacción (20s)
    })

    revalidatePath("/products")
    revalidatePath("/pos")
    revalidatePath("/agenda")
    revalidatePath("/dashboard")
    
    return { success: true, saleId: createdSaleId, date: createdDate }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

export async function cancelSale(saleId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: { include: { variant: { include: { product: true } } } } } 
      })

      if (!sale) throw new Error("Venta no encontrada")
      if (sale.status === 'CANCELLED') throw new Error("Esta venta ya está anulada")

      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      for (const item of sale.items) {
        if (item.variantId && item.variant) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          })

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              quantity: item.quantity,
              type: 'SALE_CANCELLED',
              reason: `Anulación Venta #${sale.id.slice(0, 8)}`,
              userId: 'sistema'
            }
          })

          if (item.isSettled) {
            const amountOwedBack = Number(item.costAtSale) * item.quantity
            await tx.balanceAdjustment.create({
              data: {
                ownerId: item.variant.product.ownerId,
                amount: -amountOwedBack,
                description: `Devolución Liq. - Prod: ${item.description}`,
                isApplied: false
              }
            })
          }
        }
      }
    }, {
      maxWait: 10000,
      timeout: 20000
    })

    revalidatePath("/sales")
    revalidatePath("/products") 
    revalidatePath("/owners/balance")
    revalidatePath("/dashboard")
    return { success: true }

  } catch (error: any) {
    console.error("Error anulando venta:", error)
    return { error: error.message || "Error al anular venta" }
  }
}