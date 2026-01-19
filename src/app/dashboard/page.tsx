// src/app/dashboard/page.tsx

export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { getLocalDateISO } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs" // << IMPORTAR

export default async function DashboardPage() {
  const now = new Date()
  const todayStr = getLocalDateISO() 
  const startOfToday = new Date(`${todayStr}T00:00:00`)
  const endOfToday = new Date(`${todayStr}T23:59:59`)

  const [todaySales, todayAppointments, lowStockVariants] = await Promise.all([
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        paidAt: { gte: startOfToday, lte: endOfToday } 
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
        
        {/* Total Card */}
        <div className="bg-slate-900 dark:bg-card dark:border dark:border-border text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Caja Diaria (Real)</p>
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
            </div>
        </div>

        {/* Stock Alert */}
        <div className="bg-orange-500/10 dark:bg-orange-500/5 p-8 rounded-3xl border border-orange-500/20 flex flex-col justify-between">
            <div>
                 <div className="flex justify-between items-start">
                    <p className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-xs mb-2">Atención Requerida</p>
                    <span className="bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-bold px-2 py-1 rounded-lg">Stock</span>
                 </div>
                <p className="text-4xl font-black text-orange-700 dark:text-orange-400 font-nunito">{lowStockVariants.length}</p>
                <p className="text-orange-600/80 dark:text-orange-400/80 text-sm font-medium mt-1">Productos por agotarse</p>
            </div>
        </div>
      </div>

      {/* PESTAÑAS DE DETALLE (Compactación Visual) */}
      <Tabs defaultValue="agenda" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="text-xl font-black text-foreground font-nunito">Actividad Detallada</h3>
            <TabsList>
                <TabsTrigger value="agenda">📅 Agenda Hoy</TabsTrigger>
                <TabsTrigger value="stock">⚠️ Alertas Stock</TabsTrigger>
            </TabsList>
        </div>

        {/* CONTENIDO: AGENDA */}
        <TabsContent value="agenda">
            <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border p-6 min-h-[300px]">
                {todayAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <span className="text-4xl mb-4 opacity-50">😴</span>
                        <p className="font-bold">Todo tranquilo por hoy</p>
                        <p className="text-xs">No hay turnos programados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayAppointments.map(appt => (
                            <div key={appt.id} className="flex items-center gap-4 p-4 border border-border rounded-2xl hover:bg-accent/50 transition group bg-background">
                                <div className="bg-primary/10 text-primary font-bold text-sm px-3 py-2 rounded-xl border border-primary/10 min-w-[60px] text-center">
                                    {appt.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold group-hover:text-primary transition truncate">{appt.pet.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{appt.pet.breed} • {appt.pet.ownerName}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border shrink-0
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
                <div className="mt-6 text-center">
                    <Link href="/agenda" className="text-primary text-sm font-bold hover:underline">Ir a la Agenda Completa →</Link>
                </div>
            </div>
        </TabsContent>

        {/* CONTENIDO: STOCK */}
        <TabsContent value="stock">
            <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border p-6 min-h-[300px]">
                <div className="space-y-3">
                    {lowStockVariants.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-4 border border-border rounded-2xl hover:bg-destructive/5 transition bg-background">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${v.stock === 0 ? 'bg-destructive' : 'bg-orange-400'}`}></div>
                                <div>
                                    <p className="font-bold text-base">{v.product.name}</p>
                                    <p className="text-xs text-muted-foreground">{v.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-black text-xl ${v.stock === 0 ? 'text-destructive' : 'text-orange-500'}`}>
                                    {v.stock}
                                </p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Unid.</p>
                            </div>
                        </div>
                    ))}
                    {lowStockVariants.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-green-600">
                            <span className="text-4xl mb-4">✅</span>
                            <p className="font-bold">Inventario Saludable</p>
                            <p className="text-xs text-green-600/80">No hay alertas de stock bajo.</p>
                        </div>
                    )}
                </div>
                <div className="mt-6 text-center">
                    <Link href="/inventory" className="text-orange-600 text-sm font-bold hover:underline">Gestionar Inventario →</Link>
                </div>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}