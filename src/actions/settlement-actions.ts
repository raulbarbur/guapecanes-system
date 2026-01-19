// src/actions/settlement-actions.ts
'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

type SettlementItemInput = {
  id: string
  type: 'SALE' | 'ADJUSTMENT'
  quantity?: number 
}

// R-06: Helper de redondeo para moneda
const round = (num: number) => Math.round(num * 100) / 100

export async function createSettlement(formData: FormData) {
  // R-01: Blindaje de seguridad
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { error: "Requiere permisos de Administrador para liquidar." }
  }

  const ownerId = formData.get("ownerId") as string
  const selectionJson = formData.get("selection") as string
  
  if (!ownerId || !selectionJson) {
    return { error: "Datos incompletos para la liquidación." }
  }

  let selection: SettlementItemInput[] = []
  try {
    selection = JSON.parse(selectionJson)
  } catch (e) {
    return { error: "Formato de selección inválido." }
  }

  if (selection.length === 0) {
    return { error: "No seleccionaste ningún ítem para pagar." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      
      const newSettlement = await tx.settlement.create({
        data: {
          ownerId,
          totalAmount: 0,
        }
      })

      let calculatedTotal = 0

      for (const item of selection) {
        
        if (item.type === 'SALE') {
            if (!item.quantity || item.quantity <= 0) {
                throw new Error(`Cantidad inválida para item ${item.id}`)
            }

            const dbItem = await tx.saleItem.findUnique({
                where: { id: item.id },
                include: { 
                    variant: { include: { product: true } },
                    sale: true 
                }
            })

            if (!dbItem) throw new Error(`Item de venta no encontrado: ${item.id}`)
            
            if (dbItem.variant?.product.ownerId !== ownerId) {
                throw new Error(`El item ${dbItem.description} no pertenece a este dueño.`)
            }

            if (dbItem.sale.paymentStatus !== 'PAID') {
                throw new Error(`No se puede liquidar "${dbItem.description}" porque el cliente AÚN NO PAGÓ (Es Fiado).`)
            }

            const pendingQty = dbItem.quantity - dbItem.settledQuantity
            if (item.quantity > pendingQty) {
                throw new Error(`Error en ${dbItem.description}: Intentás pagar ${item.quantity} pero solo se deben ${pendingQty}.`)
            }

            // R-06: Cálculo con Redondeo
            const lineAmount = round(Number(dbItem.costAtSale) * item.quantity)
            calculatedTotal = round(calculatedTotal + lineAmount)

            await tx.settlementLine.create({
                data: {
                    settlementId: newSettlement.id,
                    saleItemId: dbItem.id,
                    quantity: item.quantity,
                    amount: lineAmount
                }
            })

            await tx.saleItem.update({
                where: { id: dbItem.id },
                data: { settledQuantity: { increment: item.quantity } }
            })

        } else if (item.type === 'ADJUSTMENT') {
            const dbAdj = await tx.balanceAdjustment.findUnique({
                where: { id: item.id }
            })

            if (!dbAdj) throw new Error(`Ajuste no encontrado: ${item.id}`)
            if (dbAdj.ownerId !== ownerId) throw new Error("Ajuste ajeno.")
            if (dbAdj.isApplied) throw new Error("Este ajuste ya fue pagado.")

            // R-06: Redondeo de ajuste
            const adjAmount = Number(dbAdj.amount)
            calculatedTotal = round(calculatedTotal + adjAmount)

            await tx.balanceAdjustment.update({
                where: { id: dbAdj.id },
                data: { 
                    isApplied: true,
                    settlementId: newSettlement.id
                }
            })
        }
      }

      if (calculatedTotal <= 0) {
        throw new Error(`El total a pagar es $${calculatedTotal}. No se pueden registrar liquidaciones negativas o en cero.`)
      }

      await tx.settlement.update({
        where: { id: newSettlement.id },
        data: { totalAmount: calculatedTotal }
      })
    })

    revalidatePath("/owners/balance")
    revalidatePath(`/owners/settlement/${ownerId}`)
    revalidatePath(`/owners/${ownerId}`)
    return { success: true }
    
  } catch (error: any) {
    console.error("Error en liquidación:", error)
    return { error: error.message || "Error interno al procesar el pago." }
  }
}