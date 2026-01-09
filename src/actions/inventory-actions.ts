// src/actions/inventory-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function registerStockEntry(formData: FormData) {
  const variantId = formData.get("variantId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = formData.get("reason") as string

  if (!variantId || quantity <= 0) {
    throw new Error("Datos inválidos")
  }

  try {
    // TRANSACCIÓN: Auditoría + Actualización
    await prisma.$transaction([
      // 1. Crear el movimiento (La historia)
      prisma.stockMovement.create({
        data: {
          variantId,
          quantity: quantity, // Positivo porque entra
          type: "ENTRY",      // Usamos el ENUM del esquema
          reason: reason || "Ingreso manual de mercadería",
          userId: "sistema",  // Por ahora hardcodeado hasta tener login real
        }
      }),

      // 2. Actualizar el contador (El saldo actual)
      prisma.productVariant.update({
        where: { id: variantId },
        data: {
          stock: { increment: quantity } // 👈 LA MAGIA: Suma atómica
        }
      })
    ])

    revalidatePath("/products")
    
  } catch (error) {
    console.error("Error cargando stock:", error)
    return { error: "Falló la carga de stock" }
  }

  redirect("/products")
}