// src/components/AppointmentForm.tsx
'use client'

import { useState } from "react"
import { createAppointment } from "@/actions/appointment-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Props = {
  pets: { id: string, name: string, breed: string | null }[]
  selectedDate: string
}

export default function AppointmentForm({ pets, selectedDate }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Evitamos la recarga normal del navegador
    setLoading(true)

    // Capturamos los datos del formulario
    const form = e.currentTarget
    const formData = new FormData(form)

    // Agregamos la fecha que viene por prop (porque el input hidden a veces es mañoso)
    formData.set("date", selectedDate)

    // Llamamos al Server Action
    const result = await createAppointment(formData)

    setLoading(false)

    if (result.error) {
      // 🛑 ERROR: Mostramos alerta con el motivo
      alert("❌ NO SE PUDO AGENDAR:\n" + result.error)
    } else {
      // ✅ ÉXITO: Limpiamos y refrescamos la vista
      alert("✅ Turno agendado correctamente")
      form.reset() // Limpia los inputs
      router.refresh() // Recarga los datos de la agenda a la izquierda
    }
  }

  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 sticky top-4 shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Agendar Turno</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Mostramos visualmente la fecha para que el usuario sepa dónde está parado */}
        <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">
           Fecha: {selectedDate}
        </div>

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