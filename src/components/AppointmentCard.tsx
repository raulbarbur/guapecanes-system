// src/components/AppointmentCard.tsx
'use client'

import { cancelAppointment, updateAppointmentStatus } from "@/actions/appointment-actions"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

type AppointmentData = {
  id: string
  startTime: Date
  endTime: Date
  status: string 
  pet: {
    name: string
    breed: string | null
    ownerName: string
  }
}

export default function AppointmentCard({ appt }: { appt: AppointmentData }) {
  const [loading, setLoading] = useState(false)

  const start = appt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const end = appt.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleStatusChange = async (newStatus: 'CONFIRMED' | 'COMPLETED') => {
    setLoading(true)
    await updateAppointmentStatus(appt.id, newStatus)
    setLoading(false)
  }

  // DEFINICIÓN DE ESTILOS POR ESTADO
  // Usamos border-l-4 para mantener la identidad visual, pero con colores compatibles
  const statusStyles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 border-yellow-500 dark:border-yellow-400/50",
    CONFIRMED: "bg-blue-500/10 border-blue-500 dark:border-blue-400/50",
    COMPLETED: "bg-green-500/10 border-green-500 dark:border-green-400/50",
    BILLED: "bg-secondary border-border opacity-70 grayscale",
    CANCELLED: "bg-destructive/10 border-destructive opacity-80",
  }

  const badgeStyles: Record<string, string> = {
    PENDING: "text-yellow-700 dark:text-yellow-400 bg-yellow-500/10",
    CONFIRMED: "text-blue-700 dark:text-blue-400 bg-blue-500/10",
    COMPLETED: "text-green-700 dark:text-green-400 bg-green-500/10",
    BILLED: "text-muted-foreground bg-secondary",
    CANCELLED: "text-destructive bg-destructive/10",
  }

  const currentStyle = statusStyles[appt.status] || "bg-card border-border"

  return (
    <div className={cn(
        "p-4 rounded-xl shadow-sm border border-transparent border-l-4 transition-all duration-200 hover:scale-[1.01]",
        currentStyle
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* INFO PRINCIPAL */}
        <div className="flex items-center gap-4">
            {/* Hora */}
            <div className="flex flex-col items-center justify-center min-w-[60px] bg-background/50 rounded-lg p-2 backdrop-blur-sm">
                <span className="text-xl font-black text-foreground">{start}</span>
                <span className="text-[10px] font-bold text-muted-foreground">{end}</span>
            </div>

            {/* Datos Mascota */}
            <div>
                <h3 className="font-black text-lg text-foreground leading-none mb-1">
                    {appt.pet.name}
                </h3>
                <p className="text-xs font-medium text-muted-foreground">
                    {appt.pet.breed} • {appt.pet.ownerName}
                </p>
                
                {/* Badge de Estado */}
                <span className={cn(
                    "inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                    badgeStyles[appt.status]
                )}>
                    {appt.status === 'CONFIRMED' ? 'EN PROCESO' : appt.status}
                </span>
            </div>
        </div>

        {/* BOTONERA DE ACCIONES (WORKFLOW) */}
        <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
            
            {/* 1. CONFIRMAR (LLEGÓ) */}
            {appt.status === 'PENDING' && (
                <button 
                    disabled={loading}
                    onClick={() => handleStatusChange('CONFIRMED')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm"
                >
                    🐕 LLEGÓ
                </button>
            )}

            {/* 2. TERMINAR (LISTO) */}
            {appt.status === 'CONFIRMED' && (
                <button 
                    disabled={loading}
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm animate-pulse"
                >
                    ✨ LISTO
                </button>
            )}

            {/* 3. COBRAR */}
            {appt.status !== 'BILLED' && appt.status !== 'CANCELLED' && (
                <Link
                    href={`/pos?apptId=${appt.id}&petName=${encodeURIComponent(appt.pet.name)}`}
                    className="bg-foreground text-background hover:bg-foreground/90 text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                    💰 COBRAR
                </Link>
            )}

            {/* 4. CANCELAR */}
            {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                <form action={cancelAppointment}>
                    <input type="hidden" name="id" value={appt.id} />
                    <button className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-lg transition">
                        ✖
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  )
}