// src/actions/inventory-bulk-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type StockImportRow = {
  variantId: string
  quantity: number
  reason: string
}

export async function bulkUpdateStock(rows: StockImportRow[]) {
  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  try {
    // Usamos transaction para asegurar integridad, pero dado que puede ser mucha data,
    // procesaremos en lote. Si falla uno, no queremos que fallen todos en este caso de uso masivo,
    // así que iteramos.
    
    for (const row of rows) {
      // 1. Validaciones básicas
      if (!row.variantId) continue;
      if (row.quantity === 0 || isNaN(row.quantity)) continue; // Ignoramos filas vacías o 0

      // 2. Ejecutar Movimiento
      try {
        await prisma.$transaction([
            // A. Registrar Historial
            prisma.stockMovement.create({
                data: {
                    variantId: row.variantId,
                    quantity: row.quantity, // Puede ser positivo (entrada) o negativo (ajuste)
                    type: row.quantity > 0 ? "ENTRY" : "ADJUSTMENT",
                    reason: row.reason || "Carga Masiva Excel",
                    userId: "sistema"
                }
            }),
            // B. Actualizar Contador
            prisma.productVariant.update({
                where: { id: row.variantId },
                data: { stock: { increment: row.quantity } }
            })
        ])
        successCount++
      } catch (err) {
        errorCount++
        errors.push(`ID ${row.variantId}: Falló actualización.`)
      }
    }

    revalidatePath("/inventory")
    revalidatePath("/products")

    return { success: true, count: successCount, errors }

  } catch (error) {
    console.error("Error bulk stock:", error)
    return { success: false, error: "Error crítico en el servidor." }
  }
}