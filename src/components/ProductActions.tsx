// src/components/ProductActions.tsx
'use client'

import { toggleProductStatus } from "@/actions/product-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function ProductActions({ id, isActive, stock }: { id: string, isActive: boolean, stock: number }) {
  const router = useRouter()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault() // Evitar navegación si está dentro de un Link
    e.stopPropagation()

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
        onClick={handleToggle}
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
  )
}