// src/app/owners/settlement/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import SettlementForm from "@/components/SettlementForm"

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
              // Solo ventas completadas Y PAGADAS
              saleItems: { 
                where: { 
                    sale: { 
                        status: 'COMPLETED',
                        paymentStatus: 'PAID' // 👈 FILTRO
                    } 
                },
                include: { sale: true } 
              }
            }
          }
        }
      },
      balanceAdjustments: { where: { isApplied: false } }
    }
  })

  if (!owner) {
      return <div className="p-10 text-center">Dueño no encontrado</div>
  }

  const items: any[] = []

  owner.products.forEach(p => {
    p.variants.forEach(v => {
      v.saleItems.forEach(item => {
        const pendingQty = item.quantity - item.settledQuantity
        
        if (pendingQty > 0) {
            items.push({
              id: item.id,
              type: 'SALE',
              date: item.sale.createdAt,
              description: item.description,
              pendingQuantity: pendingQty,
              cost: Number(item.costAtSale),
              isAdjustment: false
            })
        }
      })
    })
  })

  owner.balanceAdjustments.forEach(adj => {
    items.push({
      id: adj.id,
      type: 'ADJUSTMENT',
      date: adj.createdAt,
      description: `AJUSTE: ${adj.description}`, 
      pendingQuantity: 1, 
      cost: Number(adj.amount),
      isAdjustment: true
    })
  })

  items.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      
      {/* CABECERA */}
      <div>
        <Link href="/owners/balance" className="text-sm font-bold text-primary hover:underline mb-2 block">
          ← Volver al Balance General
        </Link>
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">
          Liquidación: {owner.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
            Seleccioná los ítems que querés pagar.
        </p>
      </div>

      {items.length > 0 ? (
          <SettlementForm ownerId={owner.id} items={items} />
      ) : (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-8 rounded-3xl font-bold border border-green-500/20 text-center text-lg">
             🎉 ¡Excelente! Este dueño no tiene saldos pendientes.
          </div>
      )}
    </div>
  )
}