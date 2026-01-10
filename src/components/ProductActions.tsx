// src/components/ProductActions.tsx
'use client'

import { toggleProductStatus } from "@/actions/product-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProductActions({ id, isActive, stock }: { id: string, isActive: boolean, stock: number }) {
  const router = useRouter()

  const handleToggle = async () => {
    if (isActive && stock > 0) {
        alert("⚠️ No podés archivar un producto con stock.\nHacé un retiro o ajuste a 0 primero.")
        return
    }

    if (!confirm(isActive ? "¿Archivar producto?" : "¿Reactivar producto?")) return

    const res = await toggleProductStatus(id, isActive)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  return (
    <div className="flex gap-2">
      {/* Botón EDITAR (Link simple) */}
      <Link 
        href={`/products/${id}/edit`} 
        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200"
      >
        EDITAR
      </Link>

      {/* Botón ARCHIVAR/ACTIVAR */}
      <button
        onClick={handleToggle}
        className={`px-3 py-1 rounded text-xs font-bold border transition
          ${isActive 
            ? 'bg-white text-red-600 border-red-200 hover:bg-red-50' 
            : 'bg-green-100 text-green-700 border-transparent hover:bg-green-200'
          }
        `}
      >
        {isActive ? "ARCHIVAR" : "ACTIVAR"}
      </button>
    </div>
  )
}