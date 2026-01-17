// src/actions/sale-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { StockMovementType, PaymentStatus } from "@prisma/client"
import { getSession } from "@/lib/auth"

type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  description: string
  price: number
  quantity: number
}

type PaymentMethodStr = "CASH" | "TRANSFER" | "CHECKING_ACCOUNT"

// R-06: Helper de redondeo para evitar errores de punto flotante
const round = (num: number) => Math.round(num * 100) / 100

export async function processSale(
    cart: CartItem[], 
    totalEstimado: number, 
    paymentMethod: PaymentMethodStr,
    customerId?: string
) {
  // 1. SEGURIDAD
  const session = await getSession()
  if (!session) return { error: "Sesión expirada. Iniciá sesión nuevamente." }

  if (cart.length === 0) return { error: "El carrito está vacío" }

  try {
    let createdSaleId = ""
    let createdDate = new Date()

    const paymentStatus: PaymentStatus = paymentMethod === 'CHECKING_ACCOUNT' 
        ? 'PENDING' 
        : 'PAID'
    
    const paidAt = paymentStatus === 'PAID' ? new Date() : null

    if (paymentStatus === 'PENDING' && !customerId) {
        return { error: "Para fiar (Cuenta Corriente) debés seleccionar un cliente." }
    }

    // R-04: Sanitización. Ignoramos precios del cliente para Productos.
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
            if (!variant) throw new Error(`Producto no encontrado o inactivo: ${item.description}`)
            
            // R-04: Sanitización de Cantidad
            if (item.quantity <= 0 || isNaN(item.quantity)) {
                throw new Error(`Cantidad inválida para producto: ${item.description}`)
            }

            // VALIDACIÓN DE STOCK
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
                throw new Error(`Stock insuficiente para: ${variant.product.name}. Refrescá la página.`)
            }

            // R-04: Usamos precio de DB
            const currentPrice = Number(variant.salePrice)
            
            // R-06: Redondeo explícito a nivel de línea (SUBTOTAL)
            // Esto asegura que 3 items de $33.33 den $99.99 exactos y no $99.99000001
            const subtotal = round(currentPrice * item.quantity)
            totalReal = round(totalReal + subtotal)

            saleItemsData.push({
                variantId: variant.id,
                description: variant.product.name,
                quantity: item.quantity,
                costAtSale: variant.costPrice, // Prisma maneja Decimal, le pasamos number/string
                priceAtSale: currentPrice,
                settledQuantity: 0
            })

            stockMovementsData.push({
                variantId: variant.id,
                quantity: -item.quantity,
                type: StockMovementType.SALE,
                reason: paymentStatus === 'PENDING' ? "Venta Cta. Cte." : "Venta Mostrador",
                userId: session.userId 
            })
        } 
        else if (item.type === 'SERVICE') {
            // R-04: Validación de precios manuales
            if (item.price < 0 || isNaN(item.price)) {
                throw new Error(`Precio de servicio inválido: ${item.description}`)
            }
            if (item.quantity <= 0) throw new Error(`Cantidad inválida para servicio.`)

            // R-06: Redondeo para servicios
            const subtotal = round(item.price * item.quantity)
            totalReal = round(totalReal + subtotal)

            saleItemsData.push({
                variantId: null,
                description: item.description,
                quantity: item.quantity,
                costAtSale: 0,
                priceAtSale: item.price,
                settledQuantity: 0
            })

            appointmentIdsToBill.push(item.id)
        }
      }

      // Registro de Movimientos de Stock
      if (stockMovementsData.length > 0) {
          await tx.stockMovement.createMany({ data: stockMovementsData })
      }

      // Creación de la Venta con TOTAL REAL redondeado
      const sale = await tx.sale.create({
        data: {
          total: totalReal,
          paymentMethod: paymentMethod, 
          status: "COMPLETED",
          paymentStatus: paymentStatus,
          paidAt: paidAt,
          customerId: customerId || null,
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
    if (customerId) revalidatePath(`/customers/${customerId}`)
    
    return { success: true, saleId: createdSaleId, date: createdDate }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

export async function markSaleAsPaid(saleId: string) {
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    try {
        const currentSale = await prisma.sale.findUnique({
          where: { id: saleId },
          select: { paymentStatus: true }
        })

        if (!currentSale) return { error: "Venta no encontrada" }
        
        if (currentSale.paymentStatus === 'PAID') {
          return { success: true, message: "Venta ya estaba cobrada previamente" }
        }

        await prisma.sale.update({
            where: { id: saleId },
            data: {
                paymentStatus: 'PAID',
                paidAt: new Date()
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/sales")
        return { success: true }
    } catch (error) {
        return { error: "Error al actualizar pago" }
    }
}

export async function cancelSale(saleId: string) {
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
            userId: session.userId 
          })

          if (item.settledQuantity > 0) {
            // R-06: Redondeo también en anulaciones
            const amountOwedBack = round(Number(item.costAtSale) * item.settledQuantity)
            
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