// src/app/products/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import { translateMovementType } from "@/services/inventory-service"
import Link from "next/link"
import { notFound } from "next/navigation"
import StockMovementForm from "@/components/StockMovementForm" // 👈 Importamos el form

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  // 1. CONSULTA PRINCIPAL
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

  // 2. CONSULTA DE HISTORIAL
  const history = await prisma.stockMovement.findMany({
    where: {
      variant: { productId: id }
    },
    include: {
      variant: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  // 3. DATOS PARA EL FORMULARIO (Mapeo)
  // Convertimos las variantes de ESTE producto al formato que espera el selector
  const formOptions = product.variants.map(v => ({
    variantId: v.id,
    // Como ya estamos dentro del producto, mostramos solo el nombre de la variante para que quede más limpio
    productName: v.name === 'Estándar' ? product.name : v.name, 
    ownerName: product.owner.name,
    stock: v.stock
  }))

  // 4. CÁLCULOS KPI
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
  
  let totalCostValue = 0
  let totalSaleValue = 0

  product.variants.forEach(v => {
    totalCostValue += Number(v.costPrice) * v.stock
    totalSaleValue += Number(v.salePrice) * v.stock
  })

  const mainImage = product.variants.find(v => v.imageUrl)?.imageUrl || null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/products" className="text-blue-600 hover:underline font-bold text-sm">
           ← Volver al Inventario
        </Link>
        <div>
             <Link 
                href={`/products/${id}/edit`}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition text-sm"
             >
                ✏️ Editar Datos
             </Link>
             {/* El botón de ir a /inventory lo sacamos porque ahora el form está acá */}
        </div>
      </div>

      {/* TARJETA PRINCIPAL DEL PRODUCTO */}
      <div className="bg-white rounded-lg shadow border overflow-hidden mb-8">
        <div className="p-6 flex flex-col md:flex-row gap-8">
            <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg border flex items-center justify-center overflow-hidden">
                {mainImage ? (
                    <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400 text-xs">Sin Foto</span>
                )}
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                    {!product.isActive && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold border border-red-200">
                            ARCHIVADO
                        </span>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <p>📂 Categoría: <strong className="text-gray-900">{product.category.name}</strong></p>
                    <p>👤 Dueño: <strong className="text-gray-900">{product.owner.name}</strong></p>
                </div>

                <p className="text-gray-500 italic text-sm border-l-4 border-gray-200 pl-3">
                    {product.description || "Sin descripción."}
                </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase">Stock Total</p>
                    <p className="text-2xl font-bold text-blue-900">{totalStock} <span className="text-sm font-normal">unidades</span></p>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-100">
                    <p className="text-xs text-green-600 font-bold uppercase">Valor Venta (Est.)</p>
                    <p className="text-xl font-bold text-green-900">${totalSaleValue.toLocaleString()}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: VARIANTES + FORMULARIO RÁPIDO */}
        <div className="lg:col-span-1 space-y-8">
            
            {/* Tabla Variantes */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🏷️ Variantes
                </h2>
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="p-3 text-left">Nombre</th>
                                <th className="p-3 text-right">Precio</th>
                                <th className="p-3 text-center">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {product.variants.map(v => (
                                <tr key={v.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{v.name}</td>
                                    <td className="p-3 text-right text-gray-600">${Number(v.salePrice)}</td>
                                    <td className="p-3 text-center">
                                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${v.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-800'}`}>
                                            {v.stock}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORMULARIO INCRUSTADO */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-inner">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">📦 Ajuste Rápido de Stock</h3>
                {/* 
                    Pasamos redirectPath para que al guardar recargue ESTA misma página 
                    y no nos mande al listado general.
                */}
                <StockMovementForm 
                    products={formOptions} 
                    redirectPath={`/products/${id}`} 
                />
            </div>

            {/* Info Financiera */}
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-xs text-yellow-800">
                <p className="font-bold mb-1">💡 Información Financiera:</p>
                <p>Costo Total del Stock: <strong>${totalCostValue.toLocaleString()}</strong></p>
            </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE MOVIMIENTOS */}
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📜 Historial (Auditoría)
            </h2>
            
            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-500 font-bold text-xs uppercase">
                        <tr>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Variante</th>
                            <th className="p-3">Acción</th>
                            <th className="p-3 text-right">Cant.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                    No hay movimientos registrados aún.
                                </td>
                            </tr>
                        ) : (
                            history.map(mov => {
                                const isPositive = mov.quantity > 0
                                const typeLabel = translateMovementType(mov.type)

                                return (
                                    <tr key={mov.id} className="hover:bg-gray-50 group">
                                        <td className="p-3">
                                            <p className="font-bold text-gray-700">
                                                {mov.createdAt.toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {mov.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                        </td>
                                        <td className="p-3 text-gray-600">
                                            {mov.variant.name === 'Estándar' ? '-' : mov.variant.name}
                                        </td>
                                        <td className="p-3">
                                            <p className="font-medium text-gray-800">{typeLabel}</p>
                                            {mov.reason && (
                                                <p className="text-xs text-gray-500 italic mt-0.5">
                                                    "{mov.reason}"
                                                </p>
                                            )}
                                        </td>
                                        <td className={`p-3 text-right font-bold text-base ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
  )
}