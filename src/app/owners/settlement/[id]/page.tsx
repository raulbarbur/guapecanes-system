// src/app/owners/settlement/[id]/page.tsx

import { prisma } from "@/lib/prisma"
import { createSettlement } from "@/actions/settlement-actions"
import Link from "next/link"
import SettlementButton from "@/components/SettlementButton"

interface Props {
  params: Promise<{ id: string }>
}

export default async function SettlementPage({ params }: Props) {
  const { id } = await params
  
  // 1. Buscamos al dueño, sus ventas pendientes Y sus ajustes pendientes
  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      // A. Ventas
      products: {
        include: {
          variants: {
            include: {
              saleItems: {
                where: { isSettled: false },
                include: { sale: true }
              }
            }
          }
        }
      },
      // B. Ajustes
      balanceAdjustments: {
        where: { isApplied: false }
      }
    }
  })

  if (!owner) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-xl text-red-600">Dueño no encontrado</h1>
        <Link href="/owners/balance" className="text-blue-500 underline">Volver</Link>
      </div>
    )
  }

  // 2. Unificar listas (Ventas + Ajustes) para la tabla
  let totalToPay = 0
  const detailRows: any[] = []

  // Procesar Ventas
  owner.products.forEach(p => {
    p.variants.forEach(v => {
      v.saleItems.forEach(item => {
        const subtotal = Number(item.costAtSale) * item.quantity
        totalToPay += subtotal
        
        detailRows.push({
          id: item.id,
          type: 'SALE',
          date: item.sale.createdAt,
          description: `${item.description} (${item.quantity} u.)`,
          amount: subtotal
        })
      })
    })
  })

  // Procesar Ajustes
  owner.balanceAdjustments.forEach(adj => {
    const amount = Number(adj.amount)
    totalToPay += amount
    
    detailRows.push({
      id: adj.id,
      type: 'ADJUSTMENT',
      date: adj.createdAt,
      description: adj.description, // Ej: "Devolución Venta..."
      amount: amount
    })
  })

  // Ordenar cronológicamente
  detailRows.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="p-8 max-w-4xl mx-auto">
      
      {/* CABECERA */}
      <div className="mb-8">
        <Link href="/owners/balance" className="text-blue-600 hover:underline mb-4 block">
          ← Volver al Balance General
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          Liquidación: {owner.name}
        </h1>
        <p className="text-gray-500">Revisá el detalle antes de pagar.</p>
      </div>

      {/* CAJA DE RESUMEN Y ACCIÓN */}
      <div className="bg-gray-50 p-6 rounded-lg border flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 shadow-sm">
        <div>
            <p className="text-sm text-gray-500 uppercase font-bold">Total Neto a Pagar</p>
            <p className={`text-4xl font-bold ${totalToPay >= 0 ? 'text-gray-800' : 'text-green-600'}`}>
                ${totalToPay.toLocaleString()}
            </p>
            {totalToPay < 0 && <span className="text-xs text-green-600 font-bold">Saldo a favor del local</span>}
        </div>
        
        {/* Solo mostramos el botón si hay algo que mover (positivo o negativo) */}
        {detailRows.length > 0 ? (
          <form action={createSettlement}>
            <input type="hidden" name="ownerId" value={owner.id} />
            <SettlementButton />
          </form>
        ) : (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded font-bold">
             DUEÑO AL DÍA
          </div>
        )}
      </div>

      {/* TABLA DE DETALLE */}
      <div className="bg-white rounded shadow overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Concepto</th>
              <th className="p-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {detailRows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-500">
                    {row.date.toLocaleDateString()}
                </td>
                
                <td className="p-3 font-medium text-gray-800">
                    {/* Iconos visuales para distinguir */}
                    {row.type === 'SALE' ? (
                        <span className="text-blue-600 mr-2">🛒</span> 
                    ) : (
                        <span className="text-orange-500 mr-2">↩️</span>
                    )}
                    {row.description}
                </td>
                
                <td className={`p-3 text-right font-bold ${row.amount < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {/* Formato de moneda */}
                    {row.amount < 0 ? '' : ''}${row.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {detailRows.length === 0 && (
            <div className="p-10 text-center text-gray-400">
                Este dueño no tiene movimientos pendientes.
            </div>
        )}
      </div>
    </div>
  )
}