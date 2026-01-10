// src/app/products/page.tsx
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import ProductActions from "@/components/ProductActions" // 👈 El componente nuevo
import Link from "next/link"

export default async function ProductsPage() {
  // 1. Datos necesarios para los selectores del formulario
  const owners = await prisma.owner.findMany({ select: { id: true, name: true } })
  const categories = await prisma.category.findMany({ select: { id: true, name: true } })

  // 2. Listado de productos (Traemos TODO para gestionar el inventario)
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      category: true,
      owner: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Inventario de Productos</h1>
        
        {/* Enlace rápido al importador masivo */}
        <Link 
          href="/products/import" 
          className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 font-bold text-sm flex items-center gap-2"
        >
          📄 Importar Excel
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO ALTA RÁPIDA */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
             <ProductForm owners={owners} categories={categories} />
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLA DE GESTIÓN */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                <tr>
                  <th className="px-4 py-3">Producto / Dueño</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => {
                  const variant = p.variants[0] // Variante principal
                  const isArchived = !p.isActive

                  return (
                    <tr 
                      key={p.id} 
                      className={`transition duration-150
                        ${isArchived 
                            ? 'bg-gray-100 opacity-60 grayscale' // Estilo "desactivado"
                            : 'hover:bg-blue-50 bg-white'
                        }
                      `}
                    >
                      {/* PRODUCTO */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            {variant?.imageUrl ? (
                            <img src={variant.imageUrl} className="w-10 h-10 object-cover rounded border" />
                            ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                                Sin foto
                            </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-900 leading-tight">
                                    {p.name}
                                    {isArchived && <span className="text-[10px] text-red-600 ml-2 border border-red-200 px-1 rounded">ARCHIVADO</span>}
                                </p>
                                <p className="text-xs text-gray-500">{p.owner.name}</p>
                            </div>
                        </div>
                      </td>

                      {/* CATEGORÍA */}
                      <td className="px-4 py-3 text-gray-600">
                        {p.category.name}
                      </td>

                      {/* PRECIO */}
                      <td className="px-4 py-3 font-bold text-green-700 text-base">
                        ${variant?.salePrice.toString()}
                      </td>

                      {/* STOCK */}
                      <td className="px-4 py-3 text-center">
                        {variant?.stock === 0 ? (
                          <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold">AGOTADO</span>
                        ) : (
                          <span className="font-mono font-bold text-gray-700">{variant?.stock}</span>
                        )}
                      </td>

                      {/* ACCIONES (Componente Cliente) */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                            <ProductActions 
                                id={p.id} 
                                isActive={p.isActive} 
                                stock={variant?.stock || 0}
                            />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <p className="text-lg">Tu inventario está vacío.</p>
                      <p className="text-sm">¡Agregá el primer producto a la izquierda!</p>
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