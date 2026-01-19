// src/app/inventory/page.tsx
//export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import StockMovementForm from "@/components/StockMovementForm"
import InventoryImporter from "@/components/InventoryImporter"
import SearchInput from "@/components/SearchInput"
import Link from "next/link"

interface Props {
  searchParams?: Promise<{ query?: string }>
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

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
    take: query ? 100 : 20 
  })

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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Control de Stock</h1>
            <p className="text-muted-foreground text-sm font-medium">Entradas, salidas y ajustes de inventario.</p>
        </div>
        <Link href="/products" className="text-primary hover:underline text-sm font-bold bg-primary/10 px-4 py-2 rounded-lg transition">
            ← Volver a Lista
        </Link>
      </div>

      {/* SECCIÓN 1: IMPORTADOR MASIVO */}
      {/* (Nota: InventoryImporter debería refactorizarse en el futuro, pero por ahora lo envolvemos bien) */}
      <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
          <InventoryImporter />
      </div>

      {/* SECCIÓN 2: MOVIMIENTO MANUAL */}
      <div className="bg-card p-6 md:p-8 rounded-3xl shadow-lg border border-border">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            📦 Movimiento Individual
        </h2>
        
        {/* BUSCADOR */}
        <div className="mb-8 bg-muted/30 p-4 rounded-xl border border-border">
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                1. Buscá el producto para habilitarlo en la lista:
            </label>
            <SearchInput placeholder="Escribí para buscar (Ej: Buzo, Collar)..." />
        </div>

        {productOptions.length > 0 ? (
            <StockMovementForm products={productOptions} />
        ) : (
            <div className="text-center p-8 bg-muted/50 rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
                {query ? "No se encontraron productos." : "Usá el buscador de arriba para encontrar el producto a ajustar."}
            </div>
        )}
      </div>
    </div>
  )
}