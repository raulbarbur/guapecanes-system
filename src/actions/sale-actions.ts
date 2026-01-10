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
    // Variable para guardar la venta creada y devolverla
    let createdSaleId = ""
    let createdDate = new Date()

    await prisma.$transaction(async (tx) => {
      let totalReal = 0
      const saleItemsData = []
      const appointmentIdsToBill: string[] = []

      for (const item of cart) {
        // A. PRODUCTO
        if (item.type === 'PRODUCT') {
            const variant = await tx.productVariant.findUnique({
                where: { id: item.id },
                include: { product: true }
            })

            if (!variant) throw new Error(`Producto no encontrado: ${item.description}`)
            if (variant.stock < item.quantity) throw new Error(`Stock insuficiente: ${variant.product.name}`)

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

      // Crear Venta Cabecera
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
      
      // Guardamos datos para retornar
      createdSaleId = sale.id
      createdDate = sale.createdAt

      // Actualizar Turnos
      if (appointmentIdsToBill.length > 0) {
        await tx.appointment.updateMany({
            where: { id: { in: appointmentIdsToBill } },
            data: { status: 'BILLED' }
        })
      }
    })

    revalidatePath("/products")
    revalidatePath("/pos")
    revalidatePath("/agenda")
    revalidatePath("/dashboard")
    
    // Retornamos los datos clave
    return { success: true, saleId: createdSaleId, date: createdDate }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

// --- ANULAR VENTA (Sin cambios, pero incluimos el archivo completo por la regla) ---
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