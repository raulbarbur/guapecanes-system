// src/components/StockMovementForm.tsx
'use client'

import { useState } from "react"
import { registerStockMovement } from "@/actions/inventory-actions"
import { useRouter } from "next/navigation"

type ProductOption = {
  variantId: string
  productName: string
  ownerName: string
  stock: number
}

// Props aceptadas: lista de productos y ruta de redirección opcional
export default function StockMovementForm({ 
  products, 
  redirectPath 
}: { 
  products: ProductOption[], 
  redirectPath?: string 
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await registerStockMovement(formData)

    if (result.success) {
      alert("✅ Movimiento registrado correctamente")
      form.reset() 
      router.refresh() // Refresca los datos en pantalla (Kardex o Lista)

      // Lógica de redirección dinámica
      if (redirectPath) {
          router.push(redirectPath)
      } else {
          router.push("/products")
      }
    } else {
      alert("❌ ERROR: " + result.error)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          
      {/* SELECCIÓN DE TIPO DE MOVIMIENTO */}
      <div className="flex flex-col gap-3">
        <label className="block text-sm font-medium text-gray-700">Tipo de Acción</label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded border">
            {/* Opción 1: Ingreso */}
            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-green-200 transition">
                <input type="radio" name="type" value="ENTRY" defaultChecked className="w-5 h-5 text-green-600 focus:ring-green-500" />
                <span className="font-bold text-green-700 text-sm">🟢 Ingreso <br/><span className="text-xs font-normal text-gray-500">Nuevo stock</span></span>
            </label>

            {/* Opción 2: Retiro Dueño */}
            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-orange-200 transition">
                <input type="radio" name="type" value="OWNER_WITHDRAWAL" className="w-5 h-5 text-orange-600 focus:ring-orange-500" />
                <span className="font-bold text-orange-700 text-sm">🟠 Retiro Dueño <br/><span className="text-xs font-normal text-gray-500">Devolución</span></span>
            </label>

            {/* Opción 3: Ajuste/Rotura */}
            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-red-200 transition">
                <input type="radio" name="type" value="ADJUSTMENT" className="w-5 h-5 text-red-600 focus:ring-red-500" />
                <span className="font-bold text-red-700 text-sm">🔴 Baja / Rotura <br/><span className="text-xs font-normal text-gray-500">Pérdida</span></span>
            </label>
        </div>
      </div>

      {/* SELECCIÓN DE PRODUCTO */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Variante a Ajustar</label>
        <select 
            name="variantId" 
            required 
            className="w-full border p-3 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {products.length > 1 && <option value="">Seleccionar variante...</option>}
          {products.map(p => (
            <option key={p.variantId} value={p.variantId}>
              {p.productName} (Stock actual: {p.stock})
            </option>
          ))}
        </select>
      </div>

      {/* CANTIDAD */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (Unidades)</label>
        <input 
          name="quantity" 
          type="number" 
          min="1" 
          required 
          className="w-full border p-3 rounded text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Ej: 5"
        />
      </div>

      {/* MOTIVO */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nota / Motivo (Opcional)</label>
        <input 
          name="reason" 
          type="text" 
          className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Ej: Remito #1234 / Se rompió al limpiar"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-3 rounded text-white font-bold text-lg shadow-lg transform transition 
            ${loading 
                ? 'bg-slate-400 cursor-wait' 
                : 'bg-slate-800 hover:bg-slate-900 hover:scale-[1.02] active:scale-95'
            }
        `}
      >
        {loading ? "Procesando..." : "Confirmar Movimiento"}
      </button>

    </form>
  )
}