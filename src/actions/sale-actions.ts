// src/actions/sale-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Definimos la estructura de lo que esperamos recibir desde el carrito
type CartItem = {
  variantId: string
  quantity: number
}

export async function processSale(cart: CartItem[], totalEstimado: number) {
  if (cart.length === 0) return { error: "El carrito está vacío" }

  try {
    await prisma.$transaction(async (tx) => {
      let totalReal = 0
      const saleItemsData = []

      for (const item of cart) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        })

        if (!variant) throw new Error(`Producto ${item.variantId} no encontrado`)
        
        if (variant.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${variant.product.name}`)
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

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } }
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

      await tx.sale.create({
        data: {
          total: totalReal,
          paymentMethod: "CASH",
          status: "COMPLETED",
          items: {
            create: saleItemsData
          }
        }
      })
    })

    revalidatePath("/products")
    revalidatePath("/pos")
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

      if (!sale) {
        console.error("❌ [DEBUG] Venta no encontrada en DB")
        throw new Error("Venta no encontrada")
      }
      
      console.log(`📄 [DEBUG] Estado actual de la venta: ${sale.status}`)
      
      if (sale.status === 'CANCELLED') throw new Error("Ya está anulada")

      // 2. Marcar como ANULADA
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      // 3. Procesar items
      for (const item of sale.items) {
        console.log(`📦 [DEBUG] Procesando Item: ${item.description} | isSettled: ${item.isSettled}`)

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

          // CRÍTICO: ¿Está pagado?
          if (item.isSettled) {
            console.log("💰 [DEBUG] -> El item ESTÁ LIQUIDADO. Creando BalanceAdjustment...")
            
            const amountOwedBack = Number(item.costAtSale) * item.quantity
            const ownerId = item.variant.product.ownerId

            const adjustment = await tx.balanceAdjustment.create({
              data: {
                ownerId: ownerId,
                amount: -amountOwedBack, 
                description: `Devolución producto liquidado: ${item.description} (Venta anulada)`,
                isApplied: false
              }
            })
            console.log(`✅ [DEBUG] Ajuste creado. ID: ${adjustment.id}, Monto: ${adjustment.amount}`)

          } else {
            console.log("ℹ️ [DEBUG] -> El item NO está liquidado. No se genera deuda al dueño.")
          }
        }
      }
    })

    revalidatePath("/sales")
    revalidatePath("/products") 
    revalidatePath("/owners/balance")
    return { success: true }

  } catch (error: any) {
    console.error("❌ [DEBUG] Error fatal anulando venta:", error)
    return { error: error.message || "Error al anular venta" }
  }
}