// src/app/pos/page.tsx
//export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import PosSystem from "@/components/PosSystem"

export default async function PosPage() {
  // 1. CARGAR PRODUCTOS
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { 
        variants: true, 
        owner: true,
        category: true 
    },
    orderBy: { name: 'asc' }
  })

  // 2. CARGAR CLIENTES (CORREGIDO)
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
    select: { 
        id: true, 
        name: true 
        // Eliminamos currentDebt de aquí porque no existe en la tabla
    }
  })

  // Mapeo de Productos (Lógica de servidor existente)
  const groupedProducts = products.map(p => {
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    const mainImage = p.variants.find(v => v.imageUrl)?.imageUrl || null

    return {
      id: p.id,
      name: p.name,
      categoryName: p.category.name,
      ownerName: p.owner.name,
      imageUrl: mainImage,
      totalStock: totalStock,
      variants: p.variants.map(v => ({
        id: v.id,
        name: v.name,
        price: Number(v.salePrice),
        stock: v.stock
      }))
    }
  })

  return (
    <div className="h-screen flex flex-col p-4 bg-background">
      <header className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            🛒 Punto de Venta
        </h1>
        <div className="text-sm font-bold bg-card text-muted-foreground px-3 py-1 rounded border border-border shadow-sm">
            Caja Principal
        </div>
      </header>
      
      {/* Pasamos products Y customers */}
      <PosSystem products={groupedProducts} customers={customers} />
    </div>
  )
}