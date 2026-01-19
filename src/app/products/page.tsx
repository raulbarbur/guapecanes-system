import { prisma } from "@/lib/prisma"
import ProductForm from "@/components/ProductForm"
import ProductActions from "@/components/ProductActions"
import SearchInput from "@/components/SearchInput" 
import Link from "next/link"
import { PageHeader } from "@/components/ui/shared/PageHeader"
import { AppCard } from "@/components/ui/shared/AppCard"
import { cn } from "@/lib/utils"

interface Props {
  searchParams?: Promise<{
    query?: string
  }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params?.query || ""

  // R-02: Feature Flag
  const showImages = process.env.NEXT_PUBLIC_ENABLE_IMAGES === 'true'

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
    <div className="p-4 md:p-8 max-w-[1920px] mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      
      {/* 1. HEADER ESTANDARIZADO */}
      <PageHeader 
        title="Inventario"
        description="Gestión maestra de productos, precios y stock."
      >
         <div className="flex gap-2 w-full md:w-auto">
            <Link 
              href="/inventory" 
              className="flex-1 md:flex-none justify-center bg-card hover:bg-accent text-foreground border border-border px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
            >
              📦 <span className="hidden sm:inline">Control Stock</span>
            </Link>
            <Link 
              href="/products/import" 
              className="flex-1 md:flex-none justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-green-900/20"
            >
              📄 <span className="hidden sm:inline">Importar Excel</span>
            </Link>
         </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="xl:col-span-1 order-2 xl:order-1">
          <div className="xl:sticky xl:top-6 space-y-6">
             {/* Search en móvil aparece arriba del form para acceso rápido */}
             <div className="xl:hidden">
                <SearchInput placeholder="🔍 Buscar producto..." />
             </div>
             
             {/* Contenedor del Formulario (Asumimos que ProductForm es interno, 
                 pero le damos un wrapper si fuera necesario) */}
             <div className="bg-card border border-border rounded-3xl p-1 md:p-0 shadow-sm">
                 <ProductForm owners={owners} categories={categories} />
             </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTADO */}
        <div className="xl:col-span-3 flex flex-col gap-4 order-1 xl:order-2">
            
            {/* Search Desktop */}
            <div className="hidden xl:block max-w-md">
                <SearchInput placeholder="🔍 Buscar por nombre, dueño, categoría..." />
            </div>

            <AppCard noPadding className="min-h-[500px] flex flex-col">
                {/* 
                    === VISTA DESKTOP (TABLA) === 
                    Hidden en pantallas chicas (< md)
                */}
                <div className="hidden md:block overflow-x-auto">
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
                            className={cn(
                                "group transition-colors duration-200",
                                isArchived ? 'bg-muted/30 opacity-60 grayscale' : 'hover:bg-muted/30 bg-card'
                            )}
                            >
                            <td className="px-6 py-4">
                                <Link href={`/products/${p.id}`} className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                                    <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                        {showImages && mainImage ? (
                                            <img src={mainImage} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <span className="text-xl">📦</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                                            {isArchived && <span className="text-[9px] font-bold text-destructive border border-destructive/30 px-1 rounded uppercase">Archivado</span>}
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                                            <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">{p.owner.name}</span>
                                            {variantCount > 1 && (
                                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    +{variantCount} var
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </td>
                            
                            <td className="px-6 py-4">
                                <span className="text-muted-foreground text-xs font-bold border border-border px-2 py-1 rounded-lg">
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
                                <span className="text-destructive bg-destructive/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide">AGOTADO</span>
                                ) : (
                                <span className={cn(
                                    "font-mono font-bold text-lg",
                                    totalStock <= 5 ? 'text-orange-500' : 'text-green-600 dark:text-green-400'
                                )}>
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
                    </tbody>
                    </table>
                </div>

                {/* 
                    === VISTA MÓVIL (CARDS) === 
                    Visible solo en pantallas chicas (< md)
                */}
                <div className="md:hidden divide-y divide-border">
                    {products.map(p => {
                        const isArchived = !p.isActive
                        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
                        const prices = p.variants.map(v => Number(v.salePrice))
                        const minPrice = Math.min(...prices)
                        const mainImage = p.variants[0]?.imageUrl
                        
                        return (
                            <div key={p.id} className={cn("p-4 flex gap-4", isArchived && "opacity-60 grayscale bg-muted/20")}>
                                <Link href={`/products/${p.id}`} className="shrink-0">
                                    <div className="w-20 h-20 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                                        {showImages && mainImage ? (
                                            <img src={mainImage} className="w-full h-full object-cover" alt={p.name} />
                                        ) : (
                                            <span className="text-3xl">📦</span>
                                        )}
                                    </div>
                                </Link>
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <Link href={`/products/${p.id}`}>
                                                <h3 className="font-bold text-foreground leading-tight line-clamp-2">{p.name}</h3>
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-1">{p.owner.name} • {p.category.name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-mono font-black text-lg">${minPrice}</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-2">
                                         {totalStock === 0 ? (
                                            <span className="text-xs font-black text-destructive bg-destructive/10 px-2 py-1 rounded">SIN STOCK</span>
                                         ) : (
                                            <span className={cn("text-xs font-bold px-2 py-1 rounded bg-secondary border border-border", totalStock <= 3 && "text-orange-500 border-orange-200")}>
                                                Stock: {totalStock}
                                            </span>
                                         )}
                                         
                                         <ProductActions id={p.id} isActive={p.isActive} stock={totalStock} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Empty State Universal */}
                {products.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground p-4 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-3xl mb-4">
                            🧐
                        </div>
                        <p className="font-medium text-lg">No encontramos productos</p>
                        <p className="text-sm opacity-60 max-w-xs">
                            {query ? `No hay resultados para "${query}".` : "Tu inventario está vacío."}
                        </p>
                    </div>
                )}
            </AppCard>
        </div>
      </div>
    </div>
  )
}