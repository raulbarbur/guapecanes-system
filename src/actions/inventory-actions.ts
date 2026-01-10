// src/actions/inventory-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function registerStockMovement(formData: FormData) {
  const variantId = formData.get("variantId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = formData.get("reason") as string
  // Capturamos el tipo de movimiento del formulario
  const type = formData.get("type") as "ENTRY" | "OWNER_WITHDRAWAL"

  if (!variantId || quantity <= 0 || !type) {
    throw new Error("Datos inválidos")
  }

  try {
    // ⚠️ VALIDACIÓN CRÍTICA PARA RETIROS
    // Si van a sacar mercadería, primero vemos si alcanza.
    if (type === "OWNER_WITHDRAWAL") {
      const currentVariant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      })

      if (!currentVariant || currentVariant.stock < quantity) {
        // Retornamos un objeto de error en lugar de lanzar excepción para manejarlo en UI (simple)
        // Nota: En un sistema más avanzado, usaríamos try/catch en el componente cliente.
        console.error("Stock insuficiente")
        return { error: `Stock insuficiente. Tienes ${currentVariant?.stock || 0}` }
      }
    }

    await prisma.$transaction([
      // 1. Crear el movimiento histórico (La auditoría)
      prisma.stockMovement.create({
        data: {
          variantId,
          quantity: type === "ENTRY" ? quantity : -quantity, // Positivo si entra, Negativo si sale
          type: type, // ENTRY o OWNER_WITHDRAWAL
          reason: reason || (type === "ENTRY" ? "Ingreso manual" : "Retiro de dueño"),
          userId: "sistema",
        }
      }),

      // 2. Actualizar el stock actual (El contador)
      prisma.productVariant.update({
        where: { id: variantId },
        data: {
          stock: type === "ENTRY" 
            ? { increment: quantity } // Si entra, suma
            : { decrement: quantity } // Si sale, resta
        }
      })
    ])

    revalidatePath("/products")
    revalidatePath("/inventory") // Revalidamos la misma página por si queremos ver cambios

  } catch (error) {
    console.error("Error gestionando stock:", error)
    return { error: "Falló el movimiento de stock" }
  }

  // Redirigimos para limpiar el formulario
  redirect("/products")
}