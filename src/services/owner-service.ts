// src/services/owner-service.ts
import { prisma } from "@/lib/prisma"

export type OwnerBalance = {
  debtFromSales: number
  debtFromAdjustments: number
  totalNetDebt: number
  pendingItemsCount: number
}

export async function getOwnerBalance(ownerId: string): Promise<OwnerBalance> {
  
  // 1. BUSCAR CANDIDATOS
  const allOwnerItems = await prisma.saleItem.findMany({
    where: {
      variant: { product: { ownerId: ownerId } },
      sale: { 
          status: 'COMPLETED',       // Venta válida (no anulada)
          paymentStatus: 'PAID'      // 👈 CRÍTICO: Solo pagamos si ya cobramos
      } 
    },
    select: {
      id: true,
      quantity: true,
      settledQuantity: true,
      costAtSale: true
    }
  })

  // 2. FILTRAR PENDIENTES
  const pendingItems = allOwnerItems.filter(item => item.settledQuantity < item.quantity)

  // 3. BUSCAR AJUSTES PENDIENTES
  const pendingAdjustments = await prisma.balanceAdjustment.findMany({
    where: {
      ownerId: ownerId,
      isApplied: false
    },
    select: {
      amount: true
    }
  })

  // 4. CÁLCULO
  const debtFromSales = pendingItems.reduce((sum, item) => {
    const remainingQuantity = item.quantity - item.settledQuantity
    const debtForThisItem = Number(item.costAtSale) * remainingQuantity
    return sum + debtForThisItem
  }, 0)

  const debtFromAdjustments = pendingAdjustments.reduce((sum, adj) => {
    return sum + Number(adj.amount)
  }, 0)

  const totalNetDebt = debtFromSales + debtFromAdjustments

  const pendingItemsCount = pendingItems.reduce((acc, item) => {
    return acc + (item.quantity - item.settledQuantity)
  }, 0)

  return {
    debtFromSales,
    debtFromAdjustments,
    totalNetDebt,
    pendingItemsCount
  }
}