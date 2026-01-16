// src/components/SettlementButton.tsx
'use client' 

import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"

export default function SettlementButton() {
  const { pending } = useFormStatus()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const confirmed = confirm("¿Estás seguro de que vas a entregar el dinero?\n\nEsta acción marcará los items como PAGADOS y no se puede deshacer fácilmente.")
    if (!confirmed) e.preventDefault()
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition active:scale-95 text-white w-full md:w-auto",
        pending 
          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700 hover:shadow-green-900/20'
      )}
    >
      {pending ? "Procesando..." : "✅ Confirmar Pago"}
    </button>
  )
}