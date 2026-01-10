// src/actions/inventory-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Definimos los tipos permitidos según el Schema y la UI
type MovementType = "ENTRY" | "OWNER_WITHDRAWAL" | "ADJUSTMENT"

export async function registerStockMovement(formData: FormData) {
  const variantId = formData.get("variantId") as string
  const reason = formData.get("reason") as string
  const type = formData.get("type") as MovementType
  
  // Convertimos y validamos número
  const rawQuantity = parseInt(formData.get("quantity") as string)

  // 1. VALIDACIÓN PREVIA (Fail Fast)
  if (!variantId || !type) {
    return { error: "Faltan datos obligatorios." }
  }
  
  if (isNaN(rawQuantity) || rawQuantity <= 0) {
    return { error: "La cantidad debe ser un número positivo mayor a 0." }
  }

  try {
    // 2. DETERMINAR EL SIGNO DEL MOVIMIENTO
    // ENTRY: Suma (+)
    // OWNER_WITHDRAWAL: Resta (-)
    // ADJUSTMENT: Según UI actual es "Baja/Rotura", así que Resta (-)
    let finalQuantity = rawQuantity
    
    if (type === "OWNER_WITHDRAWAL" || type === "ADJUSTMENT") {
        finalQuantity = -rawQuantity
    }

    // 3. OBTENER VARIANTE ACTUAL (Para validar stock)
    const currentVariant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true }
    })

    if (!currentVariant) return { error: "Producto no encontrado." }

    // 4. VALIDAR STOCK PARA SALIDAS (Regla de Oro)
    // Si el movimiento es negativo, verificamos que no rompa el stock (negativo prohibido)
    if (finalQuantity < 0) {
      const quantityNeeded = Math.abs(finalQuantity)
      if (currentVariant.stock < quantityNeeded) {
        return { 
            error: `Stock insuficiente en "${currentVariant.product.name}". Tenés ${currentVariant.stock}, intentás sacar ${quantityNeeded}.` 
        }
      }
    }

    // 5. TRANSACCIÓN ATÓMICA
    await prisma.$transaction([
      // A. Crear el movimiento histórico (Auditoría)
      prisma.stockMovement.create({
        data: {
          variantId,
          quantity: finalQuantity, // Guardamos con signo (+ o -)
          type: type, 
          reason: reason || getDefaultReason(type),
          userId: "sistema", 
        }
      }),

      // B. Actualizar el stock actual (Contador)
      prisma.productVariant.update({
        where: { id: variantId },
        data: {
          stock: { increment: finalQuantity } // increment maneja restas si el número es negativo
        }
      })
    ])

    // Revalidamos caché
    revalidatePath("/products")
    revalidatePath("/inventory")
    revalidatePath("/dashboard")

    return { success: true }

  } catch (error) {
    console.error("Error gestionando stock:", error)
    return { error: "Falló el movimiento de stock. Intente nuevamente." }
  }
}

// Función auxiliar para textos por defecto
function getDefaultReason(type: MovementType): string {
    switch (type) {
        case "ENTRY": return "Ingreso de mercadería"
        case "OWNER_WITHDRAWAL": return "Retiro de dueño"
        case "ADJUSTMENT": return "Baja por rotura/pérdida"
        default: return "Movimiento de stock"
    }
}