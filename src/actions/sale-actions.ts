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

// Extendemos el tipo para soportar futuros métodos sin romper lo actual
type PaymentMethodStr = "CASH" | "TRANSFER" | "CHECKING_ACCOUNT"

export async function processSale(
    cart: CartItem[], 
    totalEstimado: number, 
    paymentMethod: PaymentMethodStr,
    customerId?: string // 👈 Nuevo parámetro opcional
) {
  // 1. SEGURIDAD
  const session = await getSession()
  if (!session) return { error: "Sesión expirada. Iniciá sesión nuevamente." }

  if (cart.length === 0) return { error: "El carrito está vacío" }

  try {
    let createdSaleId = ""
    let createdDate = new Date()

    // Determinamos el estado de pago
    // Si es Cuenta Corriente, queda PENDING. Si es Efectivo/Transfer, queda PAID.
    const paymentStatus: PaymentStatus = paymentMethod === 'CHECKING_ACCOUNT' 
        ? 'PENDING' 
        : 'PAID'
    
    // R-02: Definir fecha de caja
    // Si se paga ya, paidAt es hoy. Si es fiado, es null hasta que pague.
    const paidAt = paymentStatus === 'PAID' ? new Date() : null

    // Validación: Si es fiado, DEBE haber un cliente
    if (paymentStatus === 'PENDING' && !customerId) {
        return { error: "Para fiar (Cuenta Corriente) debés seleccionar un cliente." }
    }

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
            
            // VALIDACIÓN DE STOCK
            // Incluso si es fiado, el stock baja porque se entrega la mercadería
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
                priceAtSale: variant.salePrice,
                settledQuantity: 0 // 👈 Inicializamos en 0 (No pagado al dueño aún)
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
            const subtotal = item.price * item.quantity
            totalReal += subtotal

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

      // Creación de la Venta
      const sale = await tx.sale.create({
        data: {
          total: totalReal,
          paymentMethod: paymentMethod, 
          status: "COMPLETED", // La transacción se completó (entregué producto)
          paymentStatus: paymentStatus, // Estado financiero (Cobrado o Deuda)
          paidAt: paidAt, // R-02: Seteo de fecha caja
          customerId: customerId || null,
          items: { create: saleItemsData }
        }
      })
      
      createdSaleId = sale.id
      createdDate = sale.createdAt

      // Actualizar Turnos a COBRADO
      // Nota: Si la venta es "Fiada", el turno igual se marca BILLED porque ya se procesó en caja
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
    // Revalidamos la ficha del cliente si existe
    if (customerId) revalidatePath(`/customers/${customerId}`)
    
    return { success: true, saleId: createdSaleId, date: createdDate }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

// R-02: Nueva función para cobrar deudas y registrar ingreso en caja HOY
export async function markSaleAsPaid(saleId: string) {
    const session = await getSession()
    if (!session) return { error: "No autorizado" }

    try {
        // R-03: Leer antes de escribir para idempotencia
        const currentSale = await prisma.sale.findUnique({
          where: { id: saleId },
          select: { paymentStatus: true }
        })

        if (!currentSale) return { error: "Venta no encontrada" }
        
        if (currentSale.paymentStatus === 'PAID') {
          // Ya está cobrada, devolvemos success para no romper flujo cliente, 
          // pero avisamos en consola o simplemente no hacemos nada.
          return { success: true, message: "Venta ya estaba cobrada previamente" }
        }

        await prisma.sale.update({
            where: { id: saleId },
            data: {
                paymentStatus: 'PAID',
                paidAt: new Date() // El dinero entra HOY
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/sales")
        // No tenemos el customerId aquí fácil, así que revalidamos paths generales
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

      // 1. Marcar Venta Cancelada
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      const movementsToCreate = []
      const adjustmentsToCreate = []

      for (const item of sale.items) {
        if (item.variantId && item.variant) {
          
          // 2. Devolver Stock
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

          // 3. Reversión Financiera al Dueño
          // Usamos settledQuantity para saber si ya le pagamos algo de esto al dueño
          if (item.settledQuantity > 0) {
            const amountOwedBack = Number(item.costAtSale) * item.settledQuantity
            
            adjustmentsToCreate.push({
                ownerId: item.variant.product.ownerId,
                amount: -amountOwedBack, // Negativo = El dueño nos debe (porque le pagamos de más)
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