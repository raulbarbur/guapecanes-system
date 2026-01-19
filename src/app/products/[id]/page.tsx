// src/app/products/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { translateMovementType } from "@/services/inventory-service"
import Link from "next/link"
import { notFound } from "next/navigation"
import StockMovementForm from "@/components/StockMovementForm"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      owner: true,
      variants: {
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!product) return notFound()

  const history = await prisma.stockMovement.findMany({
    where: { variant: { productId: id } },
    include: { variant: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const formOptions = product.variants.map(v => ({
    variantId: v.id,
    productName: v.name === 'Estándar' ? product.name : v.name, 
    ownerName: product.owner.name,
    stock: v.stock
  }))

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
  
  let totalCostValue = 0
  let totalSaleValue = 0

  product.variants.forEach(v => {
    totalCostValue += Number(v.costPrice) * v.stock
    totalSaleValue += Number(v.salePrice) * v.stock
  })

  const mainImage = product.variants.find(v => v.imageUrl)?.imageUrl || null

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex items-center justify-between">
        <Link href="/products" className="text-primary hover:underline font-bold text-sm flex items-center gap-1">
           ← Volver al Inventario
        </Link>
        <Link 
            href={`/products/${id}/edit`}
            className="bg-card hover:bg-accent text-foreground border border-border px-4 py-2 rounded-xl font-bold transition text-sm shadow-sm"
        >
            ✏️ Editar Datos
        </Link>
      </div>

      {/* TARJETA PRINCIPAL DEL PRODUCTO */}
      <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Imagen */}
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-muted rounded-2xl border border-border flex items-center justify-center overflow-hidden">
                {mainImage ? (
                    <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-muted-foreground text-xs font-bold">Sin Foto</span>
                )}
            </div>

            {/* Info Texto */}
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-foreground font-nunito">{product.name}</h1>
                    {!product.isActive && (
                        <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-xs font-bold border border-destructive/20 uppercase">
                            ARCHIVADO
                        </span>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                    <p className="flex items-center gap-1">
                        📂 <strong className="text-foreground">{product.category.name}</strong>
                    </p>
                    <p className="flex items-center gap-1">
                        👤 <strong className="text-foreground">{product.owner.name}</strong>
                    </p>
                </div>

                <p className="text-muted-foreground italic text-sm border-l-4 border-primary/20 pl-4 py-1">
                    {product.description || "Sin descripción."}
                </p>
            </div>

            {/* KPI Boxes */}
            <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">Stock Total</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
                        {totalStock} <span className="text-sm font-bold text-blue-600/60 dark:text-blue-400/60">u.</span>
                    </p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">Valor Venta (Est.)</p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-300">${totalSaleValue.toLocaleString()}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: VARIANTES + FORMULARIO */}
        <div className="lg:col-span-1 space-y-8">
            
            {/* Tabla Variantes */}
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h2 className="font-bold text-foreground flex items-center gap-2">
                        🏷️ Variantes
                    </h2>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase">
                        <tr>
                            <th className="p-3 text-left">Nombre</th>
                            <th className="p-3 text-right">Precio</th>
                            <th className="p-3 text-center">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {product.variants.map(v => (
                            <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-medium text-foreground">{v.name}</td>
                                <td className="p-3 text-right text-muted-foreground font-mono">${Number(v.salePrice)}</td>
                                <td className="p-3 text-center">
                                    <span className={cn(
                                        "font-bold px-2 py-0.5 rounded text-xs border",
                                        v.stock === 0 
                                            ? 'bg-destructive/10 text-destructive border-destructive/20' 
                                            : 'bg-secondary text-secondary-foreground border-transparent'
                                    )}>
                                        {v.stock}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* FORMULARIO INCRUSTADO */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-lg shadow-primary/5">
                <h3 className="font-bold text-foreground mb-6 border-b border-border pb-2">📦 Ajuste Rápido de Stock</h3>
                <StockMovementForm 
                    products={formOptions} 
                    redirectPath={`/products/${id}`} 
                />
            </div>

            {/* Info Financiera */}
            <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 text-xs text-yellow-700 dark:text-yellow-400">
                <p className="font-bold mb-1 uppercase tracking-wide">💡 Dato Financiero</p>
                <p>Costo inmovilizado en stock: <strong className="text-sm">${totalCostValue.toLocaleString()}</strong></p>
            </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2 px-2">
                📜 Auditoría de Movimientos
            </h2>
            
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-bold text-xs uppercase">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Variante</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4 text-right">Cant.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-muted-foreground italic">
                                        No hay movimientos registrados aún.
                                    </td>
                                </tr>
                            ) : (
                                history.map(mov => {
                                    const isPositive = mov.quantity > 0
                                    const typeLabel = translateMovementType(mov.type)

                                    return (
                                        <tr key={mov.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="p-4">
                                                <p className="font-bold text-foreground">
                                                    {mov.createdAt.toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {mov.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </p>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {mov.variant.name === 'Estándar' ? '-' : mov.variant.name}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium text-foreground">{typeLabel}</p>
                                                {mov.reason && (
                                                    <p className="text-xs text-muted-foreground italic mt-0.5">
                                                        "{mov.reason}"
                                                    </p>
                                                )}
                                            </td>
                                            <td className={cn(
                                                "p-4 text-right font-black text-base",
                                                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                            )}>
                                                {isPositive ? '+' : ''}{mov.quantity}
                                            </td>
                                        </tr>
                                    )
                                })
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