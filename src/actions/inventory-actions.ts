// src/actions/inventory-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getVariantStockHistory, translateMovementType } from "@/services/inventory-service"
import { StockMovementType } from "@prisma/client"
import { getSession } from "@/lib/auth" // 👈 Auth

export async function registerStockMovement(formData: FormData) {
  // 1. AUTENTICACIÓN
  const session = await getSession()
  if (!session) return { error: "Sesión no válida" }

  const variantId = formData.get("variantId") as string
  const reason = formData.get("reason") as string
  const typeStr = formData.get("type") as string // Viene como string del form
  const rawQuantity = parseInt(formData.get("quantity") as string)

  // Mapeo seguro de String -> Enum Prisma
  // Validamos que sea uno de los tipos permitidos manualmente
  const allowedTypes = ["ENTRY", "OWNER_WITHDRAWAL", "ADJUSTMENT"]
  if (!allowedTypes.includes(typeStr)) {
      return { error: "Tipo de movimiento inválido" }
  }
  const type = typeStr as StockMovementType

  if (!variantId || isNaN(rawQuantity) || rawQuantity <= 0) {
    return { error: "Datos incorrectos." }
  }

  try {
    let finalQuantity = rawQuantity
    // Ajustes y Retiros restan
    if (type === "OWNER_WITHDRAWAL" || type === "ADJUSTMENT") {
        finalQuantity = -rawQuantity
    }

    // Obtener variante para chequear stock
    const currentVariant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true }
    })

    if (!currentVariant) return { error: "Producto no encontrado." }

    // Validación de stock negativo
    if (finalQuantity < 0) {
      const quantityNeeded = Math.abs(finalQuantity)
      if (currentVariant.stock < quantityNeeded) {
        return { error: `Stock insuficiente. Tenés ${currentVariant.stock}.` }
      }
    }

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          variantId,
          quantity: finalQuantity,
          type: type, 
          reason: reason || getDefaultReason(type),
          userId: session.userId, // 👈 EL USUARIO LOGUEADO
        }
      }),

      prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: finalQuantity } }
      })
    ])

    revalidatePath("/products")
    revalidatePath("/inventory")
    revalidatePath("/dashboard")

    return { success: true }

  } catch (error) {
    console.error("Error gestionando stock:", error)
    return { error: "Error interno" }
  }
}

function getDefaultReason(type: string): string {
    switch (type) {
        case "ENTRY": return "Ingreso de mercadería"
        case "OWNER_WITHDRAWAL": return "Retiro de dueño"
        case "ADJUSTMENT": return "Baja por rotura/pérdida"
        default: return "Movimiento de stock"
    }
}

// Lectura pública (usada en detalle de producto)
export async function getHistory(variantId: string) {
    if (!variantId) return { error: "ID requerido" }
    try {
        const rawHistory = await getVariantStockHistory(variantId)
        const history = rawHistory.map(h => ({
            ...h,
            typeLabel: translateMovementType(h.type)
        }))
        return { success: true, data: history }
    } catch (error) {
        return { error: "Error al obtener datos" }
    }
}