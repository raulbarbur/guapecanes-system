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
      // 1. Calcular el total REAL en el servidor (No confiamos en el frontend)
      let totalReal = 0
      
      // Preparamos los items para guardar
      const saleItemsData = []

      for (const item of cart) {
        // Buscamos el producto en la DB para tener el precio y stock ACTUAL
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true }
        })

        if (!variant) throw new Error(`Producto ${item.variantId} no encontrado`)
        
        // Validación de Stock Crítica
        if (variant.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${variant.product.name}`)
        }

        // Sumamos al total (usando el precio de la DB)
        const subtotal = Number(variant.salePrice) * item.quantity
        totalReal += subtotal

        // Preparamos el item de venta (Snapshot de precios)
        saleItemsData.push({
          variantId: variant.id,
          description: variant.product.name, // Guardamos el nombre por si después cambia
          quantity: item.quantity,
          costAtSale: variant.costPrice,     // Guardamos el costo histórico
          priceAtSale: variant.salePrice     // Guardamos el precio histórico
        })

        // 2. Descontar Stock
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } }
        })

        // 3. Auditoría de Movimiento
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            quantity: -item.quantity, // Negativo porque sale
            type: "SALE",
            reason: "Venta Mostrador",
            userId: "sistema"
          }
        })
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
    })

    revalidatePath("/products")
    revalidatePath("/pos")
    return { success: true }

  } catch (error: any) {
    console.error("Error en venta:", error)
    return { error: error.message || "Error al procesar venta" }
  }
}

// --- AGREGAR ESTO AL FINAL DE: src/actions/sale-actions.ts ---

export async function cancelSale(saleId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Buscar la venta y sus items
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true }
      })

      if (!sale) throw new Error("Venta no encontrada")
      if (sale.status === 'CANCELLED') throw new Error("Ya está anulada")

      // 2. Marcar como ANULADA
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      // 3. Devolver el stock de cada producto
      for (const item of sale.items) {
        if (item.variantId) {
          // Devolver stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          })

          // Auditar el movimiento
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              quantity: item.quantity, // Positivo (Entra de nuevo)
              type: 'SALE_CANCELLED',
              reason: `Anulación Venta #${sale.id.slice(0, 8)}`,
              userId: 'sistema'
            }
          })
        }
      }
    })

    revalidatePath("/sales")
    revalidatePath("/products") // Para que se vea el stock actualizado
    return { success: true }

  } catch (error: any) {
    return { error: error.message }
  }
}