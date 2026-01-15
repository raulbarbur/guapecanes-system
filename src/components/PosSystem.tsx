// src/components/PosSystem.tsx
'use client'

import Image from "next/image"
import TicketView from "./TicketView"
import { usePos, ProductGroupType } from "@/hooks/usePos" // 👈 Importamos el Hook
import { cn } from "@/lib/utils"

export default function PosSystem({ products }: { products: ProductGroupType[] }) {
  // 1. INVOCAMOS EL HOOK (Cerebro separado de la UI)
  const {
    cart, total, loading, paymentMethod, lastSale,
    search, selectedCategory, categories, filteredProducts, selectedProductForModal,
    setPaymentMethod, setSearch, setSelectedCategory, setSelectedProductForModal, clearLastSale,
    handleProductClick, addVariantToCart, removeFromCart, updateServicePrice, checkout
  } = usePos(products)

  // 2. RENDERIZADO CONDICIONAL: TICKET DE ÉXITO
  if (lastSale) {
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

  // 3. UI PRINCIPAL
  return (
    <>
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-[calc(100vh-20px)] gap-6 pb-4 md:pb-0">
      
      {/* === COLUMNA 1: CATÁLOGO === */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Header de Filtros */}
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

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                    {filteredProducts.map(p => {
                        const isOOS = p.totalStock === 0
                        // Badges con opacidad para dark mode
                        const stockColor = isOOS 
                            ? 'bg-zinc-500' 
                            : p.totalStock <= 3 ? 'bg-orange-500' : 'bg-green-500'

                        return (
                        <button 
                            key={p.id}
                            onClick={() => handleProductClick(p)}
                            disabled={isOOS}
                            className={cn(
                                "group relative flex flex-col p-3 rounded-2xl border transition-all duration-200 text-left overflow-hidden",
                                isOOS 
                                    ? "bg-muted border-border opacity-50 grayscale cursor-not-allowed" 
                                    : "bg-card border-border hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                            )}
                        >
                            {/* IMAGEN */}
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
                            
                            {/* INFO */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                    {p.name}
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                                    {p.ownerName}
                                </p>
                            </div>
                            
                            {/* PRECIO */}
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
                            </div>
                        </button>
                    )})}
                </div>
            )}
        </div>
      </div>

      {/* === COLUMNA 2: TICKET / CARRITO === */}
      <div className="w-full md:w-[380px] shrink-0 h-full flex flex-col">
        <div className="bg-card border border-border rounded-3xl shadow-xl flex flex-col h-full overflow-hidden relative">
          
          {/* Header Ticket */}
          <div className="p-5 border-b border-border bg-muted/30 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-black text-lg text-foreground font-nunito flex items-center gap-2">
                🛍️ Ticket
            </h2>
            <span className="text-xs font-bold bg-background text-muted-foreground border border-border px-2 py-1 rounded-lg">
                {cart.length} items
            </span>
          </div>
          
          {/* Items del Carrito */}
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

          {/* Footer Pago */}
          <div className="p-5 bg-card border-t border-border z-10">
             <div className="grid grid-cols-2 gap-3 mb-5">
                <button 
                    onClick={() => setPaymentMethod("CASH")}
                    className={cn(
                        "p-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2",
                        paymentMethod === "CASH" 
                            ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50" 
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                    )}
                >
                    💵 EFECTIVO
                </button>
                <button 
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={cn(
                        "p-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2",
                        paymentMethod === "TRANSFER" 
                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50" 
                            : "bg-background border-border text-muted-foreground hover:bg-secondary"
                    )}
                >
                    🏦 TRANSFER
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

    {/* ==============================================
        MODAL SELECCIÓN VARIANTE
       ============================================== */}
    {selectedProductForModal && (
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
    )}
    </>
  )
}