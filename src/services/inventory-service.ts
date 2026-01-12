// src/services/inventory-service.ts
import { prisma } from "@/lib/prisma"

export type StockHistoryEntry = {
  id: string
  date: Date
  type: string      // Traducido o raw
  quantity: number  // + o -
  reason: string | null
  user: string
  balanceAfter: number | null // Futuro: Para cálculo de saldo parcial
}

/**
 * Obtiene el historial de movimientos de una variante.
 * Ordenado del más reciente al más antiguo.
 */
export async function getVariantStockHistory(variantId: string, limit = 50): Promise<StockHistoryEntry[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  // Mapeamos a una estructura limpia para el frontend
  return movements.map(m => ({
    id: m.id,
    date: m.createdAt,
    type: m.type, // ENTRY, SALE, etc.
    quantity: m.quantity,
    reason: m.reason || "Sin detalle",
    user: m.userId,
    balanceAfter: null // Por ahora null, implementar si se requiere cálculo costoso
  }))
}

/**
 * Helper para traducir los códigos técnicos a humano
 */
export function translateMovementType(type: string): string {
  const dictionary: Record<string, string> = {
    ENTRY: "🟢 Ingreso Mercadería",
    SALE: "🛒 Venta",
    ADJUSTMENT: "⚠️ Ajuste Manual",
    OWNER_WITHDRAWAL: "📦 Retiro de Dueño",
    RETURN: "↩️ Devolución",
    SALE_CANCELLED: "🚫 Venta Anulada"
  }
  return dictionary[type] || type
}