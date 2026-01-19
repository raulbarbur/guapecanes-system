'use client'

import { useRef, useState } from "react"
import Image from "next/image"
import { useVirtualizer } from '@tanstack/react-virtual'

import { PosProvider, usePosContext } from "@/context/PosContext"
import { ProductGroupType, CustomerOption } from "@/hooks/usePos"
import { cn } from "@/lib/utils"

// ----------------------------------------------------------------------
// 🔗 IMPORTACIONES BLINDADAS
// ----------------------------------------------------------------------
// Default import (asumiendo que TicketView usa export default)
import TicketView from "./TicketView"

// Named imports (coinciden con los archivos de arriba)
import { VariantSelectionModal } from "./VariantSelectionModal"
import { CustomerCreationModal } from "./CustomerCreationModal"


// ----------------------------------------------------------------------
// UI INTERNA
// ----------------------------------------------------------------------
function PosSystemContent({ customers }: { customers: CustomerOption[] }) {
  const {
    loading, search, selectedCategory, categories, filteredProducts,
    cart, total, paymentMethod, lastSale, selectedCustomerId,
    setPaymentMethod, setSearch, setSelectedCategory, clearLastSale, 
    setSelectedCustomerId, handleProductClick, removeFromCart, updateServicePrice, checkout
  } = usePosContext()

  const showImages = process.env.NEXT_PUBLIC_ENABLE_IMAGES === 'true'
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredProducts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, 
    overscan: 5,
  })

  // VISTA: ÉXITO
  if (lastSale) {
    if (lastSale.method === 'CHECKING_ACCOUNT') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 animate-in zoom-in-95 duration-300">
                <div className="bg-card p-10 rounded-3xl shadow-xl border border-border text-center max-w-md w-full">
                    <span className="text-6xl mb-4 block">📓</span>
                    <h2 className="text-3xl font-black text-foreground mb-2">Cuenta Corriente Actualizada</h2>
                    <p className="text-muted-foreground font-medium mb-6">
                        Se registraron los ítems en la cuenta del cliente correctamente.
                    </p>
                    <button 
                        onClick={clearLastSale}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg transition active:scale-95"
                    >
                        ✨ Nueva Venta
                    </button>
                </div>
            </div>
        )
    }
    return (
        <TicketView 
            mode="POS"
            saleId={lastSale.id}
            date={lastSale.date}
            items={lastSale.items}
            total={lastSale.total}
            paymentMethod={lastSale.method}
            onClose={clearLastSale}
        />
    )
  }

  // VISTA: PRINCIPAL
  return (
    <>
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-20px)] gap-6 pb-4 md:pb-0">
      
      {/* IZQUIERDA: LISTA */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden h-full">
        <div className="bg-card p-4 rounded-3xl shadow-sm border border-border space-y-3 shrink-0">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="🔍 Buscar producto..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full p-3 pl-10 border border-input rounded-2xl bg-background text-foreground focus:ring-2 focus:ring-ring outline-none transition font-medium placeholder:text-muted-foreground"
                    autoFocus
                />
                {search && (
                    <button 
                        onClick={() => setSearch("")} 
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition"
                    >
                        ✕
                    </button>
                )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? "ALL" : cat)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition",
                            selectedCategory === cat 
                                ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                                : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                        )}
                    >
                        {cat === "ALL" ? "Todo" : cat}
                    </button>
                ))}
            </div>
        </div>

        <div ref={parentRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-60">
                    <span className="text-5xl mb-3">🧐</span>
                    <p className="font-medium">Sin resultados para "{search}"</p>
                    <button 
                        onClick={() => {setSearch(""); setSelectedCategory("ALL")}} 
                        className="text-primary underline text-sm mt-2 font-bold"
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            ) : (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const p = filteredProducts[virtualItem.index]
                    if (!p) return null

                    const isOOS = p.totalStock === 0
                    const stockColor = isOOS ? 'bg-zinc-500' : p.totalStock <= 3 ? 'bg-orange-500' : 'bg-green-500'

                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                          padding: '8px 0'
                        }}
                      >
                        <button 
                            onClick={() => handleProductClick(p)}
                            disabled={isOOS}
                            className={cn(
                                "group relative flex flex-col p-3 rounded-2xl border transition-all duration-200 text-left overflow-hidden h-full w-full",
                                isOOS 
                                    ? "bg-muted border-border opacity-50 grayscale cursor-not-allowed" 
                                    : "bg-card border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                            )}
                        >
                          {showImages && (
                              <div className="w-full aspect-square bg-muted rounded-xl overflow-hidden relative mb-3">
                                  {p.imageUrl ? (
                                      <Image 
                                          src={p.imageUrl} 
                                          alt={p.name} 
                                          fill
                                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                                          sizes="(max-width: 768px) 50vw, 20vw"
                                      />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-bold bg-secondary">
                                          Sin Foto
                                      </div>
                                  )}
                                  <div className={cn(
                                      "absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black text-white shadow-sm z-10",
                                      stockColor
                                  )}>
                                      {p.totalStock}
                                  </div>
                              </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                  {p.name}
                              </h3>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                                  {p.ownerName}
                              </p>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-dashed border-border flex justify-between items-center w-full">
                              {p.variants.length > 1 ? (
                                  <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                      Opciones
                                  </span>
                              ) : (
                                  <span className="text-primary font-black text-lg">
                                      ${p.variants[0]?.price || 0}
                                  </span>
                              )}
                              
                              {!showImages && !isOOS && (
                                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded text-white", stockColor)}>
                                      {p.totalStock}u
                                  </span>
                              )}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
            )}
        </div>
      </div>

      {/* DERECHA: TICKET */}
      <div className="w-full md:w-[380px] shrink-0 h-full flex flex-col">
        <div className="bg-card border border-border rounded-3xl shadow-xl flex flex-col h-full overflow-hidden relative">
          
          <div className="p-5 border-b border-border bg-muted/30 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="font-black text-lg text-foreground font-nunito flex items-center gap-2">
                    🛍️ Ticket
                </h2>
                <span className="text-xs font-bold bg-background text-muted-foreground border border-border px-2 py-1 rounded-lg">
                    {cart.length} items
                </span>
            </div>
            
            <div className="flex gap-2">
                <select 
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className={cn(
                        "flex-1 p-2.5 rounded-xl text-sm font-bold border transition outline-none cursor-pointer appearance-none",
                        selectedCustomerId 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background border-input text-muted-foreground"
                    )}
                >
                    <option value="">👤 Cliente Final (Anónimo)</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>👤 {c.name}</option>
                    ))}
                </select>
                
                <button 
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground border border-border transition text-lg font-black"
                    title="Nuevo Cliente"
                >
                    +
                </button>
            </div>
          </div>
          
          <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                <span className="text-6xl mb-4 grayscale">🛒</span>
                <p className="text-sm font-bold text-foreground">Carrito vacío</p>
                <p className="text-xs text-muted-foreground mt-1">Seleccioná productos para cobrar.</p>
              </div>
            )}
            
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start p-3 bg-background rounded-2xl border border-transparent hover:border-border transition animate-in slide-in-from-right-4">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-bold text-foreground text-sm truncate">
                    {item.type === 'SERVICE' && <span className="mr-1">✂️</span>}
                    {item.name}
                  </p>
                  
                  {item.type === 'SERVICE' ? (
                     <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-bold">$</span>
                        <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateServicePrice(index, e.target.value)}
                            className="w-20 border border-input rounded px-1 py-0.5 text-sm font-bold bg-card text-foreground focus:ring-1 focus:ring-ring outline-none"
                        />
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">
                            {item.quantity} un.
                        </span>
                        <span className="text-xs text-muted-foreground">x ${item.price}</span>
                     </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="font-black text-foreground">
                        ${(item.quantity * item.price).toLocaleString()}
                    </span>
                    <button 
                        onClick={() => removeFromCart(index)} 
                        className="text-[10px] font-bold text-destructive hover:text-destructive-foreground hover:bg-destructive px-2 py-1 rounded transition"
                    >
                        ELIMINAR
                    </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-card border-t border-border z-10">
             
             <div className="grid grid-cols-3 gap-2 mb-5">
                <button 
                    onClick={() => setPaymentMethod("CASH")}
                    className={cn(
                        "p-2 rounded-xl text-[10px] font-black border transition flex flex-col items-center justify-center gap-1 h-14",
                        paymentMethod === "CASH" 
                            ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50" 
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                    )}
                >
                    <span>💵</span> EFECTIVO
                </button>
                <button 
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={cn(
                        "p-2 rounded-xl text-[10px] font-black border transition flex flex-col items-center justify-center gap-1 h-14",
                        paymentMethod === "TRANSFER" 
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50" 
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                    )}
                >
                    <span>🏦</span> TRANSFER
                </button>
                <button 
                    onClick={() => setPaymentMethod("CHECKING_ACCOUNT")}
                    className={cn(
                        "p-2 rounded-xl text-[10px] font-black border transition flex flex-col items-center justify-center gap-1 h-14",
                        paymentMethod === "CHECKING_ACCOUNT" 
                            ? "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/50" 
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                    )}
                >
                    <span>📓</span> FIADO
                </button>
             </div>

             <div className="flex justify-between items-end mb-5">
                <span className="text-muted-foreground text-sm font-bold uppercase">Total a Pagar</span>
                <span className="text-4xl font-black text-foreground tracking-tight">
                    ${total.toLocaleString()}
                </span>
             </div>
             
             <button 
              onClick={checkout}
              disabled={cart.length === 0 || loading}
              className={cn(
                  "w-full py-4 rounded-xl font-black text-lg transition active:scale-95 text-primary-foreground shadow-xl flex items-center justify-center gap-2",
                  cart.length === 0 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none' 
                    : 'bg-primary hover:bg-primary/90 hover:shadow-primary/25'
              )}
            >
              {loading ? (
                  <span className="animate-pulse">Procesando...</span>
              ) : (
                  <>
                    <span>COBRAR</span>
                    <span>→</span>
                  </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* MODALES */}
    <VariantSelectionModal />
    
    <CustomerCreationModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={setSelectedCustomerId}
    />
    </>
  )
}

// WRAPPER PRINCIPAL
export default function PosSystem({ products, customers }: { products: ProductGroupType[], customers: CustomerOption[] }) {
  return (
    <PosProvider products={products} customers={customers}>
       <PosSystemContent customers={customers} />
    </PosProvider>
  )
}