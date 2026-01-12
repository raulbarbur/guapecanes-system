// src/app/pos/page.tsx
import { prisma } from "@/lib/prisma"
import PosSystem from "@/components/PosSystem"

export default async function PosPage() {
  // 1. Buscamos productos activos con sus variantes
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { 
        variants: true, 
        owner: true,
        category: true 
    },
    orderBy: { name: 'asc' }
  })

  // 2. ESTRUCTURAMOS JERÁRQUICAMENTE
  // En lugar de aplanar, mandamos el objeto Producto con un array de sus variantes dentro.
  const groupedProducts = products.map(p => {
    // Calculamos el stock total para mostrar en la tarjeta principal
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    
    // Imagen principal (usamos la de la primera variante que tenga foto, o null)
    const mainImage = p.variants.find(v => v.imageUrl)?.imageUrl || null

    return {
      id: p.id,
      name: p.name,
      categoryName: p.category.name,
      ownerName: p.owner.name,
      imageUrl: mainImage,
      totalStock: totalStock,
      // Detalle de variantes para el modal
      variants: p.variants.map(v => ({
        id: v.id,
        name: v.name, // "Rojo", "XL", "Estándar"
        price: Number(v.salePrice),
        stock: v.stock
      }))
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
      
      {/* Pasamos la lista agrupada */}
      <PosSystem products={groupedProducts} />
    </div>
  )
}