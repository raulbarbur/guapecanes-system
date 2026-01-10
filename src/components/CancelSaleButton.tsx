// src/components/CancelSaleButton.tsx
'use client'

import { cancelSale } from "@/actions/sale-actions"
import { useState } from "react"

export default function CancelSaleButton({ saleId }: { saleId: string }) {
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    // 1. Log en el NAVEGADOR (Mirar F12 > Console)
    console.log(`🔵 [CLIENTE] Click en anular venta ID: ${saleId}`)

    const confirmed = confirm("¿Estás SEGURO de anular esta venta?\n\nSi ya fue liquidada, se generará una deuda al dueño.")
    if (!confirmed) return

    setLoading(true)

    try {
      // 2. Llamada al Servidor
      console.log("⏳ [CLIENTE] Llamando al servidor...")
      const result = await cancelSale(saleId)

      // 3. Respuesta del Servidor
      console.log("🟢 [CLIENTE] Respuesta recibida:", result)

      if (result.success) {
        alert("✅ ¡Venta Anulada con Éxito!")
        // La página se refrescará sola gracias al revalidatePath del servidor
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (err) {
      console.error("🔴 [CLIENTE] Error de red o código:", err)
      alert("Error inesperado al intentar anular.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className={`text-sm font-semibold border px-3 py-1 rounded transition
        ${loading 
          ? 'bg-gray-200 text-gray-500 cursor-wait' 
          : 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800'
        }
      `}
    >
      {loading ? "Procesando..." : "Anular"}
    </button>
  )
}