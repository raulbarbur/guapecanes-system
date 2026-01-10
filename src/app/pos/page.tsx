// src/app/pos/page.tsx
import { prisma } from "@/lib/prisma"
import PosSystem from "@/components/PosSystem"

export default async function PosPage() {
  // Buscamos productos activos
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { 
        variants: true, 
        owner: true,
        category: true // 👈 Agregamos esto
    }
  })

  // Transformamos los datos para el Frontend
  const simpleProducts = products.map(p => {
    const v = p.variants[0] // Asumimos variante única
    return {
      id: v.id,
      name: p.name,
      price: Number(v.salePrice),
      stock: v.stock,
      imageUrl: v.imageUrl,
      ownerName: p.owner.name,
      categoryName: p.category.name // 👈 Dato clave para el filtro
    }
  })

  return (
    <div className="h-screen flex flex-col p-4 bg-gray-50">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🛒 Punto de Venta
        </h1>
        <div className="text-sm font-bold bg-white px-3 py-1 rounded border shadow-sm text-gray-500">
            Caja Principal
        </div>
      </header>
      
      {/* Cargamos el sistema interactivo */}
      <PosSystem products={simpleProducts} />
    </div>
  )
}