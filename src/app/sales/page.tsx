import { prisma } from "@/lib/prisma"
import { getLocalDateISO, getArgentinaDayRange } from "@/lib/utils"
import Link from "next/link"
import SaleRow from "@/components/SaleRow"
import { PageHeader } from "@/components/ui/shared/PageHeader"
import { AppCard } from "@/components/ui/shared/AppCard"
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

  const inputClass = "bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition shadow-sm [color-scheme:light] dark:[color-scheme:dark] w-full md:w-auto"

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      
      {/* HEADER + KPI */}
      <PageHeader 
        title="Historial de Ventas"
        description="Auditoría de caja y transacciones diarias."
      >
         <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 text-right border border-primary/20 min-w-[200px]">
            <p className="text-[10px] uppercase font-bold tracking-widest mb-0.5 opacity-80">Total Periodo</p>
            <p className="text-3xl font-black font-nunito tracking-tight">${totalPeriodo.toLocaleString()}</p>
            <p className="text-[10px] font-bold opacity-60">{cantVentas} operaciones</p>
        </div>
      </PageHeader>

      {/* BARRA DE FILTROS */}
      <AppCard className="p-4 md:p-5">
        <form className="flex flex-col md:flex-row items-end gap-4">
            <div className="grid grid-cols-2 md:flex md:flex-row gap-4 w-full md:w-auto">
                {/* Desde */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desde</label>
                    <input 
                        name="dateFrom" 
                        type="date" 
                        defaultValue={fromStr}
                        className={inputClass}
                    />
                </div>

                {/* Hasta */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hasta</label>
                    <input 
                        name="dateTo" 
                        type="date" 
                        defaultValue={toStr}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Método */}
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Medio Pago</label>
                <select 
                    name="method" 
                    defaultValue={method || ""}
                    className={cn(inputClass, "md:min-w-[140px]")}
                >
                    <option value="">Todos</option>
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                </select>
            </div>

            <button className="w-full md:w-auto bg-foreground hover:bg-foreground/80 text-background px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 h-[42px]">
                Filtrar
            </button>
            
            {(dateFrom || dateTo || method) && (
                <Link href="/sales" className="w-full md:w-auto text-center text-xs font-bold text-destructive hover:underline py-3 px-2">
                    Borrar Filtros
                </Link>
            )}
        </form>
      </AppCard>

      {/* TABLA DE RESULTADOS */}
      <AppCard noPadding>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="hidden md:table-header-group bg-muted/50 text-muted-foreground uppercase text-xs font-bold border-b border-border">
                <tr>
                    <th className="p-4 pl-6">Fecha</th>
                    <th className="p-4">Método</th>
                    <th className="p-4">Total</th>
                    <th className="p-4 text-center">Detalle</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border block md:table-row-group">
                {sales.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-12 text-center text-muted-foreground block md:table-cell">
                            <span className="text-4xl block mb-2 opacity-50">📅</span>
                            No se encontraron ventas para este filtro.
                        </td>
                    </tr>
                ) : (
                    sales.map(sale => {
                        // FIX: Conversión explícita de TODOS los campos Decimal
                        const saleForClient = {
                            ...sale,
                            total: Number(sale.total),
                            items: sale.items.map(i => ({
                                ...i,
                                priceAtSale: Number(i.priceAtSale),
                                costAtSale: i.costAtSale ? Number(i.costAtSale) : 0 // 👈 FIX AQUÍ
                            }))
                        }
                        return <SaleRow key={sale.id} sale={saleForClient} />
                    })
                )}
            </tbody>
            </table>
        </div>
      </AppCard>
    </div>
  )
}