// src/components/OwnerForm.tsx
'use client'

import { createOwner, updateOwner } from "@/actions/owner-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"

type OwnerData = {
  id?: string
  name: string
  email: string | null
  phone: string | null
}

export default function OwnerForm({ initialData }: { initialData?: OwnerData }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    let result;
    
    if (initialData?.id) {
        formData.append("id", initialData.id)
        result = await updateOwner(formData)
        if (result.success) {
            addToast("Dueño actualizado", "success")
            router.push("/owners") 
            router.refresh()
        }
    } else {
        result = await createOwner(formData)
        if (result?.success) {
            addToast("Dueño creado", "success")
            const form = document.getElementById("owner-form") as HTMLFormElement
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
        {initialData ? "✏️ Editar Dueño" : "👤 Nuevo Dueño"}
      </h2>
      
      <form id="owner-form" action={handleSubmit} className="flex flex-col gap-5">
        
        <div>
          <label className={labelClass}>Nombre Completo *</label>
          <input 
            name="name" 
            defaultValue={initialData?.name}
            type="text" 
            required 
            className={inputClass} 
            placeholder="Ej: Juan Pérez"
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

        <CollapsibleSection title="Información Extra" icon="📧">
            <div className="pt-2">
                <label className={labelClass}>Email</label>
                <input 
                    name="email" 
                    defaultValue={initialData?.email || ""}
                    type="email" 
                    className={inputClass} 
                    placeholder="juan@mail.com"
                />
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