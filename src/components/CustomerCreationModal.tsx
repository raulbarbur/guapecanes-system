'use client'

import { useState } from 'react'
import { createCustomer } from "@/actions/customer-actions"
import { useToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"

interface CustomerCreationModalProps {
    isOpen: boolean
    onClose: () => void
    onCustomerCreated: (newCustomerId: string) => void
}

// ⚠️ NOTA: Usamos 'export function' (Named Export)
export function CustomerCreationModal({ isOpen, onClose, onCustomerCreated }: CustomerCreationModalProps) {
    const [creatingCustomer, setCreatingCustomer] = useState(false)
    const { addToast } = useToast()

    const handleQuickCustomerCreate = async (formData: FormData) => {
        setCreatingCustomer(true)
        const result = await createCustomer(formData) 
        setCreatingCustomer(false)
    
        if (result?.success && result.customer) {
            addToast("✅ Cliente creado y seleccionado.", "success")
            onCustomerCreated(result.customer.id)
            onClose()
        } else {
            addToast(result?.error || "Error al crear cliente", "error")
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-border animate-in zoom-in-95">
                <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-black text-lg text-foreground font-nunito">👤 Nuevo Cliente</h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted-foreground hover:bg-input transition"
                    >
                        ✕
                    </button>
                </div>
                
                <form action={handleQuickCustomerCreate} className="p-6 flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Nombre Completo *</label>
                        <input 
                            name="name" 
                            type="text" 
                            required 
                            autoFocus
                            placeholder="Ej: Juan Perez"
                            className="w-full bg-background border border-input p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Teléfono</label>
                        <input 
                            name="phone" 
                            type="text" 
                            placeholder="Opcional"
                            className="w-full bg-background border border-input p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={creatingCustomer}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold text-primary-foreground transition mt-2",
                            creatingCustomer ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90'
                        )}
                    >
                        {creatingCustomer ? "Guardando..." : "Crear Cliente"}
                    </button>
                </form>
             </div>
        </div>
    )
}