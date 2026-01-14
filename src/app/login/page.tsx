// src/app/login/page.tsx
'use client'

import { login } from "@/actions/auth-actions"
import { useState } from "react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError("")
    
    const res = await login(formData)
    
    // Si la función login retorna algo, es un error (porque si es éxito, redirige)
    if (res?.error) {
        setError(res.error)
        setLoading(false)
    }
    // No hace falta setLoading(false) si redirige, el componente se desmonta
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">GUAPECANES</h1>
            <p className="text-sm text-gray-500">Sistema de Gestión</p>
        </div>

        {error && (
            <div className="bg-red-100 text-red-600 text-sm p-3 rounded mb-4 font-bold text-center border border-red-200">
                {error}
            </div>
        )}

        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input 
                    name="email" 
                    type="email" 
                    required 
                    autoFocus
                    placeholder="usuario@guapecanes.com"
                    className="w-full border p-3 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                <input 
                    name="password" 
                    type="password" 
                    required 
                    placeholder="••••••"
                    className="w-full border p-3 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-800 outline-none transition"
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-3 rounded font-bold text-white transition shadow-lg
                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-black hover:scale-[1.02]'}
                `}
            >
                {loading ? "Entrando..." : "Iniciar Sesión"}
            </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-6">
            v3.0 Secure Access
        </p>
      </div>
    </div>
  )
}