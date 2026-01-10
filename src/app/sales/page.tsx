// src/app/sales/page.tsx
import { prisma } from "@/lib/prisma"
import { getLocalDateISO, getArgentinaDayRange } from "@/lib/utils" // 👈 Importamos
import Link from "next/link"
import SaleRow from "@/components/SaleRow"

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

  // 1. Usar Helper para rangos (Garantiza GMT-3)
  const fromDate = getArgentinaDayRange(fromStr).start
  const toDate = getArgentinaDayRange(toStr).end

  // 2. Consulta a DB
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: fromDate,
        lte: toDate
      },
      paymentMethod: method ? { equals: method } : undefined
    },
    include: {
      items: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // 3. Cálculos de Totales
  const totalPeriodo = sales
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Number(s.total), 0)

  const cantVentas = sales.filter(s => s.status === 'COMPLETED').length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
        
        {/* Resumen Flotante */}
        <div className="bg-slate-900 text-white px-6 py-3 rounded-lg shadow-lg text-right">
            <p className="text-xs text-slate-400 uppercase font-bold">Total Periodo</p>
            <p className="text-2xl font-bold">${totalPeriodo.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{cantVentas} operaciones</p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <form className="flex flex-wrap items-end gap-4">
            
            {/* Desde */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
                <input 
                    name="dateFrom" 
                    type="date" 
                    defaultValue={fromStr}
                    className="border p-2 rounded text-sm font-bold"
                />
            </div>

            {/* Hasta */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
                <input 
                    name="dateTo" 
                    type="date" 
                    defaultValue={toStr}
                    className="border p-2 rounded text-sm font-bold"
                />
            </div>

            {/* Método */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Medio Pago</label>
                <select 
                    name="method" 
                    defaultValue={method || ""}
                    className="border p-2 rounded text-sm bg-white min-w-[120px]"
                >
                    <option value="">Todos</option>
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia</option>
                </select>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-bold shadow transition">
                Filtrar
            </button>
            
            {(dateFrom || dateTo || method) && (
                <Link href="/sales" className="text-sm text-red-500 underline py-2">
                    Borrar Filtros
                </Link>
            )}
        </form>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-lg shadow overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="p-4">Fecha</th>
              <th className="p-4">Método</th>
              <th className="p-4">Total</th>
              <th className="p-4 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.length === 0 ? (
                <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400">
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
  )
}