// src/app/products/page.tsx
import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import ProductActions from "@/components/ProductActions"
import SearchInput from "@/components/SearchInput" // Asegurate de que SearchInput no tenga bg-white hardcodeado
import Link from "next/link"

interface Props {
  searchParams?: Promise<{
    query?: string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  const owners = await prisma.owner.findMany({ select: { id: true, name: true } })
  const categories = await prisma.category.findMany({ select: { id: true, name: true } })

  const products = await prisma.product.findMany({
    where: query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { owner: { name: { contains: query, mode: 'insensitive' } } }
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
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">Inventario</h1>
           <p className="text-sm text-muted-foreground mt-1">Gestión de productos, precios y variantes.</p>
        </div>
        
        <div className="flex gap-3">
            <Link 
              href="/inventory" 
              className="bg-card hover:bg-accent text-foreground border border-border px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
            >
              📦 Control Stock
            </Link>
            <Link 
              href="/products/import" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-green-900/20"
            >
              📄 Excel Import
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO (Sticky en desktop grande) */}
        <div className="xl:col-span-1">
          <div className="xl:sticky xl:top-6">
             {/* Barra de Búsqueda Móvil (si se quiere sacar de la tabla) */}
             <div className="mb-6 xl:hidden">
                <SearchInput placeholder="Buscar por producto..." />
             </div>
             <ProductForm owners={owners} categories={categories} />
          </div>
        </div>

        {/* COLUMNA DERECHA: TABLA */}
        <div className="xl:col-span-3 flex flex-col gap-4">
            
            {/* Buscador Desktop */}
            <div className="hidden xl:block max-w-md">
                <SearchInput placeholder="Buscar por producto, dueño o categoría..." />
            </div>

            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-xs">
                        <tr>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4">Precio Venta</th>
                        <th className="px-6 py-4 text-center">Stock</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {products.map(p => {
                        const isArchived = !p.isActive
                        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
                        const variantCount = p.variants.length
                        const prices = p.variants.map(v => Number(v.salePrice))
                        const minPrice = Math.min(...prices)
                        const maxPrice = Math.max(...prices)
                        const mainImage = p.variants[0]?.imageUrl

                        return (
                            <tr 
                            key={p.id} 
                            className={`group transition-colors duration-200 ${isArchived ? 'bg-muted/30 opacity-60 grayscale' : 'hover:bg-muted/30 bg-card'}`}
                            >
                            <td className="px-6 py-4">
                                <Link href={`/products/${p.id}`} className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                                    <div className="w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                        {mainImage ? (
                                            <img src={mainImage} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <span className="text-[10px] font-bold text-muted-foreground">FOTO</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                                            {isArchived && <span className="text-[9px] font-bold text-destructive border border-destructive/30 px-1 rounded uppercase">Archivado</span>}
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                                            <span>{p.owner.name}</span>
                                            {variantCount > 1 && (
                                                <span className="bg-primary/10 text-primary px-1.5 rounded-sm font-bold text-[10px]">
                                                    +{variantCount} var
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </td>
                            
                            <td className="px-6 py-4">
                                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-lg text-xs font-bold border border-border">
                                    {p.category.name}
                                </span>
                            </td>
                            
                            <td className="px-6 py-4 font-mono font-bold text-foreground">
                                {variantCount > 1 && minPrice !== maxPrice ? (
                                    <span className="text-sm">${minPrice} - ${maxPrice}</span>
                                ) : (
                                    <span className="text-base">${minPrice || 0}</span>
                                )}
                            </td>
                            
                            <td className="px-6 py-4 text-center">
                                {totalStock === 0 ? (
                                <span className="text-destructive bg-destructive/10 px-2 py-1 rounded text-xs font-bold">AGOTADO</span>
                                ) : (
                                <span className={`font-mono font-bold text-lg ${totalStock <= 5 ? 'text-orange-500' : 'text-foreground'}`}>
                                    {totalStock}
                                </span>
                                )}
                            </td>
                            
                            <td className="px-6 py-4">
                                <ProductActions id={p.id} isActive={p.isActive} stock={totalStock} />
                            </td>
                            </tr>
                        )
                        })}
                        
                        {products.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-20 text-muted-foreground">
                                <span className="text-4xl block mb-2 opacity-50">📦</span>
                                {query ? "No se encontraron resultados." : "No hay productos cargados."}
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}