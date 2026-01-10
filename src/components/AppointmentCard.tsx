// src/components/AppointmentCard.tsx
'use client'

import { cancelAppointment, updateAppointmentStatus } from "@/actions/appointment-actions"
import Link from "next/link"
import { useState } from "react"

// Definimos el tipo de datos que recibe la tarjeta (lo que viene de Prisma)
type AppointmentData = {
  id: string
  startTime: Date
  endTime: Date
  status: string // En Prisma es un Enum, aquí lo manejamos como string
  pet: {
    name: string
    breed: string | null
    ownerName: string
  }
}

export default function AppointmentCard({ appt }: { appt: AppointmentData }) {
  const [loading, setLoading] = useState(false)

  // Helpers de formato
  const start = appt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const end = appt.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Función genérica para cambiar estado
  const handleStatusChange = async (newStatus: 'CONFIRMED' | 'COMPLETED') => {
    setLoading(true)
    await updateAppointmentStatus(appt.id, newStatus)
    setLoading(false)
  }

  // Definir colores según estado
  let statusColor = "bg-white border-l-4 border-gray-300" // Default
  if (appt.status === 'PENDING') statusColor = "bg-white border-l-4 border-yellow-400"
  if (appt.status === 'CONFIRMED') statusColor = "bg-blue-50 border-l-4 border-blue-500" // En proceso
  if (appt.status === 'COMPLETED') statusColor = "bg-green-50 border-l-4 border-green-500" // Terminado
  if (appt.status === 'BILLED') statusColor = "bg-gray-100 border-l-4 border-gray-400 opacity-75" // Cobrado

  return (
    <div className={`p-4 rounded-lg shadow-sm border border-gray-200 transition-all ${statusColor}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* INFO PRINCIPAL */}
        <div className="flex items-center gap-4">
            {/* Hora */}
            <div className="flex flex-col items-center justify-center min-w-[60px]">
                <span className="text-xl font-bold text-gray-800">{start}</span>
                <span className="text-xs text-gray-500">{end}</span>
            </div>

            {/* Datos Mascota */}
            <div>
                <h3 className="font-bold text-lg text-gray-900 leading-none mb-1">
                    {appt.pet.name}
                </h3>
                <p className="text-xs text-gray-600">
                    {appt.pet.breed} • {appt.pet.ownerName}
                </p>
                {/* Badge de Estado Visual */}
                <span className={`
                    inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${appt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : ''}
                    ${appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                    ${appt.status === 'BILLED' ? 'bg-gray-200 text-gray-600' : ''}
                `}>
                    {appt.status === 'CONFIRMED' ? 'EN PROCESO' : appt.status}
                </span>
            </div>
        </div>

        {/* BOTONERA DE ACCIONES (WORKFLOW) */}
        <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
            
            {/* 1. SI ESTÁ PENDIENTE -> CONFIRMAR (LLEGÓ) */}
            {appt.status === 'PENDING' && (
                <button 
                    disabled={loading}
                    onClick={() => handleStatusChange('CONFIRMED')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded transition"
                >
                    🐕 LLEGÓ
                </button>
            )}

            {/* 2. SI ESTÁ EN PROCESO -> TERMINAR (LISTO) */}
            {appt.status === 'CONFIRMED' && (
                <button 
                    disabled={loading}
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded transition shadow-sm animate-pulse"
                >
                    ✨ LISTO
                </button>
            )}

            {/* 3. BOTÓN COBRAR (Siempre disponible si no está cobrado) */}
            {appt.status !== 'BILLED' && (
                <Link
                    href={`/pos?apptId=${appt.id}&petName=${encodeURIComponent(appt.pet.name)}`}
                    className="bg-slate-800 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded transition flex items-center gap-1 shadow"
                >
                    💰 COBRAR
                </Link>
            )}

            {/* 4. CANCELAR (Solo si no se cobró ni completó) */}
            {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                <form action={cancelAppointment}>
                    <input type="hidden" name="id" value={appt.id} />
                    <button className="text-red-400 hover:text-red-600 text-xs font-bold px-2 py-2 hover:bg-red-50 rounded">
                        ✖
                    </button>
                </form>
            )}

        </div>
      </div>
    </div>
  )
}