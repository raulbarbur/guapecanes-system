// src/app/dashboard/page.tsx
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getLocalDateISO } from "@/lib/utils" // 👈 Importamos

export default async function DashboardPage() {
  const now = new Date()
  
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // 👇 CAMBIO CLAVE: Usamos la fecha local segura
  const todayStr = getLocalDateISO() 
  const startOfToday = new Date(`${todayStr}T00:00:00`)
  const endOfToday = new Date(`${todayStr}T23:59:59`)

  // ... (El resto del código sigue IGUAL) ...
  
  const [monthSales, todaySales, todayAppointments, lowStockVariants] = await Promise.all([
      // ... tus consultas prisma ...
      prisma.sale.findMany({
        where: {
            status: "COMPLETED",
            createdAt: { gte: firstDayOfMonth, lt: nextMonth }
        },
        include: { items: true }
      }),
      prisma.sale.findMany({
        where: {
            status: "COMPLETED",
            createdAt: { gte: startOfToday, lte: endOfToday }
        }
      }),
      prisma.appointment.findMany({
        where: {
            startTime: { gte: startOfToday, lte: endOfToday },
            status: { not: 'CANCELLED' }
        },
        include: { pet: true },
        orderBy: { startTime: 'asc' }
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 3 } },
        include: { product: true },
        orderBy: { stock: 'asc' },
        take: 5
      })
  ])

  // ... (Resto de cálculos y renderizado igual) ...
  
  // (Copiá el resto del archivo anterior o avisame si necesitás que lo pegue todo de nuevo)
  // Lo importante es que uses `todayStr` generado por `getLocalDateISO()`
  
  // Para simplificar, te paso solo el bloque de return, asumiendo que mantenés los cálculos:
  // ...
  
  // Calculos métricas (igual que antes)
  let monthRevenue = 0
  let monthCost = 0
  monthSales.forEach(sale => {
    monthRevenue += Number(sale.total)
    sale.items.forEach(item => { if (item.variantId) monthCost += Number(item.costAtSale) * item.quantity })
  })
  const monthProfit = monthRevenue - monthCost
  const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0
  const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0)
  const todayTransactions = todaySales.length

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tablero de Control</h1>
      <p className="text-gray-500 mb-8">
        {/* Mostramos la fecha formateada localmente */}
        Visión general del negocio hoy, {new Date(todayStr).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}.
      </p>
      
      {/* ... Resto del JSX idéntico al anterior ... */}
      
      {/* SECCIÓN 1: CAJA DEL DÍA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition">
            <p className="text-green-100 text-sm font-bold uppercase tracking-wider">Caja de Hoy</p>
            <p className="text-4xl font-bold mt-2">${todayRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-1">{todayTransactions} ventas registradas</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
            <p className="text-gray-500 text-sm font-bold uppercase">Acumulado Mes</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">${monthRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">
                Ganancia Neta: <span className="text-green-600 font-bold">${monthProfit.toLocaleString()}</span>
            </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
            <p className="text-gray-500 text-sm font-bold uppercase">Rentabilidad</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{monthMargin.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">Margen promedio sobre ventas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        // Ajustamos visualización de hora
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