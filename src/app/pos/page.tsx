// src/app/pos/page.tsx
import { prisma } from "@/lib/prisma"
import PosSystem from "@/components/PosSystem"

export default async function PosPage() {
  // Buscamos productos con stock > 0 (o todos, para mostrar agotados visualmente)
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true, owner: true }
  })

  // Transformamos los datos complejos de Prisma a una estructura simple para el Frontend
  const simpleProducts = products.map(p => {
    const v = p.variants[0] // Asumimos variante única
    return {
      id: v.id,
      name: p.name,
      price: Number(v.salePrice), // Convertimos Decimal a Number para JS
      stock: v.stock,
      imageUrl: v.imageUrl,
      ownerName: p.owner.name
    }
  })

  return (
    <div className="h-screen flex flex-col p-4 bg-gray-50">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Punto de Venta</h1>
        <div className="text-sm text-gray-500">Caja Principal</div>
      </header>
      
      {/* Cargamos el sistema interactivo */}
      <PosSystem products={simpleProducts} />
    </div>
  )
}