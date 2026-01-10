// src/components/SettlementButton.tsx
'use client' // 👈 Esto permite usar onClick y hooks

import { useFormStatus } from "react-dom"

export default function SettlementButton() {
  // useFormStatus detecta si la Server Action se está ejecutando
  const { pending } = useFormStatus()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Confirmación nativa del navegador
    const confirmed = confirm("¿Estás seguro de que vas a entregar el dinero?\n\nEsta acción marcará los items como PAGADOS y no se puede deshacer fácilmente.")
    
    if (!confirmed) {
      e.preventDefault() // Cancela el envío del formulario
    }
  }

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={pending}
      className={`
        px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition transform 
        ${pending 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700 hover:scale-105 text-white'
        }
      `}
    >
      {pending ? "Procesando..." : "✅ Confirmar Pago"}
    </button>
  )
}