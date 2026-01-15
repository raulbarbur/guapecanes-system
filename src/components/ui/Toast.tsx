// src/components/ui/Toast.tsx
'use client'

import { useState, useEffect } from 'react'
import { create } from 'zustand' // Recomiendo instalar zustand: npm install zustand

// 1. Store simple para manejar estado global de notificaciones
type ToastType = { id: string; message: string; type: 'success' | 'error' | 'info' }

interface ToastStore {
  toasts: ToastType[]
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (msg, type) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, message: msg, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000) // Auto-cierre
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

// 2. Componente Visual
export function Toaster() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`
            px-4 py-3 rounded-xl shadow-lg border cursor-pointer transition-all animate-in slide-in-from-right-10 fade-in
            ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700 border-l-4 border-l-green-500' : ''}
            ${toast.type === 'error' ? 'bg-white border-red-200 text-red-700 border-l-4 border-l-red-500' : ''}
            ${toast.type === 'info' ? 'bg-slate-800 text-white border-slate-700' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {toast.type === 'success' && '✨'}
              {toast.type === 'error' && '🚫'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}