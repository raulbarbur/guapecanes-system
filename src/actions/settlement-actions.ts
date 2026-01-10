// src/actions/settlement-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSettlement(formData: FormData) {
  const ownerId = formData.get("ownerId") as string
  
  if (!ownerId) throw new Error("ID de dueño requerido")

  try {
    // 1. SEGURIDAD: Recalculamos todo en el servidor.
    
    // A. Buscar Ventas Pendientes (Suman deuda)
    const pendingItems = await prisma.saleItem.findMany({
      where: {
        isSettled: false,
        variant: {
          product: { ownerId: ownerId }
        }
      }
    })

    // B. Buscar Ajustes Pendientes (Restan deuda, generalmente)
    const pendingAdjustments = await prisma.balanceAdjustment.findMany({
      where: {
        ownerId: ownerId,
        isApplied: false
      }
    })

    if (pendingItems.length === 0 && pendingAdjustments.length === 0) {
      return { error: "No hay movimientos pendientes para liquidar." }
    }

    // 2. Calcular Totales
    const totalSales = pendingItems.reduce((sum, item) => {
      return sum + (Number(item.costAtSale) * item.quantity)
    }, 0)

    const totalAdjustments = pendingAdjustments.reduce((sum, adj) => {
      return sum + Number(adj.amount)
    }, 0)

    // Total Neto (Suma algebraica)
    const totalToPay = totalSales + totalAdjustments

    // 3. TRANSACCIÓN ATÓMICA
    await prisma.$transaction(async (tx) => {
      // A. Crear la Cabecera ("El Recibo")
      const newSettlement = await tx.settlement.create({
        data: {
          ownerId,
          totalAmount: totalToPay,
        }
      })

      // B. Marcar items como pagados
      if (pendingItems.length > 0) {
        await tx.saleItem.updateMany({
          where: { id: { in: pendingItems.map(i => i.id) } },
          data: {
            isSettled: true,
            settlementId: newSettlement.id
          }
        })
      }

      // C. Marcar ajustes como aplicados
      if (pendingAdjustments.length > 0) {
        await tx.balanceAdjustment.updateMany({
            where: { id: { in: pendingAdjustments.map(a => a.id) } },
            data: {
                isApplied: true,
                settlementId: newSettlement.id
            }
        })
      }
    })

    revalidatePath("/owners/balance")

  } catch (error) {
    console.error("Error en liquidación:", error)
    return { error: "Error al procesar el pago." }
  }

  redirect("/owners/balance")
}