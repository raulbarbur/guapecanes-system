// src/app/inventory/page.tsx
import { prisma } from "@/lib/prisma"
import StockMovementForm from "@/components/StockMovementForm"
import InventoryImporter from "@/components/InventoryImporter"
import SearchInput from "@/components/SearchInput" // 👈 Reutilizamos tu buscador
import Link from "next/link"

interface Props {
  searchParams?: Promise<{ query?: string }>
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  // OPTIMIZACIÓN: Solo traemos datos si hay búsqueda o limitamos a los primeros 20
  // Esto evita cargar 1000 productos en el <select> de golpe.
  const products = await prisma.product.findMany({
    where: { 
        isActive: true,
        OR: query ? [
            { name: { contains: query, mode: 'insensitive' } },
            { variants: { some: { name: { contains: query, mode: 'insensitive' } } } }
        ] : undefined
    },
    include: { variants: true, owner: true },
    orderBy: { name: 'asc' },
    take: query ? 100 : 20 // Si busca, damos más margen. Si no, solo los top 20.
  })

  // Aplanamos la lista
  const productOptions = products.flatMap(p => 
    p.variants.map(v => ({
        variantId: v.id,
        productName: v.name === 'Estándar' ? p.name : `${p.name} - ${v.name}`,
        ownerName: p.owner.name,
        stock: v.stock
    }))
  )
  productOptions.sort((a, b) => a.productName.localeCompare(b.productName))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Control de Stock</h1>
        <Link href="/products" className="text-blue-600 hover:underline text-sm font-bold">
            ← Volver a Lista
        </Link>
      </div>

      <InventoryImporter />

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Movimiento Manual</h2>
        
        {/* BUSCADOR PARA FILTRAR EL SELECT */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                1. Buscá el producto para habilitarlo en la lista:
            </label>
            <SearchInput placeholder="Escribí para buscar (Ej: Buzo, Collar)..." />
        </div>

        {productOptions.length > 0 ? (
            <StockMovementForm products={productOptions} />
        ) : (
            <div className="text-center p-4 bg-gray-50 rounded text-gray-500 text-sm">
                {query ? "No se encontraron productos." : "Usá el buscador para encontrar el producto a ajustar."}
            </div>
        )}
      </div>
    </div>
  )
}