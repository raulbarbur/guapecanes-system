// src/app/inventory/page.tsx
import { prisma } from "@/lib/prisma"
import { registerStockEntry } from "@/actions/inventory-actions"

export default async function InventoryPage() {
  // Buscamos productos para llenar el select
  // Incluimos variants para saber su stock actual y el nombre del dueño
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      owner: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Ingreso de Mercadería (Remito)</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
        <form action={registerStockEntry} className="space-y-6">
          
          {/* SELECCIÓN DE PRODUCTO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
            <select name="variantId" required className="w-full border p-3 rounded bg-white">
              <option value="">Seleccionar producto...</option>
              {products.map(p => {
                const v = p.variants[0] // Asumimos variante única
                return (
                  <option key={v.id} value={v.id}>
                    {p.name} (Stock actual: {v.stock}) - De: {p.owner.name}
                  </option>
                )
              })}
            </select>
          </div>

          {/* CANTIDAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad a Ingresar</label>
            <input 
              name="quantity" 
              type="number" 
              min="1" 
              required 
              className="w-full border p-3 rounded text-lg font-bold" 
              placeholder="Ej: 10"
            />
          </div>

          {/* MOTIVO (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Motivo / Nro Remito</label>
            <input 
              name="reason" 
              type="text" 
              className="w-full border p-3 rounded" 
              placeholder="Ej: Remito #0042 de Juan"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-bold text-lg"
          >
            Confirmar Ingreso
          </button>

        </form>
      </div>
    </div>
  )
}