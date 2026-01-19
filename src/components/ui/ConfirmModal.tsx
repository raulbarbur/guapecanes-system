'use client'

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'info' | 'default'
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'danger',
  loading = false
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Bloquear scroll cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  // Portal para asegurar que el modal esté siempre encima de todo (z-index)
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 text-center">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl",
            variant === 'danger' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
            variant === 'info' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-gray-100 text-gray-600 dark:bg-gray-800"
          )}>
            {variant === 'danger' ? '⚠️' : variant === 'info' ? 'ℹ️' : '❓'}
          </div>

          <h3 className="text-xl font-black text-foreground font-nunito mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex divide-x divide-border border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 text-sm font-bold text-muted-foreground hover:bg-muted transition hover:text-foreground disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-4 text-sm font-black transition disabled:opacity-50 flex items-center justify-center gap-2",
              variant === 'danger' 
                ? "text-destructive hover:bg-destructive/10" 
                : "text-primary hover:bg-primary/10"
            )}
          >
            {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}