// src/app/owners/[id]/page.tsx
//export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OwnerProfilePage({ params }: Props) {
  const { id } = await params

  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      products: {
        where: { isActive: true },
        include: { 
            variants: {
                include: {
                    saleItems: {
                        where: { 
                            sale: { 
                                status: 'COMPLETED',
                                paymentStatus: 'PAID' // 👈 FILTRO
                            } 
                        }
                    }
                }
            } 
        }
      },
      settlements: {
        orderBy: { createdAt: 'desc' },
        take: 20 
      },
      balanceAdjustments: { where: { isApplied: false } }
    }
  })

  if (!owner) return notFound()

  const activeInventory = owner.products.flatMap(p => 
    p.variants.filter(v => v.stock > 0).map(v => ({
      name: v.name === 'Estándar' ? p.name : `${p.name} - ${v.name}`,
      price: Number(v.salePrice),
      cost: Number(v.costPrice),
      stock: v.stock,
      image: v.imageUrl
    }))
  )

  let debtFromSales = 0
  
  owner.products.forEach(p => {
      p.variants.forEach(v => {
          v.saleItems.forEach(item => {
              const pendingQty = item.quantity - item.settledQuantity
              if (pendingQty > 0) {
                  debtFromSales += (Number(item.costAtSale) * pendingQty)
              }
          })
      })
  })

  const debtFromAdj = owner.balanceAdjustments.reduce((sum, adj) => sum + Number(adj.amount), 0)
  const totalDebt = debtFromSales + debtFromAdj

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
            <Link href="/owners" className="text-xs font-bold text-primary hover:underline mb-2 block">← Volver al listado</Link>
            <h1 className="text-4xl font-black text-foreground flex items-center gap-3 font-nunito">
                {owner.name}
                {!owner.isActive && <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded border border-destructive/20">INACTIVO</span>}
            </h1>
            <div className="mt-2 text-muted-foreground flex flex-col gap-1 text-sm">
                <p>📧 {owner.email || "Sin email"}</p>
                <p>📞 {owner.phone || "Sin teléfono"}</p>
            </div>
            <div className="mt-4">
                <Link 
                    href={`/owners/${owner.id}/edit`}
                    className="text-xs font-bold bg-card text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition"
                >
                    ✏️ EDITAR DATOS
                </Link>
            </div>
        </div>

        {/* CAJA DE ESTADO DE CUENTA (KPI) */}
        <div className={cn(
            "p-6 rounded-3xl shadow-lg border min-w-[300px] flex flex-col justify-between",
            totalDebt > 0 
                ? 'bg-slate-900 dark:bg-card text-white dark:text-foreground border-slate-800 dark:border-border' 
                : 'bg-green-600 dark:bg-green-900/20 text-white dark:text-green-400 border-green-500 dark:border-green-900/50'
        )}>
            <div>
                <p className="text-xs font-bold uppercase opacity-70 mb-1">Saldo Pendiente</p>
                <p className="text-4xl font-black mb-4 tracking-tight">${totalDebt.toLocaleString()}</p>
            </div>
            
            {totalDebt !== 0 ? (
                <Link 
                    href={`/owners/settlement/${owner.id}`}
                    className="block text-center bg-white text-slate-900 dark:bg-primary dark:text-primary-foreground font-bold py-3 rounded-xl shadow hover:scale-[1.02] transition active:scale-95 text-sm"
                >
                    {totalDebt > 0 ? "💸 LIQUIDAR (PAGAR)" : "⚖️ AJUSTAR SALDO"}
                </Link>
            ) : (
                <div className="flex items-center gap-2 text-sm font-bold bg-white/20 p-2 rounded-lg">
                    <span>✅</span> Todo al día
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: INVENTARIO ACTUAL */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="font-bold text-foreground">📦 En Stock ({activeInventory.length})</h2>
                <span className="text-xs text-muted-foreground">Mercadería en el local</span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y divide-border custom-scrollbar">
                {activeInventory.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground opacity-60">Este dueño no tiene productos activos.</div>
                ) : (
                    activeInventory.map((item, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-muted/30 transition">
                            <div className="flex items-center gap-3">
                                {item.image ? (
                                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover border border-border" alt={item.name} />
                                ) : (
                                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-[8px] font-bold text-muted-foreground border border-border">FOTO</div>
                                )}
                                <div>
                                    <p className="font-bold text-sm text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Stock: {item.stock} u.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-foreground text-sm">${item.price}</p>
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">Costo: ${item.cost}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE PAGOS */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/30">
                <h2 className="font-bold text-foreground">📜 Historial de Pagos</h2>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y divide-border custom-scrollbar">
                {owner.settlements.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground opacity-60">Nunca se le ha pagado.</div>
                ) : (
                    owner.settlements.map(settlement => (
                        <div key={settlement.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition group">
                            <div>
                                <p className="font-bold text-foreground text-sm">
                                    {settlement.createdAt.toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                                    REF: {settlement.id.slice(0, 8)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-base font-black text-green-600 dark:text-green-400">
                                    ${Number(settlement.totalAmount).toLocaleString()}
                                </span>
                                <Link 
                                    href={`/settlements/${settlement.id}`}
                                    className="px-3 py-1.5 bg-background text-foreground rounded-lg text-xs font-bold border border-border hover:bg-accent transition"
                                >
                                    Ver Recibo
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  )
}