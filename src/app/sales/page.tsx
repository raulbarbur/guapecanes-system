// src/app/sales/page.tsx
import { prisma } from "@/lib/prisma"
import { getLocalDateISO, getArgentinaDayRange } from "@/lib/utils"
import Link from "next/link"
import SaleRow from "@/components/SaleRow"
import { cn } from "@/lib/utils"

interface Props {
  searchParams: Promise<{ 
    dateFrom?: string 
    dateTo?: string 
    method?: string
  }>
}

export default async function SalesHistoryPage({ searchParams }: Props) {
  const { dateFrom, dateTo, method } = await searchParams

  const today = getLocalDateISO()
  const fromStr = dateFrom || today
  const toStr = dateTo || today

  const fromDate = getArgentinaDayRange(fromStr).start
  const toDate = getArgentinaDayRange(toStr).end

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
      paymentMethod: method ? { equals: method } : undefined
    },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  })

  const totalPeriodo = sales
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Number(s.total), 0)

  const cantVentas = sales.filter(s => s.status === 'COMPLETED').length

  // Clases compartidas para inputs
  const inputClass = "bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition shadow-sm [color-scheme:light] dark:[color-scheme:dark]"

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER + KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Historial de Ventas</h1>
            <p className="text-sm text-muted-foreground mt-1">Auditoría de caja y transacciones.</p>
        </div>
        
        {/* Resumen Flotante */}
        <div className="bg-foreground text-background px-6 py-4 rounded-2xl shadow-xl text-right border border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Total Periodo</p>
            <p className="text-3xl font-black font-nunito tracking-tight">${totalPeriodo.toLocaleString()}</p>
            <p className="text-xs font-bold opacity-60">{cantVentas} operaciones</p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-card p-5 rounded-3xl shadow-sm border border-border">
        <form className="flex flex-wrap items-end gap-4">
            
            {/* Desde */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desde</label>
                <input 
                    name="dateFrom" 
                    type="date" 
                    defaultValue={fromStr}
                    className={inputClass}
                />
            </div>

            {/* Hasta */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hasta</label>
                <input 
                    name="dateTo" 
                    type="date" 
                    defaultValue={toStr}
                    className={inputClass}
                />
            </div>

            {/* Método */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Medio Pago</label>
                <select 
                    name="method" 
                    defaultValue={method || ""}
                    className={cn(inputClass, "min-w-[140px]")}
                >
                    <option value="">Todos</option>
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                </select>
            </div>

            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition active:scale-95 h-[42px]">
                Filtrar
            </button>
            
            {(dateFrom || dateTo || method) && (
                <Link href="/sales" className="text-xs font-bold text-destructive hover:underline py-3 px-2">
                    Borrar Filtros
                </Link>
            )}
        </form>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold">
                <tr>
                <th className="p-4 pl-6">Fecha</th>
                <th className="p-4">Método</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-center">Detalle</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {sales.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-12 text-center text-muted-foreground">
                            <span className="text-4xl block mb-2 opacity-50">📅</span>
                            No hay ventas en este período.
                        </td>
                    </tr>
                ) : (
                    sales.map(sale => {
                        const saleForClient = {
                            ...sale,
                            total: Number(sale.total),
                            items: sale.items.map(i => ({
                                ...i,
                                priceAtSale: Number(i.priceAtSale)
                            }))
                        }
                        return <SaleRow key={sale.id} sale={saleForClient} />
                    })
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}