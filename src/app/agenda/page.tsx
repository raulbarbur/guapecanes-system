// src/app/agenda/page.tsx
import { prisma } from "@/lib/prisma"
import { cancelAppointment } from "@/actions/appointment-actions"
import Link from "next/link"
import AppointmentForm from "@/components/AppointmentForm"

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function AgendaPage({ searchParams }: Props) {
  const { date } = await searchParams
  
  // Lógica de fechas
  const todayStr = new Date().toISOString().split('T')[0]
  const selectedDateStr = date || todayStr

  // Rango de búsqueda: Todo el día seleccionado
  const startOfDay = new Date(`${selectedDateStr}T00:00:00`)
  const endOfDay = new Date(`${selectedDateStr}T23:59:59`)

  // 1. Buscar Mascotas (Para el selector de nuevo turno)
  const pets = await prisma.pet.findMany({ 
    orderBy: { name: 'asc' },
    select: { id: true, name: true, breed: true }
  })

  // 2. Buscar Turnos del día
  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: startOfDay, lte: endOfDay },
      status: { not: 'CANCELLED' }
    },
    include: { pet: true },
    orderBy: { startTime: 'asc' }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agenda de Turnos</h1>
        
        {/* Navegación rápida */}
        <div className="space-x-4 text-blue-600 font-bold text-sm">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/pets" className="hover:underline">Mascotas</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: LISTADO DE TURNOS */}
        <div className="lg:col-span-2 space-y-4">
            
            {/* Selector de Fecha */}
            <div className="bg-white p-4 rounded-lg shadow border flex items-center gap-4">
                <label className="font-bold text-gray-700">Fecha:</label>
                <form className="flex gap-2">
                    <input 
                        type="date" 
                        name="date" 
                        defaultValue={selectedDateStr} 
                        className="border p-2 rounded"
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700">
                        Ir
                    </button>
                </form>
                
                {selectedDateStr !== todayStr && (
                     <Link href="/agenda" className="text-sm text-gray-500 underline ml-auto">Volver a Hoy</Link>
                )}
            </div>

            {/* Grilla de Turnos */}
            <div className="bg-white rounded-lg shadow border overflow-hidden min-h-[300px]">
                {appointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                        <span className="text-4xl mb-2">📅</span>
                        <p>Agenda libre.</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {appointments.map(appt => {
                            const start = appt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            const end = appt.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            
                            return (
                                <div key={appt.id} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-gray-50">
                                    {/* Info del Turno */}
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            px-3 py-2 rounded text-lg font-bold font-mono border 
                                            ${appt.status === 'BILLED' 
                                                ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                                : 'bg-blue-100 text-blue-800 border-blue-200'}
                                        `}>
                                            {start}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-gray-800">{appt.pet.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Finaliza: {end} | Dueño: {appt.pet.ownerName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Botonera de Acciones */}
                                    <div className="mt-4 sm:mt-0 flex gap-2 items-center">
                                        
                                        {/* BOTÓN COBRAR: Solo aparece si está pendiente */}
                                        {appt.status === 'PENDING' && (
                                            <Link
                                                href={`/pos?apptId=${appt.id}&petName=${encodeURIComponent(appt.pet.name)}`}
                                                className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-green-700 shadow-sm flex items-center gap-1 transition"
                                            >
                                                <span>💰</span> COBRAR
                                            </Link>
                                        )}

                                        {/* Etiqueta de Cobrado */}
                                        {appt.status === 'BILLED' && (
                                            <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded cursor-not-allowed font-medium">
                                                ✅ Cobrado
                                            </span>
                                        )}

                                        {/* Botón Cancelar */}
                                        {appt.status === 'PENDING' && (
                                            <form action={cancelAppointment}>
                                                <input type="hidden" name="id" value={appt.id} />
                                                <button className="text-red-500 text-xs font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50 hover:text-red-700 transition ml-2">
                                                    CANCELAR
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO CLIENTE */}
        <div className="lg:col-span-1">
            <AppointmentForm pets={pets} selectedDate={selectedDateStr} />
        </div>

      </div>
    </div>
  )
}