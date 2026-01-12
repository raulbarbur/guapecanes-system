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

    // Usamos Transaction para atomicidad completa
    await prisma.$transaction(async (tx) => {
      let totalReal = 0
      const saleItemsData = []
      const appointmentIdsToBill: string[] = []

      for (const item of cart) {
        // A. PRODUCTO
        if (item.type === 'PRODUCT') {
            // 1. Buscamos datos maestros (Precios, Dueño) para el SNAPSHOT
            const variant = await tx.productVariant.findUnique({
                where: { id: item.id },
                include: { product: true }
            })

            if (!variant) throw new Error(`Producto no encontrado: ${item.description}`)
            
            // 2. ACTUALIZACIÓN ATÓMICA DE STOCK (Concurrency Safe)
            // Intentamos restar SOLO SI el stock actual es mayor o igual a la cantidad
            const updateResult = await tx.productVariant.updateMany({
                where: { 
                    id: item.id,
                    stock: { gte: item.quantity } // 🛡️ Condición de guarda atómica
                },
                data: { 
                    stock: { decrement: item.quantity } 
                }
            })

            // Si updateResult.count es 0, significa que falló la condición (no había stock suficiente)
            // Esto protege contra race conditions (dos cajas vendiendo lo mismo al mismo tiempo)
            if (updateResult.count === 0) {
                throw new Error(`Stock insuficiente al momento de confirmar: ${variant.product.name}`)
            }

            // Cálculos
            const subtotal = Number(variant.salePrice) * item.quantity
            totalReal += subtotal

            // Preparamos el item de venta
            saleItemsData.push({
                variantId: variant.id,
                description: variant.product.name,
                quantity: item.quantity,
                costAtSale: variant.costPrice, // 📸 Snapshot de Costo
                priceAtSale: variant.salePrice // 📸 Snapshot de Precio Venta
            })

            // Registro de Movimiento
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
        // B. SERVICIO
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

      // 3. Crear Venta Cabecera
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

      // 4. Actualizar Turnos (Si hubo servicios)
      if (appointmentIdsToBill.length > 0) {
        await tx.appointment.updateMany({
            where: { id: { in: appointmentIdsToBill } },
            data: { status: 'BILLED' }
        })
      }
    })

    // Revalidación de UI
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
      // 1. Buscar venta con sus items y variantes
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: { include: { variant: { include: { product: true } } } } } 
      })

      if (!sale) throw new Error("Venta no encontrada")
      if (sale.status === 'CANCELLED') throw new Error("Esta venta ya está anulada")

      // 2. Marcar como Cancelada
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      // 3. Procesar devolución de Items
      for (const item of sale.items) {
        // Solo restauramos stock si es un producto (tiene variantId)
        if (item.variantId && item.variant) {
          
          // A. Restaurar Stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          })

          // B. Registrar Movimiento (Auditoría)
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              quantity: item.quantity,
              type: 'SALE_CANCELLED',
              reason: `Anulación Venta #${sale.id.slice(0, 8)}`,
              userId: 'sistema'
            }
          })

          // C. AJUSTE FINANCIERO (CRÍTICO)
          // Si el item ya fue liquidado (pagado al dueño), generamos una deuda.
          if (item.isSettled) {
            const amountOwedBack = Number(item.costAtSale) * item.quantity
            
            await tx.balanceAdjustment.create({
              data: {
                ownerId: item.variant.product.ownerId,
                amount: -amountOwedBack, // Negativo = El dueño le debe al local
                description: `Devolución Liq. - Prod: ${item.description}`,
                isApplied: false
              }
            })
          }
        }
      }
      // Nota: Los servicios no afectan stock ni generan deuda a dueños (son ingreso propio),
      // por lo que no requieren reversión compleja más allá de la anulación de la venta.
      // (Queda pendiente: Revertir estado del turno de BILLED a COMPLETED si se deseara re-facturar).
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