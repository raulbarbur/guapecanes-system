'use client'

import { useState } from "react"
import { toggleProductStatus } from "@/actions/product-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import ConfirmModal from "@/components/ui/ConfirmModal"

export default function ProductActions({ id, isActive, stock }: { id: string, isActive: boolean, stock: number }) {
  const router = useRouter()
  const { addToast } = useToast()
  
  // Estado local para controlar el modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1. Manejador inicial del clic
  const initiateToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Validación de negocio: No archivar con stock
    if (isActive && stock > 0) {
        addToast("⚠️ No podés archivar un producto con stock. Hacé un retiro o ajuste a 0 primero.", "error")
        return
    }

    // Si pasa validación, abrimos el modal
    setIsModalOpen(true)
  }

  // 2. Acción confirmada
  const handleConfirm = async () => {
    setLoading(true)
    try {
        const res = await toggleProductStatus(id, isActive)
        
        if (res.error) {
            addToast(`🚫 ${res.error}`, "error")
        } else {
            addToast(
                isActive ? "📦 Producto archivado correctamente" : "✅ Producto reactivado", 
                "success"
            )
            router.refresh()
            setIsModalOpen(false)
        }
    } catch (error) {
        addToast("🚫 Error de conexión", "error")
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
        <div className="flex gap-2 justify-center">
        {/* Botón EDITAR */}
        <Link 
            href={`/products/${id}/edit`} 
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
        >
            EDITAR
        </Link>

        {/* Botón ARCHIVAR/ACTIVAR */}
        <button
            onClick={initiateToggle}
            disabled={loading}
            className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold border transition",
                isActive 
                    ? 'border-destructive/30 text-destructive hover:bg-destructive/10' 
                    : 'border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10'
            )}
        >
            {isActive ? "ARCHIVAR" : "ACTIVAR"}
        </button>
        </div>

        {/* Modal Declarativo */}
        <ConfirmModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirm}
            loading={loading}
            title={isActive ? "¿Archivar producto?" : "¿Reactivar producto?"}
            description={isActive 
                ? "El producto dejará de estar visible en el POS y listados de venta, pero mantendrá su historial." 
                : "El producto volverá a estar disponible para la venta inmediatamente."
            }
            confirmText={isActive ? "Sí, archivar" : "Sí, reactivar"}
            variant={isActive ? "danger" : "info"}
        />
    </>
  )
}
