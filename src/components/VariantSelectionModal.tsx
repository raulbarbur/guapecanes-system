'use client'

import { usePosContext } from '@/context/PosContext'
import { cn } from '@/lib/utils'

// ⚠️ NOTA: Usamos 'export function' (Named Export)
export function VariantSelectionModal() {
  const { selectedProductForModal, setSelectedProductForModal, addVariantToCart } = usePosContext()

  if (!selectedProductForModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
                <div>
                    <h3 className="font-black text-lg text-foreground font-nunito">{selectedProductForModal.name}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Seleccioná variante</p>
                </div>
                <button 
                    onClick={() => setSelectedProductForModal(null)} 
                    className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted-foreground hover:bg-input transition"
                >
                    ✕
                </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3">
                {selectedProductForModal.variants.map(variant => {
                    const hasStock = variant.stock > 0
                    return (
                        <button
                            key={variant.id}
                            disabled={!hasStock}
                            onClick={() => {
                                addVariantToCart(selectedProductForModal.name, variant)
                                setSelectedProductForModal(null)
                            }}
                            className={cn(
                                "p-4 border rounded-2xl text-left transition flex flex-col justify-between h-24 relative overflow-hidden",
                                hasStock 
                                    ? 'bg-background border-border hover:border-primary hover:ring-1 hover:ring-primary/50' 
                                    : 'bg-muted border-transparent opacity-50 cursor-not-allowed'
                            )}
                        >
                            <div className="z-10 relative">
                                <span className="font-bold text-foreground block text-sm mb-1">{variant.name}</span>
                                {hasStock ? (
                                    <span className="text-primary font-black text-lg">${variant.price}</span>
                                ) : (
                                    <span className="text-xs font-bold text-destructive uppercase bg-destructive/10 px-2 py-0.5 rounded">Agotado</span>
                                )}
                            </div>

                            {hasStock && (
                                <div className="absolute bottom-2 right-2 text-[10px] font-bold bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                                    {variant.stock} u.
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    </div>
  )
}