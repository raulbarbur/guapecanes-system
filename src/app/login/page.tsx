'use client'

import { login } from "@/actions/auth-actions"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError("")
    
    const res = await login(formData)
    if (res?.error) {
        setError(res.error)
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        
        {/* Decoración de fondo sutil */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-10 -mt-10 blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
            <h1 className="text-3xl font-black text-foreground font-nunito tracking-tighter">GUAPECANES</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Sistema de Gestión</p>
        </div>

        {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-6 font-bold text-center border border-destructive/20 animate-in shake">
                {error}
            </div>
        )}

        <form action={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
                <label className="block text-xs font-black text-muted-foreground uppercase pl-1">Email</label>
                <input 
                    name="email" 
                    type="email" 
                    required 
                    autoFocus
                    placeholder="admin@guapecanes.com"
                    className="w-full border border-input p-3.5 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition font-medium"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-black text-muted-foreground uppercase pl-1">Contraseña</label>
                <input 
                    name="password" 
                    type="password" 
                    required 
                    placeholder="••••••"
                    className="w-full border border-input p-3.5 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition font-medium"
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={cn(
                    "w-full py-4 rounded-xl font-black text-primary-foreground transition-all shadow-lg mt-2",
                    loading 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none' 
                        : 'bg-primary hover:bg-primary/90 hover:shadow-primary/25 active:scale-95'
                )}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        Validando...
                    </span>
                ) : (
                    "Iniciar Sesión"
                )}
            </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-border text-center">
             <p className="text-[10px] text-muted-foreground font-medium">
                v3.0 • Secure Access
            </p>
        </div>
      </div>
    </div>
  )
}