// src/services/owner-service.ts
import { prisma } from "@/lib/prisma"

export type OwnerBalance = {
  debtFromSales: number     // Dinero por ventas no liquidadas (+)
  debtFromAdjustments: number // Ajustes manuales/devoluciones (+ o -)
  totalNetDebt: number      // El total final (lo que se va a pagar)
  pendingItemsCount: number // Cantidad de productos vendidos sin pagar
}

/**
 * Calcula la deuda exacta que el sistema (Local) tiene con un Dueño.
 * Positivo = El local debe pagarle al dueño.
 * Negativo = El dueño le debe al local (saldo a favor local).
 */
export async function getOwnerBalance(ownerId: string): Promise<OwnerBalance> {
  // 1. Buscar Ventas Pendientes (Items vendidos pero no liquidados)
  const pendingSaleItems = await prisma.saleItem.findMany({
    where: {
      isSettled: false,
      variant: { product: { ownerId: ownerId } }
    },
    select: {
      quantity: true,
      costAtSale: true
    }
  })

  // 2. Buscar Ajustes Pendientes (Créditos o Débitos manuales no aplicados)
  const pendingAdjustments = await prisma.balanceAdjustment.findMany({
    where: {
      ownerId: ownerId,
      isApplied: false
    },
    select: {
      amount: true
    }
  })

  // 3. Cálculos en memoria (Más seguro que SQL raw para manejo de decimales JS)
  const debtFromSales = pendingSaleItems.reduce((sum, item) => {
    return sum + (Number(item.costAtSale) * item.quantity)
  }, 0)

  const debtFromAdjustments = pendingAdjustments.reduce((sum, adj) => {
    return sum + Number(adj.amount)
  }, 0)

  const totalNetDebt = debtFromSales + debtFromAdjustments

  return {
    debtFromSales,
    debtFromAdjustments,
    totalNetDebt,
    pendingItemsCount: pendingSaleItems.reduce((acc, item) => acc + item.quantity, 0)
  }
}