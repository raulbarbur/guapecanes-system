// src/app/owners/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function OwnerProfilePage({ params }: Props) {
  const { id } = await params

  // 1. Buscamos TODOS los datos del dueño
  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      // A. Sus productos y stock actual
      products: {
        where: { isActive: true },
        include: { variants: true }
      },
      // B. Historial de Pagos (Liquidaciones pasadas)
      settlements: {
        orderBy: { createdAt: 'desc' },
        take: 20 // Últimos 20 pagos
      },
      // C. Deuda Pendiente (Cálculo en vivo)
      balanceAdjustments: { where: { isApplied: false } }
    }
  })

  if (!owner) return notFound()

  // 2. CÁLCULOS EN MEMORIA
  
  // A. Inventario en consignación (Stock > 0)
  const activeInventory = owner.products.flatMap(p => 
    p.variants.filter(v => v.stock > 0).map(v => ({
      name: p.name, // Variante podría tener nombre propio si quisieras
      price: v.salePrice,
      cost: v.costPrice,
      stock: v.stock,
      image: v.imageUrl
    }))
  )

  // B. Calcular Deuda Pendiente (Similar a la página de Balance)
  // Necesitamos buscar los items vendidos NO pagados. 
  // Nota: Hacemos esta query aparte para no traer TODAS las ventas históricas en el include principal.
  const pendingItems = await prisma.saleItem.findMany({
    where: {
      isSettled: false,
      variant: { product: { ownerId: id } }
    }
  })

  const debtFromSales = pendingItems.reduce((sum, item) => sum + (Number(item.costAtSale) * item.quantity), 0)
  const debtFromAdj = owner.balanceAdjustments.reduce((sum, adj) => sum + Number(adj.amount), 0)
  const totalDebt = debtFromSales + debtFromAdj

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* HEADER / TARJETA DE PERFIL */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
            <Link href="/owners" className="text-sm text-blue-600 hover:underline mb-2 block">← Volver al listado</Link>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                {owner.name}
                {!owner.isActive && <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded">INACTIVO</span>}
            </h1>
            <div className="mt-2 text-gray-600 space-y-1">
                <p>📧 {owner.email || "Sin email"}</p>
                <p>📞 {owner.phone || "Sin teléfono"}</p>
            </div>
            <div className="mt-4">
                <Link 
                    href={`/owners/${owner.id}/edit`}
                    className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded border hover:bg-gray-200"
                >
                    ✏️ EDITAR DATOS
                </Link>
            </div>
        </div>

        {/* CAJA DE ESTADO DE CUENTA */}
        <div className={`p-6 rounded-lg shadow-lg border text-white min-w-[300px]
            ${totalDebt > 0 ? 'bg-slate-800' : 'bg-green-600'}
        `}>
            <p className="text-xs font-bold uppercase opacity-80 mb-1">Saldo Pendiente</p>
            <p className="text-4xl font-bold mb-4">${totalDebt.toLocaleString()}</p>
            
            {totalDebt !== 0 ? (
                <Link 
                    href={`/owners/settlement/${owner.id}`}
                    className="block text-center bg-white text-gray-900 font-bold py-2 rounded shadow hover:bg-gray-100 transition"
                >
                    {totalDebt > 0 ? "💸 LIQUIDAR (PAGAR)" : "⚖️ AJUSTAR SALDO"}
                </Link>
            ) : (
                <div className="flex items-center gap-2 text-sm font-bold bg-white/20 p-2 rounded">
                    <span>✅</span> Todo al día
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: INVENTARIO ACTUAL */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">📦 En Stock ({activeInventory.length})</h2>
                <span className="text-xs text-gray-500">Mercadería en el local</span>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y">
                {activeInventory.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Este dueño no tiene productos activos.</div>
                ) : (
                    activeInventory.map((item, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                                {item.image ? (
                                    <img src={item.image} className="w-10 h-10 rounded object-cover border" />
                                ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-[8px]">FOTO</div>
                                )}
                                <div>
                                    <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">Stock: {item.stock} u.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-800 text-sm">${item.price}</p>
                                <p className="text-[10px] text-green-600">Costo: ${item.cost}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE PAGOS */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <h2 className="font-bold text-lg text-gray-800">📜 Historial de Pagos</h2>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto divide-y">
                {owner.settlements.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">Nunca se le ha pagado.</div>
                ) : (
                    owner.settlements.map(settlement => (
                        <div key={settlement.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <p className="font-bold text-gray-800">
                                    {settlement.createdAt.toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">
                                    ID: {settlement.id.slice(0, 8)}...
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-lg font-bold text-green-700">
                                    ${Number(settlement.totalAmount).toLocaleString()}
                                </span>
                                {/* Futuro: Link al detalle del recibo */}
                                {/* <Link href={`/settlements/${settlement.id}`} className="...">📄</Link> */}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  )
}