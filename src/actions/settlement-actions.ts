// src/actions/settlement-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSettlement(formData: FormData) {
  const ownerId = formData.get("ownerId") as string
  
  if (!ownerId) return { error: "ID de dueño requerido" }

  try {
    // 1. Recalcular deuda en el servidor (Fuente de la verdad)
    // No confiamos en lo que diga el frontend, recalculamos aquí.
    const pendingItems = await prisma.saleItem.findMany({
      where: {
        isSettled: false,
        variant: { product: { ownerId: ownerId } }
      }
    })

    const pendingAdjustments = await prisma.balanceAdjustment.findMany({
      where: { ownerId: ownerId, isApplied: false }
    })

    // 2. Sumas
    const debtFromSales = pendingItems.reduce((sum, item) => sum + (Number(item.costAtSale) * item.quantity), 0)
    const debtFromAdj = pendingAdjustments.reduce((sum, adj) => sum + Number(adj.amount), 0)
    
    const totalToPay = debtFromSales + debtFromAdj

    // 3. VALIDACIÓN DE NEGOCIO (Blindaje)
    // Solo permitimos liquidar si efectivamente le debemos plata al dueño.
    if (totalToPay <= 0) {
        return { 
            error: `No se puede liquidar. El saldo es $${totalToPay.toLocaleString()}. Solo se registran pagos cuando hay deuda a favor del dueño.` 
        }
    }

    // 4. TRANSACCIÓN
    await prisma.$transaction(async (tx) => {
      // A. Crear Recibo
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
          data: { isSettled: true, settlementId: newSettlement.id }
        })
      }

      // C. Marcar ajustes como aplicados
      if (pendingAdjustments.length > 0) {
        await tx.balanceAdjustment.updateMany({
            where: { id: { in: pendingAdjustments.map(a => a.id) } },
            data: { isApplied: true, settlementId: newSettlement.id }
        })
      }
    })

    revalidatePath("/owners/balance")
    revalidatePath(`/owners/settlement/${ownerId}`)
    revalidatePath(`/owners/${ownerId}`)

    // Nota: No hacemos redirect aquí para poder retornar el objeto { success: true }
    // El componente cliente (SettlementButton) debería manejar la navegación si lo desea,
    // o simplemente mostrar un éxito. 
    // Como SettlementButton es un botón simple dentro de un form action tradicional,
    // haremos un redirect exitoso a la lista general.
    
  } catch (error) {
    console.error("Error en liquidación:", error)
    return { error: "Error interno al procesar el pago." }
  }

  // Éxito: Volvemos al balance general
  redirect("/owners/balance")
}