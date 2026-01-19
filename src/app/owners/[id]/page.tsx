import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cn } from "@/lib/utils"
import { InfoCard } from "@/components/ui/InfoCard" // << IMPORTAR

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
                                paymentStatus: 'PAID' 
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <Link href="/owners" className="text-xs font-bold text-primary hover:underline mb-2 block">← Volver al listado</Link>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground font-nunito">{owner.name}</h1>
                    {!owner.isActive && <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded border border-destructive/20 font-bold">INACTIVO</span>}
                    <Link 
                        href={`/owners/${owner.id}/edit`}
                        className="text-xs font-bold bg-card text-muted-foreground px-2 py-1 rounded border hover:text-foreground transition"
                    >
                        ✏️
                    </Link>
                </div>
            </div>

            {/* KPI DE DEUDA */}
            <div className={cn(
                "p-4 rounded-2xl shadow-md border min-w-[280px] flex items-center justify-between gap-4 w-full md:w-auto",
                totalDebt > 0 
                    ? 'bg-slate-900 dark:bg-card text-white dark:text-foreground border-slate-800' 
                    : 'bg-green-600 dark:bg-green-900/20 text-white dark:text-green-400 border-green-500'
            )}>
                <div>
                    <p className="text-[10px] font-bold uppercase opacity-70">Saldo Pendiente</p>
                    <p className="text-3xl font-black tracking-tight">${totalDebt.toLocaleString()}</p>
                </div>
                
                {totalDebt !== 0 ? (
                    <Link 
                        href={`/owners/settlement/${owner.id}`}
                        className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-xs shadow hover:scale-105 transition"
                    >
                        {totalDebt > 0 ? "PAGAR" : "AJUSTAR"}
                    </Link>
                ) : (
                    <span className="text-2xl">✅</span>
                )}
            </div>
        </div>
        
        {/* GRILLA CONTACTO */}
        <div className="flex flex-wrap gap-3">
            <InfoCard icon="📧" label="Email" value={owner.email} />
            <InfoCard icon="📞" label="Teléfono" value={owner.phone} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* INVENTARIO */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                <h2 className="font-bold text-foreground">📦 En Stock ({activeInventory.length})</h2>
                <span className="text-xs text-muted-foreground">Mercadería activa</span>
            </div>
            
            <div className="overflow-y-auto divide-y divide-border custom-scrollbar flex-1">
                {activeInventory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                        <span className="text-4xl mb-2 grayscale">📦</span>
                        <p>Sin stock activo</p>
                    </div>
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

        {/* HISTORIAL PAGOS */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-border bg-muted/30 shrink-0">
                <h2 className="font-bold text-foreground">📜 Últimos Pagos</h2>
            </div>
            
            <div className="overflow-y-auto divide-y divide-border custom-scrollbar flex-1">
                {owner.settlements.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                        <span className="text-4xl mb-2 grayscale">💸</span>
                        <p>Sin pagos registrados</p>
                    </div>
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