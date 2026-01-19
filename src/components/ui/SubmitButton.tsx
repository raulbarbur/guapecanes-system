// src/components/ui/SubmitButton.tsx
'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

type SubmitButtonProps = {
  children: React.ReactNode
  loadingText?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function SubmitButton({ 
  children, 
  loadingText = "Procesando...",
  className = "",
  ...props 
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "px-8 py-3 rounded-xl font-bold text-white shadow-lg transition active:scale-95 flex items-center justify-center gap-2",
        pending 
          ? 'bg-muted text-muted-foreground cursor-wait' 
          : 'bg-green-600 hover:bg-green-700',
        className
      )}
      {...props}
    >
      {pending && (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      {pending ? loadingText : children}
    </button>
  )
}