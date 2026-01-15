// src/app/agenda/page.tsx
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AppointmentForm from "@/components/AppointmentForm"
import AppointmentCard from "@/components/AppointmentCard"
import { cn } from "@/lib/utils"

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function AgendaPage({ searchParams }: Props) {
  const { date } = await searchParams
  
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDateStr = date || todayStr

  const startOfDay = new Date(`${selectedDateStr}T00:00:00`)
  const endOfDay = new Date(`${selectedDateStr}T23:59:59`)

  const pets = await prisma.pet.findMany({ 
    orderBy: { name: 'asc' },
    select: { id: true, name: true, breed: true }
  })

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { not: 'CANCELLED' }
    },
    include: { pet: true },
    orderBy: { startTime: 'asc' }
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Agenda de Turnos</h1>
            <p className="text-sm text-muted-foreground mt-1">Organiza el flujo de trabajo diario.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: LISTADO (2/3 de ancho) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Barra de Fecha */}
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <form className="flex gap-3 items-center">
                        <input 
                            type="date" 
                            name="date" 
                            defaultValue={selectedDateStr} 
                            className="bg-background border border-input text-foreground rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none [color-scheme:light] dark:[color-scheme:dark]"
                        />
                        <button type="submit" className="bg-secondary hover:bg-accent text-foreground px-4 py-2 rounded-xl font-bold text-sm border border-border transition">
                            Ir
                        </button>
                    </form>
                </div>
                
                {selectedDateStr !== todayStr && (
                     <Link href="/agenda" className="text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg">
                        Volver a Hoy
                     </Link>
                )}
            </div>

            {/* Grilla de Turnos */}
            <div className="space-y-4 min-h-[300px]">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
                        <span className="text-5xl mb-4 opacity-50">😴</span>
                        <p className="font-bold">No hay turnos para esta fecha.</p>
                        <p className="text-sm">Tomate un descanso o agendá algo nuevo.</p>
                    </div>
                ) : (
                    appointments.map(appt => (
                        <AppointmentCard key={appt.id} appt={appt} />
                    ))
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO (1/3 de ancho) */}
        <div className="lg:col-span-1">
            <AppointmentForm pets={pets} selectedDate={selectedDateStr} />
        </div>

      </div>
    </div>
  )
}