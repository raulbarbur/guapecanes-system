// src/actions/sale-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Definimos la estructura del carrito polimórfico (Producto o Servicio)
type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string       // variantId (si es producto) O appointmentId (si es servicio)
  description: string
  price: number    // Precio final de venta
  quantity: number
}

export async function processSale(cart: CartItem[], totalEstimado: number) {
  if (cart.length === 0) return { error: "El carrito está vacío" }

  try {
    await prisma.$transaction(async (tx) => {
      let totalReal = 0
      const saleItemsData = []
      
      // Lista de turnos a marcar como cobrados (para servicios)
      const appointmentIdsToBill: string[] = []

      for (const item of cart) {
        
        // --- CASO A: PRODUCTO (Con Control de Stock) ---
        if (item.type === 'PRODUCT') {
            // Buscamos el producto para validar stock y precio real
            const variant = await tx.productVariant.findUnique({
                where: { id: item.id },
                include: { product: true }
            })

            if (!variant) throw new Error(`Producto no encontrado: ${item.description}`)
            if (variant.stock < item.quantity) throw new Error(`Stock insuficiente: ${variant.product.name}`)

            // Usamos precio de DB por seguridad
            const subtotal = Number(variant.salePrice) * item.quantity
            totalReal += subtotal

            saleItemsData.push({
                variantId: variant.id,
                description: variant.product.name,
                quantity: item.quantity,
                costAtSale: variant.costPrice,
                priceAtSale: variant.salePrice
            })

            // Baja de Stock
            await tx.productVariant.update({
                where: { id: variant.id },
                data: { stock: { decrement: item.quantity } }
            })

            // Auditoría de Movimiento
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
        
        // --- CASO B: SERVICIO (Sin Stock, Precio Variable) ---
        else if (item.type === 'SERVICE') {
            // En servicios confiamos en el precio que manda el cajero
            const subtotal = item.price * item.quantity
            totalReal += subtotal

            saleItemsData.push({
                variantId: null, // Es servicio, no tiene variante
                description: item.description,
                quantity: item.quantity,
                costAtSale: 0,     // Mano de obra (asumimos 0 costo directo por ahora)
                priceAtSale: item.price
            })

            // Guardamos el ID del turno para actualizarlo luego
            appointmentIdsToBill.push(item.id)
        }
      }

      // 4. Crear la Venta Cabecera
      await tx.sale.create({
        data: {
          total: totalReal,
          paymentMethod: "CASH", // Por ahora fijo efectivo
          status: "COMPLETED",
          items: {
            create: saleItemsData
          }
        }
      })

      // 5. Actualizar Turnos a BILLED (Cobrados)
      if (appointmentIdsToBill.length > 0) {
        await tx.appointment.updateMany({
            where: { id: { in: appointmentIdsToBill } },
            data: { status: 'BILLED' }
        })
      }
    })

    revalidatePath("/products")
    revalidatePath("/pos")
    revalidatePath("/agenda") // Importante: para que el turno cambie de color
    return { success: true }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

export async function cancelSale(saleId: string) {
  console.log(`🔍 [DEBUG] Iniciando anulación para Venta ID: ${saleId}`)
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Buscar la venta
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { 
          items: {
            include: {
              variant: {
                include: { product: true }
              }
            }
          } 
        }
      })

      if (!sale) throw new Error("Venta no encontrada")
      if (sale.status === 'CANCELLED') throw new Error("Ya está anulada")

      // 2. Marcar como ANULADA
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      // 3. Procesar items
      for (const item of sale.items) {
        
        // A. Si es PRODUCTO (tiene variantId)
        if (item.variantId && item.variant) {
          // Devolver stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          })

          // Auditar movimiento
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              quantity: item.quantity,
              type: 'SALE_CANCELLED',
              reason: `Anulación Venta #${sale.id.slice(0, 8)}`,
              userId: 'sistema'
            }
          })

          // AJUSTE FINANCIERO: Si ya estaba pagado, generar deuda al dueño
          if (item.isSettled) {
            const amountOwedBack = Number(item.costAtSale) * item.quantity
            const ownerId = item.variant.product.ownerId

            await tx.balanceAdjustment.create({
              data: {
                ownerId: ownerId,
                amount: -amountOwedBack, 
                description: `Devolución liquidada: ${item.description}`,
                isApplied: false
              }
            })
          }
        }
        
        // B. Si es SERVICIO (variantId null)
        // Por ahora no hacemos nada específico más que anular la venta.
        // Idealmente, deberíamos buscar el turno y volverlo a 'PENDING',
        // pero eso requiere guardar el appointmentId en SaleItem, cosa que haremos en v2.
      }
    })

    revalidatePath("/sales")
    revalidatePath("/products") 
    revalidatePath("/owners/balance")
    return { success: true }

  } catch (error: any) {
    console.error("❌ [DEBUG] Error anulando venta:", error)
    return { error: error.message || "Error al anular venta" }
  }
}