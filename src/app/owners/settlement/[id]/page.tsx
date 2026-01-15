// src/app/owners/settlement/[id]/page.tsx

import { prisma } from "@/lib/prisma"
import { createSettlement } from "@/actions/settlement-actions"
import Link from "next/link"
import SettlementButton from "@/components/SettlementButton"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettlementPage({ params }: Props) {
  const { id } = await params
  
  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          variants: {
            include: {
              saleItems: { where: { isSettled: false }, include: { sale: true } }
            }
          }
        }
      },
      balanceAdjustments: { where: { isApplied: false } }
    }
  })

  if (!owner) return <div className="p-10">Dueño no encontrado</div>

  let totalToPay = 0
  const detailRows: any[] = []

  owner.products.forEach(p => {
    p.variants.forEach(v => {
      v.saleItems.forEach(item => {
        const subtotal = Number(item.costAtSale) * item.quantity
        totalToPay += subtotal
        detailRows.push({
          id: item.id,
          type: 'SALE',
          date: item.sale.createdAt,
          description: `${item.description} (${item.quantity} u.)`,
          amount: subtotal
        })
      })
    })
  })

  owner.balanceAdjustments.forEach(adj => {
    const amount = Number(adj.amount)
    totalToPay += amount
    detailRows.push({
      id: adj.id,
      type: 'ADJUSTMENT',
      date: adj.createdAt,
      description: adj.description, 
      amount: amount
    })
  })

  detailRows.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
      
      {/* CABECERA */}
      <div>
        <Link href="/owners/balance" className="text-sm font-bold text-primary hover:underline mb-2 block">
          ← Volver al Balance General
        </Link>
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">
          Liquidación: {owner.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Revisá el detalle antes de confirmar el pago.</p>
      </div>

      {/* CAJA DE RESUMEN Y ACCIÓN */}
      <div className="bg-card p-8 rounded-3xl border border-border shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2">Total Neto a Pagar</p>
            <p className={cn(
                "text-5xl font-black font-nunito",
                totalToPay >= 0 ? "text-foreground" : "text-green-600 dark:text-green-400"
            )}>
                ${totalToPay.toLocaleString()}
            </p>
            {totalToPay < 0 && <span className="text-xs text-green-600 dark:text-green-400 font-bold uppercase bg-green-500/10 px-2 py-1 rounded mt-2 inline-block">Saldo a favor del local</span>}
        </div>
        
        {/* Solo mostramos el botón si hay algo que mover */}
        {detailRows.length > 0 ? (
          <form action={createSettlement}>
            <input type="hidden" name="ownerId" value={owner.id} />
            <SettlementButton />
          </form>
        ) : (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-6 py-3 rounded-xl font-bold border border-green-500/20">
             ✅ DUEÑO AL DÍA
          </div>
        )}
      </div>

      {/* TABLA DE DETALLE */}
      <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-xs">
            <tr>
              <th className="p-4 pl-6">Fecha</th>
              <th className="p-4">Concepto</th>
              <th className="p-4 text-right pr-6">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {detailRows.map(row => (
              <tr key={row.id} className="hover:bg-muted/30 transition">
                <td className="p-4 pl-6 text-muted-foreground">
                    {row.date.toLocaleDateString()}
                </td>
                
                <td className="p-4 font-bold text-foreground flex items-center gap-3">
                    {row.type === 'SALE' ? (
                        <span className="text-blue-500 bg-blue-500/10 p-1 rounded text-xs">🛒</span> 
                    ) : (
                        <span className="text-orange-500 bg-orange-500/10 p-1 rounded text-xs">↩️</span>
                    )}
                    {row.description}
                </td>
                
                <td className={cn(
                    "p-4 pr-6 text-right font-mono font-bold text-base",
                    row.amount < 0 ? "text-green-600 dark:text-green-400" : "text-foreground"
                )}>
                    ${row.amount.toLocaleString()}
                </td>
              </tr>
            ))}
            
            {detailRows.length === 0 && (
                <tr>
                    <td colSpan={3} className="p-12 text-center text-muted-foreground">
                        Este dueño no tiene movimientos pendientes.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}