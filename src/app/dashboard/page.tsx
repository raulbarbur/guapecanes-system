// src/app/dashboard/page.tsx
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getLocalDateISO } from "@/lib/utils"

export default async function DashboardPage() {
  const now = new Date()
  
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const todayStr = getLocalDateISO() 
  const startOfToday = new Date(`${todayStr}T00:00:00`)
  const endOfToday = new Date(`${todayStr}T23:59:59`)

  // Consultas Paralelas
  const [monthSales, todaySales, todayAppointments, lowStockVariants] = await Promise.all([
    // Ventas Mes
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: firstDayOfMonth, lt: nextMonth }
      },
      include: { items: true }
    }),
    // Ventas Hoy (Necesitamos saber el paymentMethod)
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    }),
    // Turnos Hoy
    prisma.appointment.findMany({
      where: {
        startTime: { gte: startOfToday, lte: endOfToday },
        status: { not: 'CANCELLED' }
      },
      include: { pet: true },
      orderBy: { startTime: 'asc' }
    }),
    // Stock Bajo
    prisma.productVariant.findMany({
      where: { stock: { lte: 3 } },
      include: { product: true },
      orderBy: { stock: 'asc' },
      take: 5
    })
  ])

  // Cálculos Mensuales
  let monthRevenue = 0
  let monthCost = 0
  monthSales.forEach(sale => {
    monthRevenue += Number(sale.total)
    sale.items.forEach(item => { if (item.variantId) monthCost += Number(item.costAtSale) * item.quantity })
  })
  const monthProfit = monthRevenue - monthCost
  const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0

  // Cálculos Diarios (Desglose por Medio de Pago)
  const todayStats = {
    total: 0,
    cash: 0,
    digital: 0, // Transfer + Tarjetas
    transactions: todaySales.length
  }

  todaySales.forEach(sale => {
    const amount = Number(sale.total)
    todayStats.total += amount
    if (sale.paymentMethod === 'CASH') {
        todayStats.cash += amount
    } else {
        todayStats.digital += amount
    }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tablero de Control</h1>
      
      <p className="text-gray-500 mb-8 capitalize">
        Resumen del {startOfToday.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}.
      </p>

      {/* SECCIÓN 1: CAJA DEL DÍA DETALLADA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Caja de Hoy (Principal) */}
        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Ventas de Hoy</p>
                <p className="text-4xl font-bold mt-2">${todayStats.total.toLocaleString()}</p>
                <div className="mt-4 flex gap-4 text-sm">
                    <div>
                        <span className="block text-green-400 font-bold">💵 ${todayStats.cash.toLocaleString()}</span>
                        <span className="text-slate-500 text-xs">Efectivo</span>
                    </div>
                    <div className="border-l border-slate-700 pl-4">
                        <span className="block text-blue-400 font-bold">💳 ${todayStats.digital.toLocaleString()}</span>
                        <span className="text-slate-500 text-xs">Digital</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Acumulado Mes */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
            <p className="text-gray-500 text-sm font-bold uppercase">Facturación Mes</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">${monthRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">
                Ganancia Estimada: <span className="text-green-600 font-bold">${monthProfit.toLocaleString()}</span>
            </p>
        </div>

        {/* Rentabilidad */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
            <p className="text-gray-500 text-sm font-bold uppercase">Margen Promedio</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{monthMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">Sobre ventas totales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AGENDA HOY */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">📅 Agenda de Hoy</h2>
                <Link href="/agenda" className="text-sm text-blue-600 hover:underline">Ver completa →</Link>
            </div>
            {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No hay turnos para hoy.</div>
            ) : (
                <div className="divide-y">
                    {todayAppointments.map(appt => {
                        const time = appt.startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
                        return (
                            <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{time}</span>
                                    <div>
                                        <p className="font-bold text-gray-800">{appt.pet.name}</p>
                                        <p className="text-xs text-gray-500">{appt.pet.breed} - {appt.pet.ownerName}</p>
                                    </div>
                                </div>
                                <div>
                                    {appt.status === 'PENDING' && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>}
                                    {appt.status === 'BILLED' && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Cobrado</span>}
                                    {appt.status === 'COMPLETED' && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Listo</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        {/* ALERTAS STOCK */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 border-b bg-red-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-red-800">⚠️ Alertas de Stock</h2>
                <Link href="/inventory" className="text-sm text-red-600 hover:underline">Gestionar →</Link>
            </div>
            {lowStockVariants.length === 0 ? (
                <div className="p-8 text-center text-gray-400">✅ Inventario saludable.</div>
            ) : (
                <div className="divide-y">
                    {lowStockVariants.map(v => (
                        <div key={v.id} className="p-4 flex items-center justify-between hover:bg-red-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">📦</div>
                                <div>
                                    <p className="font-bold text-gray-800">{v.product.name}</p>
                                    <p className="text-xs text-gray-500">Var: {v.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-bold ${v.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{v.stock}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Unidades</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  )
}