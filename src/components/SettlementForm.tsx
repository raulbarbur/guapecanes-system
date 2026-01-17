// src/components/SettlementForm.tsx
'use client'

import { useState, useMemo } from "react"
import { createSettlement } from "@/actions/settlement-actions"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Tipos de datos que recibimos desde la Page (Server Component)
type PendingItem = {
    id: string
    type: 'SALE' | 'ADJUSTMENT'
    date: Date
    description: string
    pendingQuantity: number // Lo que falta pagar
    cost: number // Costo unitario histórico
    isAdjustment: boolean
}

interface Props {
    ownerId: string
    items: PendingItem[]
}

export default function SettlementForm({ ownerId, items }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    
    // Estado: Mapa de selecciones
    // Key: ID del item
    // Value: { selected: boolean, quantityToPay: number }
    const [selections, setSelections] = useState<Record<string, { selected: boolean, quantity: number }>>(() => {
        // Inicializamos todo seleccionado al máximo (Comportamiento "Liquidar Todo")
        const initial: any = {}
        items.forEach(i => {
            initial[i.id] = { selected: true, quantity: i.pendingQuantity }
        })
        return initial
    })

    // Computed: Total a Pagar en tiempo real
    const totalToPay = useMemo(() => {
        let sum = 0
        items.forEach(item => {
            const sel = selections[item.id]
            if (sel && sel.selected) {
                sum += (sel.quantity * item.cost)
            }
        })
        return sum
    }, [items, selections])

    const handleQuantityChange = (id: string, valStr: string, max: number) => {
        let val = parseInt(valStr)
        if (isNaN(val) || val < 1) val = 1
        if (val > max) val = max
        
        setSelections(prev => ({
            ...prev,
            [id]: { ...prev[id], quantity: val, selected: true } // Si toca cantidad, se auto-selecciona
        }))
    }

    const toggleSelection = (id: string) => {
        setSelections(prev => ({
            ...prev,
            [id]: { ...prev[id], selected: !prev[id].selected }
        }))
    }

    const toggleAll = () => {
        const allSelected = items.every(i => selections[i.id]?.selected)
        const newState: any = {}
        items.forEach(i => {
            newState[i.id] = { 
                selected: !allSelected, 
                quantity: selections[i.id]?.quantity || i.pendingQuantity 
            }
        })
        setSelections(newState)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (totalToPay <= 0) {
            alert("El total debe ser mayor a cero.")
            return
        }

        if (!confirm(`¿Confirmás el pago por $${totalToPay.toLocaleString()}?`)) return

        setLoading(true)

        // Construir el payload JSON
        const payload = items
            .filter(i => selections[i.id]?.selected)
            .map(i => ({
                id: i.id,
                type: i.type,
                quantity: i.isAdjustment ? undefined : selections[i.id].quantity
            }))

        // Usamos FormData para enviar a la Server Action
        const formData = new FormData()
        formData.append("ownerId", ownerId)
        formData.append("selection", JSON.stringify(payload))

        const res = await createSettlement(formData)

        if (res?.error) {
            alert("❌ Error: " + res.error)
            setLoading(false)
        } else {
            // Éxito: El server action ya hizo revalidate, pero forzamos redirect o refresh
            router.push("/owners/balance") 
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="animate-in fade-in space-y-6">
            
            {/* CAJA DE RESUMEN Y ACCIÓN */}
            <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-10 backdrop-blur-md bg-opacity-95">
                <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2">Total a Pagar</p>
                    <p className={cn(
                        "text-5xl font-black font-nunito transition-all",
                        totalToPay > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                        ${totalToPay.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                        {items.filter(i => selections[i.id]?.selected).length} items seleccionados
                    </p>
                </div>
                
                <button
                    type="submit"
                    disabled={loading || totalToPay <= 0}
                    className={cn(
                        "px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition active:scale-95 text-white w-full md:w-auto",
                        loading || totalToPay <= 0
                        ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none' 
                        : 'bg-green-600 hover:bg-green-700 hover:shadow-green-900/20'
                    )}
                >
                    {loading ? "Procesando..." : "✅ Confirmar Pago"}
                </button>
            </div>

            {/* TABLA DE DETALLE INTERACTIVA */}
            <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        onChange={toggleAll}
                                        checked={items.every(i => selections[i.id]?.selected)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                </th>
                                <th className="p-4">Fecha / Producto</th>
                                <th className="p-4 text-center">Pendiente</th>
                                <th className="p-4 text-center">A Pagar (Cant.)</th>
                                <th className="p-4 text-right pr-6">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map(row => {
                                const isSelected = selections[row.id]?.selected
                                const currentQty = selections[row.id]?.quantity
                                const subtotal = currentQty * row.cost
                                const isAdj = row.isAdjustment

                                return (
                                    <tr key={row.id} className={cn("transition", isSelected ? "bg-primary/5" : "hover:bg-muted/30 opacity-60 hover:opacity-100")}>
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(row.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </td>
                                        
                                        <td className="p-4">
                                            <p className="font-bold text-foreground flex items-center gap-2">
                                                {row.type === 'SALE' ? '🛒' : '↩️'} {row.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{row.date.toLocaleDateString()}</p>
                                        </td>

                                        <td className="p-4 text-center font-mono text-muted-foreground">
                                            {isAdj ? '-' : row.pendingQuantity}
                                        </td>

                                        <td className="p-4 text-center">
                                            {isAdj ? (
                                                <span className="text-xs font-bold text-muted-foreground">-</span>
                                            ) : (
                                                <input 
                                                    type="number"
                                                    min={1}
                                                    max={row.pendingQuantity}
                                                    value={currentQty}
                                                    onChange={(e) => handleQuantityChange(row.id, e.target.value, row.pendingQuantity)}
                                                    disabled={!isSelected}
                                                    className={cn(
                                                        "w-16 text-center p-1 rounded border font-bold outline-none focus:ring-2 focus:ring-primary",
                                                        isSelected ? "bg-background border-input text-foreground" : "bg-transparent border-transparent text-muted-foreground"
                                                    )}
                                                />
                                            )}
                                        </td>
                                        
                                        <td className={cn(
                                            "p-4 pr-6 text-right font-mono font-bold text-base",
                                            row.cost < 0 ? "text-green-600" : "text-foreground"
                                        )}>
                                            ${subtotal.toLocaleString()}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </form>
    )
}