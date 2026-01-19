'use client'

import { createUser } from "@/actions/user-actions"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/Toast" // Integración FE-01
import { cn } from "@/lib/utils"

export default function UserForm() {
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const { addToast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    
    try {
        const result = await createUser(formData)
        
        if (result?.error) {
            addToast(`❌ ${result.error}`, "error")
        } else {
            addToast("✅ Usuario creado correctamente", "success")
            formRef.current?.reset()
            router.refresh()
        }
    } catch (error) {
        addToast("🚫 Error de conexión", "error")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border h-full">
      <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2 font-nunito">
        👤 Nuevo Usuario
      </h2>
      
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        
        <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">Nombre</label>
            <input 
                name="name" 
                type="text" 
                required 
                placeholder="Ej: Juan Admin" 
                className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition font-medium placeholder:text-muted-foreground"
            />
        </div>

        <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">Email (Login)</label>
            <input 
                name="email" 
                type="email" 
                required 
                placeholder="juan@guapecanes.com" 
                className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition font-medium placeholder:text-muted-foreground"
            />
        </div>

        <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">Contraseña</label>
            <input 
                name="password" 
                type="password" 
                required 
                placeholder="******" 
                className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition font-medium placeholder:text-muted-foreground"
            />
        </div>

        <div className="space-y-1">
            <label className="block text-xs font-black text-muted-foreground uppercase pl-1">Rol</label>
            <div className="relative">
                <select 
                    name="role" 
                    className="w-full bg-background border border-input p-2.5 rounded-xl text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition font-bold appearance-none cursor-pointer"
                >
                    <option value="STAFF">Staff (Vendedor/Peluquero)</option>
                    <option value="ADMIN">Administrador (Total)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
                    ▼
                </div>
            </div>
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition mt-4 shadow-lg",
                loading 
                    ? 'bg-muted text-muted-foreground cursor-wait shadow-none' 
                    : 'bg-foreground text-background hover:bg-foreground/90 hover:scale-[1.02] active:scale-95'
            )}
        >
            {loading ? "Creando..." : "Registrar Usuario"}
        </button>

      </form>
    </div>
  )
}