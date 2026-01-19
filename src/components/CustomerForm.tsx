// src/components/CustomerForm.tsx
'use client'

import { createCustomer, updateCustomer } from "@/actions/customer-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"

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
  const { addToast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    let result;
    
    if (initialData?.id) {
        formData.append("id", initialData.id)
        result = await updateCustomer(formData)
        if (result.success) {
            addToast("Cliente actualizado", "success")
            router.refresh()
        }
    } else {
        result = await createCustomer(formData)
        if (result?.success) {
            addToast("Cliente creado", "success")
            const form = document.getElementById("customer-form") as HTMLFormElement
            form?.reset()
            router.refresh()
        }
    }

    setLoading(false)
    if (result?.error) addToast(result.error, "error")
  }

  const inputClass = "w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none transition"
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"

  return (
    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border sticky top-6">
      <h2 className="text-xl font-black text-foreground mb-6 font-nunito flex items-center gap-2">
        {initialData ? "✏️ Editar Cliente" : "👤 Nuevo Cliente"}
      </h2>
      
      <form id="customer-form" action={handleSubmit} className="flex flex-col gap-5">
        
        <div>
          <label className={labelClass}>Nombre y Apellido *</label>
          <input 
            name="name" 
            defaultValue={initialData?.name}
            type="text" 
            required 
            autoFocus
            className={inputClass} 
            placeholder="Ej: Laura Gómez"
          />
        </div>

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

        <CollapsibleSection title="Más Datos de Contacto" icon="📍">
            <div className="space-y-4 pt-2">
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
            </div>
        </CollapsibleSection>

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