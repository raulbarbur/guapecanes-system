// src/components/AppointmentForm.tsx
'use client'

import { useState } from "react"
import { createAppointment } from "@/actions/appointment-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Props = {
  pets: { id: string, name: string, breed: string | null }[]
  selectedDate: string // Viene 'YYYY-MM-DD'
}

export default function AppointmentForm({ pets, selectedDate }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() 
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Nota: Ahora 'date' viene del input visible, ya no lo inyectamos manualmente
    
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

  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm sticky top-6">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Agendar Turno</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* SELECCIÓN DE MASCOTA */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Mascota</label>
          <select name="petId" required className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Seleccionar...</option>
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.breed || 'Sin raza'})</option>
            ))}
          </select>
          <div className="text-right mt-1">
            <Link href="/pets" className="text-xs text-blue-600 underline hover:text-blue-800">
                + Nueva Mascota
            </Link>
          </div>
        </div>

        {/* FECHA (Ahora editable) */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
            <input 
                type="date" 
                name="date"
                defaultValue={selectedDate} // Pre-cargamos la fecha actual de la vista
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        {/* HORA Y DURACIÓN */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Hora Inicio</label>
            <input 
              name="time" 
              type="time" 
              required 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Duración</label>
            <select name="duration" className="w-full p-2 border rounded bg-white">
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
          className={`w-full py-3 rounded font-bold transition text-white shadow
            ${loading 
                ? 'bg-slate-400 cursor-wait' 
                : 'bg-slate-800 hover:bg-slate-900 hover:scale-[1.02] active:scale-95'
            }
          `}
        >
          {loading ? "Verificando..." : "Confirmar Reserva"}
        </button>

      </form>
    </div>
  )
}