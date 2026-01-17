// src/components/CustomerSaleRow.tsx
'use client'

import { useState } from "react"
import { markSaleAsPaid } from "@/actions/customer-actions"
import { cn } from "@/lib/utils"

type SaleType = {
    id: string
    createdAt: Date
    total: any // Decimal
    paymentStatus: string // 'PAID' | 'PENDING'
    items: { description: string, quantity: number }[]
}

export default function CustomerSaleRow({ sale }: { sale: SaleType }) {
    const [loading, setLoading] = useState(false)
    const isPending = sale.paymentStatus === 'PENDING'

    const handlePay = async () => {
        if (!confirm("¿Confirmás que el cliente pagó esta deuda?")) return
        setLoading(true)
        await markSaleAsPaid(sale.id)
        setLoading(false)
    }

    return (
        <tr className={cn("transition", isPending ? "bg-red-500/5" : "hover:bg-muted/30")}>
            <td className="p-4 pl-6">
                <p className="font-bold text-foreground">{sale.createdAt.toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground font-mono">
                    {sale.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </td>
            
            <td className="p-4">
                <div className="text-xs text-foreground/80 max-w-[200px] truncate">
                    {sale.items.map(i => `${i.quantity} ${i.description}`).join(", ")}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">ID: {sale.id.slice(0,6)}</p>
            </td>

            <td className="p-4 text-right font-mono font-bold text-base">
                ${Number(sale.total).toLocaleString()}
            </td>

            <td className="p-4 text-center">
                <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase border",
                    isPending 
                        ? "bg-destructive/10 text-destructive border-destructive/20" 
                        : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                )}>
                    {isPending ? "PENDIENTE" : "PAGADO"}
                </span>
            </td>

            <td className="p-4 pr-6 text-right">
                {isPending && (
                    <button 
                        onClick={handlePay}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "..." : "💸 COBRAR"}
                    </button>
                )}
            </td>
        </tr>
    )
}