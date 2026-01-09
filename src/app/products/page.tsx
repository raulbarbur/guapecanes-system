// src/app/products/page.tsx
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import Link from "next/link"

export default async function ProductsPage() {
  // 1. Buscamos datos necesarios para los selectores
  const owners = await prisma.owner.findMany({ select: { id: true, name: true } })
  const categories = await prisma.category.findMany({ select: { id: true, name: true } })

  // 2. Buscamos productos ya creados para listar (opcional por ahora, para verificar)
  const products = await prisma.product.findMany({
    include: { 
      variants: true, 
      category: true,
      owner: true 
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventario de Productos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Formulario de Alta */}
        <div className="lg:col-span-1">
          <ProductForm owners={owners} categories={categories} />
        </div>

        {/* Columna Derecha: Listado Simple */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const variant = p.variants[0] // Tomamos la variante principal
                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center gap-3">
                        {variant?.imageUrl && (
                          <img src={variant.imageUrl} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.owner.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.category.name}</td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        ${variant?.salePrice.toString()}
                      </td>
                      <td className="px-4 py-3">
                        {variant?.stock === 0 ? (
                          <span className="text-red-500 bg-red-50 px-2 py-1 rounded text-xs">Sin Stock</span>
                        ) : variant?.stock}
                      </td>
                    </tr>
                  )
                })}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                      No hay productos. ¡Crea el primero a la izquierda!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}