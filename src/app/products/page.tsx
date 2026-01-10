// src/app/products/page.tsx
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import ProductActions from "@/components/ProductActions"
import SearchInput from "@/components/SearchInput" // 👈 Importamos
import Link from "next/link"

// Definimos que esta página recibe parámetros de búsqueda
interface Props {
  searchParams?: Promise<{
    query?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  // Esperamos los parámetros (Next.js 15 requiere await, versiones anteriores no, pero es buena práctica)
  const params = await searchParams
  const query = params?.query || ""

  // 1. Datos para selectores (Formulario)
  const owners = await prisma.owner.findMany({ select: { id: true, name: true } })
  const categories = await prisma.category.findMany({ select: { id: true, name: true } })

  // 2. FILTRO DINÁMICO
  // Si hay query, filtramos. Si no, traemos todo.
  const products = await prisma.product.findMany({
    where: query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' } }, // Nombre producto
            { owner: { name: { contains: query, mode: 'insensitive' } } } // Nombre dueño
        ]
    } : undefined,
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
        
        <div className="flex gap-3">
            <Link 
              href="/inventory" 
              className="bg-slate-800 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-900 font-bold text-sm flex items-center gap-2 transition"
            >
              📦 Stock
            </Link>
            <Link 
              href="/products/import" 
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 font-bold text-sm flex items-center gap-2 transition"
            >
              📄 Importar
            </Link>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="mb-8 max-w-md">
         <SearchInput placeholder="Buscar por producto o dueño..." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
             <ProductForm owners={owners} categories={categories} />
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLA */}
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
                  const variant = p.variants[0]
                  const isArchived = !p.isActive

                  return (
                    <tr 
                      key={p.id} 
                      className={`transition duration-150 ${isArchived ? 'bg-gray-100 opacity-60 grayscale' : 'hover:bg-blue-50 bg-white'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            {variant?.imageUrl ? (
                            <img src={variant.imageUrl} className="w-10 h-10 object-cover rounded border" />
                            ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">Sin foto</div>
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
                      <td className="px-4 py-3 text-gray-600">{p.category.name}</td>
                      <td className="px-4 py-3 font-bold text-green-700 text-base">${variant?.salePrice.toString()}</td>
                      <td className="px-4 py-3 text-center">
                        {variant?.stock === 0 ? (
                          <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold">AGOTADO</span>
                        ) : (
                          <span className="font-mono font-bold text-gray-700">{variant?.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                            <ProductActions id={p.id} isActive={p.isActive} stock={variant?.stock || 0} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      {query ? "No se encontraron resultados para tu búsqueda." : "Inventario vacío."}
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