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
            // Transformación Mobile: Block Display para que ocupe todo el ancho
            "flex flex-col md:table-row w-full",
            isCancelled 
                ? "bg-destructive/5 text-muted-foreground hover:bg-destructive/10" 
                : "bg-card hover:bg-muted/30"
        )}
      >
        {/* Celda Fecha */}
        <td className="p-4 md:pl-6 flex justify-between md:table-cell items-center w-full md:w-auto">
            <div className="flex flex-col">
                <span className={cn("font-bold text-sm", isCancelled ? "text-muted-foreground" : "text-foreground")}>
                    {dateStr}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{timeStr}</span>
            </div>
            {/* Mobile: Mostrar Total aquí para verlo rápido */}
            <div className="md:hidden font-mono font-black text-lg">
                ${sale.total.toLocaleString()}
            </div>
        </td>
        
        {/* Celda Método */}
        <td className="px-4 pb-2 md:py-4 md:table-cell w-full md:w-auto">
            <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider inline-block",
                sale.paymentMethod === 'CASH' 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                    : sale.paymentMethod === 'TRANSFER'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
            )}>
                {sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Cta. Corriente'}
            </span>
            {isCancelled && (
                <span className="ml-2 text-[10px] text-destructive font-black bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20 uppercase">
                    Anulada
                </span>
            )}
        </td>

        {/* Celda Total (Oculta en mobile porque ya se mostró arriba) */}
        <td className="hidden md:table-cell p-4">
             <span className={cn(
                "font-mono font-bold text-lg",
                isCancelled ? 'line-through decoration-destructive opacity-50' : 'text-foreground'
            )}>
                ${sale.total.toLocaleString()}
            </span>
        </td>

        {/* Flecha */}
        <td className="hidden md:table-cell p-4 text-center">
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
        <tr className="bg-muted/30 border-b border-border shadow-inner flex flex-col md:table-row w-full">
            <td colSpan={4} className="p-0 block md:table-cell w-full">
                <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start gap-6 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Lista de Items */}
                    <div className="flex-1 space-y-3 w-full">
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
                                        <span className="text-foreground/80 line-clamp-1">{item.description}</span>
                                    </div>
                                    <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
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
                    <div className="flex flex-row md:flex-col gap-3 items-center md:items-end w-full md:w-auto justify-end border-t md:border-0 border-border pt-4 md:pt-0">
                        
                        <ReceiptModal sale={sale} />

                        {!isCancelled && (
                            <div className="flex flex-col items-end gap-1">
                                <CancelSaleButton saleId={sale.id} />
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