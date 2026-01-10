// src/app/agenda/page.tsx
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import AppointmentForm from "@/components/AppointmentForm"
import AppointmentCard from "@/components/AppointmentCard" // 👈 Importamos

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function AgendaPage({ searchParams }: Props) {
  const { date } = await searchParams
  
  // Lógica de fechas
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDateStr = date || todayStr

  // Rangos de búsqueda (Local Day)
  const startOfDay = new Date(`${selectedDateStr}T00:00:00`)
  const endOfDay = new Date(`${selectedDateStr}T23:59:59`)

  // 1. Datos para el Formulario
  const pets = await prisma.pet.findMany({ 
    orderBy: { name: 'asc' },
    select: { id: true, name: true, breed: true }
  })

  // 2. Datos de Turnos
  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { not: 'CANCELLED' }
    },
    include: { pet: true },
    orderBy: { startTime: 'asc' }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Agenda de Turnos</h1>
            <p className="text-gray-500 text-sm">Organiza el flujo de trabajo diario.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: LISTADO (2/3 de ancho) */}
        <div className="lg:col-span-2 space-y-4">
            
            {/* Barra de Fecha */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <form className="flex gap-2 items-center">
                        <input 
                            type="date" 
                            name="date" 
                            defaultValue={selectedDateStr} 
                            className="border p-2 rounded text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700">
                            Ir
                        </button>
                    </form>
                </div>
                
                {selectedDateStr !== todayStr && (
                     <Link href="/agenda" className="text-sm font-bold text-blue-600 hover:underline">
                        Volver a Hoy
                     </Link>
                )}
            </div>

            {/* Grilla de Turnos */}
            <div className="space-y-3 min-h-[300px]">
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-gray-50 rounded-lg border border-dashed">
                        <span className="text-4xl mb-2 opacity-50">😴</span>
                        <p>No hay turnos para esta fecha.</p>
                    </div>
                ) : (
                    // Renderizamos cada turno usando el componente nuevo
                    appointments.map(appt => (
                        <AppointmentCard key={appt.id} appt={appt} />
                    ))
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO (1/3 de ancho) */}
        <div className="lg:col-span-1">
            <div className="sticky top-6">
                <AppointmentForm pets={pets} selectedDate={selectedDateStr} />
            </div>
        </div>

      </div>
    </div>
  )
}