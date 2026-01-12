// src/actions/settlement-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSettlement(formData: FormData) {
  const ownerId = formData.get("ownerId") as string
  
  if (!ownerId) return { error: "ID de dueño requerido" }

  try {
    // 1. BUSCAR CANDIDATOS (Snapshot)
    // No usamos el servicio genérico getOwnerBalance aquí porque necesitamos los IDs específicos
    // para "congelar" la liquidación y evitar race conditions.

    const pendingSaleItems = await prisma.saleItem.findMany({
      where: {
        isSettled: false,
        variant: { product: { ownerId: ownerId } }
      },
      select: { id: true, costAtSale: true, quantity: true }
    })

    const pendingAdjustments = await prisma.balanceAdjustment.findMany({
      where: {
        ownerId: ownerId,
        isApplied: false
      },
      select: { id: true, amount: true }
    })

    // 2. CALCULAR TOTAL A PAGAR (En memoria)
    const debtFromSales = pendingSaleItems.reduce((sum, item) => {
        return sum + (Number(item.costAtSale) * item.quantity)
    }, 0)

    const debtFromAdjustments = pendingAdjustments.reduce((sum, adj) => {
        return sum + Number(adj.amount)
    }, 0)

    const totalToPay = debtFromSales + debtFromAdjustments

    // 3. VALIDACIÓN FINANCIERA
    // Solo permitimos liquidar si el saldo es positivo (A favor del dueño).
    // Si es negativo (El dueño nos debe), esperamos a que venda más cosas para compensar.
    if (totalToPay <= 0) {
        return { 
            error: `No se puede liquidar. El saldo es $${totalToPay.toLocaleString()}. Solo se registran pagos cuando hay deuda a favor del dueño.` 
        }
    }

    // 4. TRANSACCIÓN DE ESCRITURA (Atomicidad Estricta)
    await prisma.$transaction(async (tx) => {
      
      // A. Crear Recibo (Settlement)
      const newSettlement = await tx.settlement.create({
        data: {
          ownerId,
          totalAmount: totalToPay,
        }
      })

      // B. Marcar items específicos como pagados
      // Usamos los IDs capturados en el paso 1. Si entró una venta nueva hace 1ms, 
      // no está en esta lista y quedará para la próxima. Seguro.
      if (pendingSaleItems.length > 0) {
          await tx.saleItem.updateMany({
            where: {
              id: { in: pendingSaleItems.map(i => i.id) }
            },
            data: { isSettled: true, settlementId: newSettlement.id }
          })
      }

      // C. Marcar ajustes específicos como aplicados
      if (pendingAdjustments.length > 0) {
          await tx.balanceAdjustment.updateMany({
              where: { 
                  id: { in: pendingAdjustments.map(a => a.id) }
              },
              data: { isApplied: true, settlementId: newSettlement.id }
          })
      }
    })

    revalidatePath("/owners/balance")
    revalidatePath(`/owners/settlement/${ownerId}`)
    revalidatePath(`/owners/${ownerId}`)
    
  } catch (error) {
    console.error("Error en liquidación:", error)
    return { error: "Error interno al procesar el pago." }
  }

  // Éxito: Redirigir al balance general
  redirect("/owners/balance")
}