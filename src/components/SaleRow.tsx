// src/components/SaleRow.tsx
'use client'

import { useState } from "react"
import CancelSaleButton from "./CancelSaleButton"
import ReceiptModal from "./ReceiptModal"
import { cn } from "@/lib/utils"

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
        className={cn(
            "cursor-pointer transition-colors duration-200 border-b border-border last:border-0",
            isCancelled 
                ? "bg-destructive/5 text-muted-foreground hover:bg-destructive/10" 
                : "bg-card hover:bg-muted/50"
        )}
      >
        <td className="p-4 pl-6 whitespace-nowrap">
            <div className="flex flex-col">
                <span className={cn("font-bold text-sm", isCancelled ? "text-muted-foreground" : "text-foreground")}>
                    {dateStr}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{timeStr}</span>
            </div>
        </td>
        
        <td className="p-4">
            <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider",
                sale.paymentMethod === 'CASH' 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            )}>
                {sale.paymentMethod === 'CASH' ? 'Efectivo' : 'Transfer.'}
            </span>
        </td>

        <td className="p-4">
            <div className="flex items-center gap-2">
                <span className={cn(
                    "font-mono font-bold text-lg",
                    isCancelled ? 'line-through decoration-destructive opacity-50' : 'text-foreground'
                )}>
                    ${sale.total.toLocaleString()}
                </span>
                {isCancelled && (
                    <span className="text-[10px] text-destructive font-black bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                        ANULADA
                    </span>
                )}
            </div>
        </td>

        <td className="p-4 text-center">
            <span className={cn(
                "inline-block transition-transform duration-300 text-muted-foreground",
                isOpen ? 'rotate-180 text-primary' : ''
            )}>
                ▼
            </span>
        </td>
      </tr>

      {/* DETALLE EXPANDIBLE */}
      {isOpen && (
        <tr className="bg-muted/30 border-b border-border shadow-inner">
            <td colSpan={4} className="p-0">
                <div className="p-6 flex flex-col md:flex-row justify-between items-start gap-8 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Lista de Items */}
                    <div className="flex-1 space-y-3">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
                            Detalle de la venta
                        </p>
                        <ul className="text-sm space-y-2">
                            {sale.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground bg-background px-1.5 rounded border border-border text-xs">
                                            {item.quantity}
                                        </span>
                                        <span className="text-foreground/80">{item.description}</span>
                                    </div>
                                    <span className="text-muted-foreground font-mono text-xs">
                                        ${Number(item.priceAtSale).toLocaleString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-[10px] text-muted-foreground font-mono mt-4 pt-2 border-t border-border">
                            REF ID: {sale.id}
                        </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-3 items-end min-w-[160px]">
                        
                        <ReceiptModal sale={sale} />

                        {!isCancelled && (
                            <div className="flex flex-col items-end gap-1 mt-2">
                                <CancelSaleButton saleId={sale.id} />
                                <p className="text-[9px] text-muted-foreground text-right max-w-[140px] leading-relaxed">
                                    Se restaurará el stock y se ajustará la deuda del dueño.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
      )}
    </>
  )
}