import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getLocalDateISO } from "@/lib/utils"

export default async function DashboardPage() {
  const now = new Date()
  const todayStr = getLocalDateISO() 
  const startOfToday = new Date(`${todayStr}T00:00:00`)
  const endOfToday = new Date(`${todayStr}T23:59:59`)

  const [todaySales, todayAppointments, lowStockVariants] = await Promise.all([
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

  const stats = todaySales.reduce((acc, sale) => {
    const amount = Number(sale.total)
    acc.total += amount
    if (sale.paymentMethod === 'CASH') acc.cash += amount
    else acc.digital += amount
    return acc
  }, { total: 0, cash: 0, digital: 0 })

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HERO SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground font-nunito tracking-tight">
            Hola, Equipo 👋
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Resumen de hoy, {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        </div>
        <Link href="/pos" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 transition active:scale-95 flex items-center gap-2">
            🛒 Abrir Caja
        </Link>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Card - Mantenemos estilo oscuro distintivo pero usando variables compatibles */}
        <div className="bg-slate-900 dark:bg-card dark:border dark:border-border text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Ventas Netas</p>
            <p className="text-5xl font-black font-nunito">${stats.total.toLocaleString()}</p>
            <div className="mt-6 flex gap-6">
                <div>
                    <span className="block text-green-400 font-bold text-lg">${stats.cash.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs font-bold uppercase">Efectivo</span>
                </div>
                <div className="w-px bg-slate-700"></div>
                <div>
                    <span className="block text-blue-400 font-bold text-lg">${stats.digital.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs font-bold uppercase">Digital</span>
                </div>
            </div>
        </div>

        {/* Appointments Summary */}
        <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-sm border border-border flex flex-col justify-between hover:shadow-md transition">
            <div>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mb-2">Turnos Hoy</p>
                <p className="text-4xl font-black font-nunito">{todayAppointments.length}</p>
            </div>
            <div className="mt-4">
                <div className="flex -space-x-2 overflow-hidden">
                    {todayAppointments.slice(0, 4).map(appt => (
                        <div key={appt.id} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-primary/20 flex items-center justify-center text-primary font-bold text-xs" title={appt.pet.name}>
                            {appt.pet.name.slice(0,2)}
                        </div>
                    ))}
                    {todayAppointments.length > 4 && (
                        <div className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                            +{todayAppointments.length - 4}
                        </div>
                    )}
                </div>
                <Link href="/agenda" className="text-primary text-sm font-bold mt-2 block hover:underline">Ver agenda completa →</Link>
            </div>
        </div>

        {/* Stock Alert - Usamos opacidad para que funcione en dark/light */}
        <div className="bg-orange-500/10 dark:bg-orange-500/5 p-8 rounded-3xl border border-orange-500/20 flex flex-col justify-between">
            <div>
                 <div className="flex justify-between items-start">
                    <p className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">Atención Requerida</p>
                    <span className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-lg">Stock</span>
                 </div>
                <p className="text-4xl font-black text-orange-700 dark:text-orange-400 font-nunito">{lowStockVariants.length}</p>
                <p className="text-orange-600/80 dark:text-orange-400/80 text-sm font-medium mt-1">Productos por agotarse</p>
            </div>
            <Link href="/inventory" className="text-orange-700 dark:text-orange-400 text-sm font-bold mt-2 hover:underline">Reponer inventario →</Link>
        </div>
      </div>

      {/* DETAILED SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Próximos Turnos */}
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-xl mb-6 font-nunito">📅 Próximos Clientes</h3>
            {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-muted/50 rounded-2xl border border-dashed border-border">
                    Todo tranquilo por hoy 😴
                </div>
            ) : (
                <div className="space-y-4">
                    {todayAppointments.slice(0, 5).map(appt => (
                        <div key={appt.id} className="flex items-center gap-4 p-3 hover:bg-accent/50 rounded-2xl transition group">
                            <div className="bg-primary/10 text-primary font-bold text-xs px-3 py-2 rounded-xl border border-primary/10">
                                {appt.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold group-hover:text-primary transition">{appt.pet.name}</p>
                                <p className="text-xs text-muted-foreground">{appt.pet.breed} • {appt.pet.ownerName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border
                                ${appt.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : ''}
                                ${appt.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : ''}
                                ${appt.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                                ${appt.status === 'BILLED' ? 'bg-secondary text-muted-foreground border-border' : ''}
                            `}>
                                {appt.status === 'BILLED' ? 'COBRADO' : appt.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Alertas de Inventario */}
        <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-xl mb-6 font-nunito">⚠️ Stock Crítico</h3>
            <div className="space-y-3">
                {lowStockVariants.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 border border-border rounded-2xl hover:bg-destructive/5 transition">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-12 rounded-full ${v.stock === 0 ? 'bg-destructive' : 'bg-orange-400'}`}></div>
                            <div>
                                <p className="font-bold text-sm">{v.product.name}</p>
                                <p className="text-xs text-muted-foreground">{v.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-black text-lg ${v.stock === 0 ? 'text-destructive' : 'text-orange-500'}`}>
                                {v.stock}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Unid.</p>
                        </div>
                    </div>
                ))}
                {lowStockVariants.length === 0 && (
                    <div className="p-8 text-center text-green-600 bg-green-500/10 rounded-2xl border border-green-500/20">
                        ✅ Inventario saludable
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}