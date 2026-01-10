// src/app/inventory/page.tsx
import { prisma } from "@/lib/prisma"
// Importamos la nueva función (asegurate de cambiar el nombre en el import también si lo cambiaste en el archivo)
import { registerStockMovement } from "@/actions/inventory-actions"

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { variants: true, owner: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Control de Stock</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        {/* Cambiamos la acción a la nueva función */}
        <form action={registerStockMovement} className="space-y-6">
          
          {/* NUEVO: TIPO DE MOVIMIENTO */}
          <div className="flex gap-4 p-4 bg-gray-50 rounded border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="ENTRY" defaultChecked className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700">🟢 Ingreso (Remito)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="OWNER_WITHDRAWAL" className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-orange-700">🟠 Retiro de Dueño</span>
            </label>
          </div>

          {/* SELECCIÓN DE PRODUCTO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
            <select name="variantId" required className="w-full border p-3 rounded bg-white">
              <option value="">Seleccionar producto...</option>
              {products.map(p => {
                const v = p.variants[0]
                return (
                  <option key={v.id} value={v.id}>
                    {p.name} (Stock: {v.stock}) - Dueño: {p.owner.name}
                  </option>
                )
              })}
            </select>
          </div>

          {/* CANTIDAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <input 
              name="quantity" 
              type="number" 
              min="1" 
              required 
              className="w-full border p-3 rounded text-lg font-bold" 
              placeholder="Ej: 5"
            />
          </div>

          {/* MOTIVO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nota / Motivo</label>
            <input 
              name="reason" 
              type="text" 
              className="w-full border p-3 rounded" 
              placeholder="Ej: Remito #123 o 'Se lo llevó para evento'"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-800 text-white py-3 rounded hover:bg-slate-900 font-bold text-lg"
          >
            Registrar Movimiento
          </button>

        </form>
      </div>
    </div>
  )
}