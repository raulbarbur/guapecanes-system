// src/components/UserForm.tsx
'use client'

import { createUser } from "@/actions/user-actions"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function UserForm() {
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    // Llamada a la Server Action
    const result = await createUser(formData)
    
    setLoading(false)

    if (result?.error) {
        alert("❌ Error: " + result.error)
    } else {
        alert("✅ Usuario creado correctamente")
        formRef.current?.reset() // Limpiar formulario
        router.refresh() // Recargar datos de la página
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        👤 Nuevo Usuario
      </h2>
      
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
            <input 
                name="name" 
                type="text" 
                required 
                placeholder="Ej: Juan Admin" 
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Login)</label>
            <input 
                name="email" 
                type="email" 
                required 
                placeholder="juan@guapecanes.com" 
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
            <input 
                name="password" 
                type="password" 
                required 
                placeholder="******" 
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol</label>
            <select 
                name="role" 
                className="w-full border p-2 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value="STAFF">Staff (Vendedor/Peluquero)</option>
                <option value="ADMIN">Administrador (Total)</option>
            </select>
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-2 rounded text-white font-bold text-sm transition
                ${loading ? 'bg-gray-400 cursor-wait' : 'bg-slate-800 hover:bg-black'}
            `}
        >
            {loading ? "Creando..." : "Registrar Usuario"}
        </button>

      </form>
    </div>
  )
}