// src/components/CancelSaleButton.tsx
'use client'

import { cancelSale } from "@/actions/sale-actions"
import { useState } from "react"
import ConfirmModal from "./ui/ConfirmModal"
import { useToast } from "./ui/Toast"

export default function CancelSaleButton({ saleId }: { saleId: string }) {
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToast } = useToast()

  const handleCancel = async () => {
    // La lógica de confirmación ahora vive en el Modal.
    // Esta función solo se ejecuta si el usuario hace clic en "Confirmar".
    setLoading(true)

    try {
      const result = await cancelSale(saleId)

      if (result.success) {
        addToast("¡Venta Anulada con Éxito!", "success")
        // La página se refrescará por el revalidatePath del servidor.
      } else {
        // Usamos el toast de error con el mensaje del servidor.
        addToast(result.error || "Ocurrió un error desconocido.", "error")
      }
    } catch (err) {
      console.error("🔴 [CLIENTE] Error de red o código:", err)
      const errorMessage = err instanceof Error ? err.message : "Error inesperado al intentar anular."
      addToast(errorMessage, "error")
    } finally {
      setLoading(false)
      setIsModalOpen(false) // Cerramos el modal tras la operación.
    }
  }

  return (
    <>
      {/* El botón principal ahora solo abre el modal de confirmación */}
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
        className={`text-sm font-semibold border px-3 py-1 rounded transition
          ${loading 
            ? 'bg-gray-200 text-gray-500 cursor-wait' 
            : 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800'
          }
        `}
      >
        Anular
      </button>

      {/* El modal se encarga del flujo de confirmación y feedback visual */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCancel}
        title="Anular Venta"
        description="¿Estás SEGURO de anular esta venta? Si ya fue liquidada, se generará una deuda al dueño."
        confirmText="Sí, Anular Venta"
        variant="danger"
        loading={loading}
      />
    </>
  )
}