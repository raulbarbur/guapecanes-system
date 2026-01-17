// src/components/CustomerForm.tsx
'use client'

import { createCustomer, updateCustomer } from "@/actions/customer-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

type CustomerData = {
  id?: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

export default function CustomerForm({ initialData }: { initialData?: CustomerData }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    let result;
    
    if (initialData?.id) {
        // MODO EDICIÓN
        formData.append("id", initialData.id)
        result = await updateCustomer(formData)
        if (result.success) {
            router.refresh()
            // Opcional: Podríamos redirigir, pero si estamos en el perfil, el refresh basta
        }
    } else {
        // MODO CREACIÓN
        result = await createCustomer(formData)
        if (result?.success) {
            const form = document.getElementById("customer-form") as HTMLFormElement
            form?.reset()
            router.refresh()
        }
    }

    setLoading(false)
    if (result?.error) alert(result.error)
  }

  // Estilos compartidos
  const inputClass = "w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none transition"
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"

  return (
    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border sticky top-6">
      <h2 className="text-xl font-black text-foreground mb-6 font-nunito flex items-center gap-2">
        {initialData ? "✏️ Editar Cliente" : "👤 Nuevo Cliente"}
      </h2>
      
      <form id="customer-form" action={handleSubmit} className="flex flex-col gap-5">
        
        {/* NOMBRE */}
        <div>
          <label className={labelClass}>Nombre y Apellido *</label>
          <input 
            name="name" 
            defaultValue={initialData?.name}
            type="text" 
            required 
            className={inputClass} 
            placeholder="Ej: Laura Gómez"
          />
        </div>

        {/* TELÉFONO */}
        <div>
          <label className={labelClass}>Teléfono / WhatsApp</label>
          <input 
            name="phone" 
            defaultValue={initialData?.phone || ""}
            type="text" 
            className={inputClass} 
            placeholder="11 1234 5678"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className={labelClass}>Email (Opcional)</label>
          <input 
            name="email" 
            defaultValue={initialData?.email || ""}
            type="email" 
            className={inputClass} 
            placeholder="cliente@mail.com"
          />
        </div>

        {/* DIRECCIÓN */}
        <div>
          <label className={labelClass}>Dirección (Opcional)</label>
          <input 
            name="address" 
            defaultValue={initialData?.address || ""}
            type="text" 
            className={inputClass} 
            placeholder="Av. Principal 123"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-primary-foreground shadow-lg transition active:scale-95 mt-2",
            loading 
                ? 'bg-muted text-muted-foreground cursor-wait' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/25'
          )}
        >
          {loading ? "Guardando..." : "Guardar Ficha"}
        </button>
      </form>
    </div>
  )
}