// src/app/inventory/page.tsx
import { prisma } from "@/lib/prisma"
import StockMovementForm from "@/components/StockMovementForm"
import Link from "next/link"

export default async function InventoryPage() {
  // Buscamos datos para el selector
  const products = await prisma.product.findMany({
    where: { isActive: true }, // Solo productos activos
    include: { variants: true, owner: true },
    orderBy: { name: 'asc' }
  })

  // Mapeamos a una estructura simple para pasar al Client Component
  const productOptions = products.map(p => ({
    variantId: p.variants[0].id,
    productName: p.name,
    ownerName: p.owner.name,
    stock: p.variants[0].stock
  }))

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Control de Stock</h1>
        <Link href="/products" className="text-blue-600 hover:underline text-sm font-bold">
            ← Volver a Lista
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        {/* Renderizamos el formulario interactivo */}
        <StockMovementForm products={productOptions} />
      </div>
    </div>
  )
}