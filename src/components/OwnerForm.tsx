// src/components/OwnerForm.tsx
'use client'

import { createOwner, updateOwner } from "@/actions/owner-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"

type OwnerData = {
  id?: string
  name: string
  email: string | null
  phone: string | null
}

export default function OwnerForm({ initialData }: { initialData?: OwnerData }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    let result;
    
    if (initialData?.id) {
        // MODO EDICIÓN
        formData.append("id", initialData.id)
        result = await updateOwner(formData)
        if (result.success) {
            alert("Dueño actualizado")
            router.push("/owners") // Volver a la lista
            router.refresh()
        }
    } else {
        // MODO CREACIÓN
        result = await createOwner(formData)
        if (result?.success) {
            // Limpiamos el form manualmente si es creación
            const form = document.getElementById("owner-form") as HTMLFormElement
            form?.reset()
            router.refresh()
        }
    }

    setLoading(false)
    if (result?.error) alert(result.error)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">
        {initialData ? "Editar Dueño" : "Nuevo Dueño"}
      </h2>
      
      <form id="owner-form" action={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <label className="text-sm text-gray-600 font-bold">Nombre *</label>
          <input 
            name="name" 
            defaultValue={initialData?.name}
            type="text" 
            required 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 font-bold">Email</label>
          <input 
            name="email" 
            defaultValue={initialData?.email || ""}
            type="email" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="juan@mail.com"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 font-bold">Teléfono</label>
          <input 
            name="phone" 
            defaultValue={initialData?.phone || ""}
            type="text" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="11 1234 5678"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 rounded text-white font-bold transition
            ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  )
}