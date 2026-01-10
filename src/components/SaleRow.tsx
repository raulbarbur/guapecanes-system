// src/components/SaleRow.tsx
'use client'

import { useState } from "react"
import CancelSaleButton from "./CancelSaleButton"
import ReceiptModal from "./ReceiptModal" // 👈 Importamos

type SaleItem = {
  description: string
  quantity: number
  priceAtSale: number 
}

type SaleData = {
  id: string
  total: number
  paymentMethod: string
  status: string
  createdAt: Date
  items: SaleItem[]
}

export default function SaleRow({ sale }: { sale: SaleData }) {
  const [isOpen, setIsOpen] = useState(false)

  const dateStr = sale.createdAt.toLocaleDateString()
  const timeStr = sale.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isCancelled = sale.status === 'CANCELLED'

  return (
    <>
      <tr 
        onClick={() => setIsOpen(!isOpen)}
        className={`cursor-pointer transition-colors border-b ${isCancelled ? 'bg-red-50 text-gray-500' : 'hover:bg-blue-50 bg-white'}`}
      >
        <td className="p-4 whitespace-nowrap">
            <div className="flex flex-col">
                <span className="font-bold text-gray-800">{dateStr}</span>
                <span className="text-xs text-gray-500">{timeStr}</span>
            </div>
        </td>
        
        <td className="p-4">
            <span className={`text-xs font-bold px-2 py-1 rounded border
                ${sale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}
            `}>
                {sale.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TRANSFER.'}
            </span>
        </td>

        <td className="p-4">
            <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-lg ${isCancelled ? 'line-through opacity-50' : 'text-gray-900'}`}>
                    ${sale.total.toLocaleString()}
                </span>
                {isCancelled && <span className="text-xs text-red-600 font-bold bg-red-100 px-1 rounded">ANULADA</span>}
            </div>
        </td>

        <td className="p-4 text-center">
            <span className={`inline-block transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </td>
      </tr>

      {isOpen && (
        <tr className="bg-gray-50 border-b">
            <td colSpan={4} className="p-4 shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalle de la venta:</p>
                        <ul className="text-sm space-y-1">
                            {sale.items.map((item, idx) => (
                                <li key={idx} className="flex gap-2">
                                    <span className="font-bold text-gray-700">{item.quantity} x</span>
                                    <span>{item.description}</span>
                                    <span className="text-gray-400">(${Number(item.priceAtSale).toLocaleString()} c/u)</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-gray-400 mt-2 font-mono">ID: {sale.id}</p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        
                        {/* 👇 AQUÍ AGREGAMOS EL BOTÓN DE TICKET */}
                        <ReceiptModal sale={sale} />

                        {!isCancelled && (
                            <>
                                <CancelSaleButton saleId={sale.id} />
                                <p className="text-[10px] text-red-500 max-w-[150px] leading-tight text-right">
                                    ⚠️ Anular restaura stock y ajusta deuda.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </td>
        </tr>
      )}
    </>
  )
}