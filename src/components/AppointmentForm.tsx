// src/components/AppointmentForm.tsx
'use client'

import { useState } from "react"
import { createAppointment } from "@/actions/appointment-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type Props = {
  pets: { id: string, name: string, breed: string | null }[]
  selectedDate: string 
}

export default function AppointmentForm({ pets, selectedDate }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() 
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    const result = await createAppointment(formData)

    setLoading(false)

    if (result.error) {
      alert("❌ NO SE PUDO AGENDAR:\n" + result.error)
    } else {
      alert("✅ Turno agendado correctamente")
      form.reset() 
      router.refresh()
    }
  }

  // Clases compartidas
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"
  const inputClass = "w-full p-2.5 rounded-xl border border-input bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition [color-scheme:light] dark:[color-scheme:dark]"

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm sticky top-6">
      <h2 className="text-xl font-black mb-6 text-foreground font-nunito flex items-center gap-2">
        📅 Agendar Turno
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* MASCOTA */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={labelClass}>Mascota</label>
            <Link href="/pets" className="text-[10px] font-bold text-primary hover:underline uppercase">
                + Nueva
            </Link>
          </div>
          <select name="petId" required className={inputClass}>
            <option value="">Seleccionar...</option>
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.breed || 'Sin raza'})</option>
            ))}
          </select>
        </div>

        {/* FECHA */}
        <div>
            <label className={labelClass}>Fecha</label>
            <input 
                type="date" 
                name="date"
                defaultValue={selectedDate}
                required
                className={inputClass}
            />
        </div>

        {/* HORA Y DURACIÓN */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Hora Inicio</label>
            <input 
              name="time" 
              type="time" 
              required 
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Duración</label>
            <select name="duration" className={inputClass}>
              <option value="30">30 min</option>
              <option value="60">1 h</option>
              <option value="90">1 h 30m</option>
              <option value="120">2 hs</option>
              <option value="180">3 hs</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={cn(
            "w-full py-3 rounded-xl font-bold transition text-primary-foreground shadow-lg active:scale-95 mt-2",
            loading 
                ? 'bg-muted text-muted-foreground cursor-wait' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/25'
          )}
        >
          {loading ? "Verificando..." : "Confirmar Reserva"}
        </button>
      </form>
    </div>
  )
}