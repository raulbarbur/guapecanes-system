// src/components/PosSystem.tsx
'use client'

import { useState, useEffect, useMemo } from "react"
import { processSale } from "@/actions/sale-actions"
import { useSearchParams, useRouter } from "next/navigation"
import TicketView from "./TicketView"

// --- TIPOS ---
type VariantType = {
  id: string
  name: string
  price: number
  stock: number
}

type ProductGroupType = {
  id: string
  name: string
  categoryName: string
  ownerName: string
  imageUrl: string | null
  totalStock: number
  variants: VariantType[]
}

type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  name: string // "Collar - Rojo"
  price: number
  quantity: number
  stockMax?: number
}

type PaymentMethod = "CASH" | "TRANSFER"

type SaleResult = {
    id: string
    date: Date
    items: { description: string; quantity: number; price: number }[]
    total: number
    method: PaymentMethod
}

export default function PosSystem({ products }: { products: ProductGroupType[] }) {
  // --- ESTADOS ---
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">("ALL")

  // Modal de Variantes
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductGroupType | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  // --- EFECTOS ---
  // Cargar servicio desde URL (Agenda)
  useEffect(() => {
    const apptId = searchParams.get("apptId")
    const petName = searchParams.get("petName")
    
    if (apptId && petName && cart.length === 0) {
      setCart([{
        type: 'SERVICE',
        id: apptId,
        name: `Servicio: ${petName}`,
        price: 0,
        quantity: 1
      }])
    }
  }, [searchParams])

  // --- LÓGICA DE FILTRADO ---
  const categories = useMemo(() => {
    const cats = products.map(p => p.categoryName)
    return ["ALL", ...Array.from(new Set(cats))].sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return products.filter(p => {
        const matchesCategory = selectedCategory === "ALL" || p.categoryName === selectedCategory
        const matchesText = 
            p.name.toLowerCase().includes(term) || 
            p.ownerName.toLowerCase().includes(term) ||
            p.categoryName.toLowerCase().includes(term)
        return matchesCategory && matchesText
    })
  }, [products, searchTerm, selectedCategory]) 

  // --- LÓGICA DE CARRITO ---
  
  // Función interna para agregar una variante específica
  const addVariantToCart = (productName: string, variant: VariantType) => {
    if (variant.stock <= 0) return alert("Sin stock")

    setCart(current => {
        const existing = current.find(item => item.id === variant.id && item.type === 'PRODUCT')
        
        // Nombre amigable: Si es "Estándar", solo el producto. Si no, "Producto - Variante"
        const displayName = variant.name === "Estándar" 
            ? productName 
            : `${productName} - ${variant.name}`

        if (existing) {
            if (existing.quantity >= variant.stock) {
                alert("No hay más stock disponible de esta variante")
                return current
            }
            return current.map(item => item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
        }
        
        return [...current, { 
            type: 'PRODUCT', 
            id: variant.id, 
            name: displayName, 
            price: variant.price, 
            quantity: 1, 
            stockMax: variant.stock 
        }]
    })
  }

  // Manejador del Click en Producto
  const handleProductClick = (product: ProductGroupType) => {
    // 1. Filtramos variantes con stock
    const activeVariants = product.variants.filter(v => v.stock > 0)

    if (activeVariants.length === 0) {
        alert("Producto agotado en todas sus variantes.")
        return
    }

    // 2. Si solo hay UNA opción viable, la agregamos directo (UX Rápida)
    if (activeVariants.length === 1) {
        addVariantToCart(product.name, activeVariants[0])
    } else {
        // 3. Si hay varias, abrimos el modal
        setSelectedProductForModal(product)
    }
  }

  const updateServicePrice = (index: number, newPrice: string) => {
    const val = parseFloat(newPrice)
    setCart(current => current.map((item, i) => i === index ? { ...item, price: isNaN(val) ? 0 : val } : item))
  }

  const removeFromCart = (index: number) => {
    setCart(current => current.filter((_, i) => i !== index))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // --- CHECKOUT ---
  const handleCheckout = async () => {
    if (total === 0 && !confirm("¿Confirmar venta por $0?")) return
    const methodText = paymentMethod === 'CASH' ? 'EFECTIVO' : 'TRANSFERENCIA'
    if (!confirm(`¿Cobrar $${total.toLocaleString()} con ${methodText}?`)) return
    
    setLoading(true)
    
    const payload = cart.map(item => ({ 
        type: item.type, 
        id: item.id, 
        description: item.name, 
        price: item.price, 
        quantity: item.quantity 
    }))
    
    const result = await processSale(payload, total, paymentMethod)
    
    setLoading(false)

    if (result.success && result.saleId && result.date) {
      setLastSale({
        id: result.saleId,
        date: result.date,
        items: cart.map(i => ({ description: i.name, quantity: i.quantity, price: i.price })),
        total: total,
        method: paymentMethod
      })
      setCart([]) 
      if (searchParams.get("apptId")) router.replace("/pos") 
    } else {
      alert("Error: " + result.error)
    }
  }

  if (lastSale) {
    return (
        <TicketView 
            mode="POS"
            saleId={lastSale.id}
            date={lastSale.date}
            items={lastSale.items}
            total={lastSale.total}
            paymentMethod={lastSale.method}
            onClose={() => setLastSale(null)}
        />
    )
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20 h-full">
      
      {/* === COLUMNA IZQUIERDA (CATÁLOGO) === */}
      <div className="md:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
        
        {/* BUSCADOR */}
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="🔍 Buscar producto, dueño..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    autoFocus
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">✕</button>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? "ALL" : cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition
                            ${selectedCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}
                        `}
                    >
                        {cat === "ALL" ? "Todo" : cat}
                    </button>
                ))}
            </div>
        </div>

        {/* GRILLA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto pr-2">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <span className="text-4xl mb-2">🔍</span>
                    <p>No encontré nada con "{searchTerm}"</p>
                    <button onClick={() => {setSearchTerm(""); setSelectedCategory("ALL")}} className="text-blue-500 underline text-sm mt-2">Limpiar filtros</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredProducts.map(p => {
                        // Stock total visual
                        const stockColor = p.totalStock === 0 ? 'bg-red-500' : p.totalStock <= 3 ? 'bg-orange-500' : 'bg-green-600'
                        const isOOS = p.totalStock === 0

                        return (
                        <button 
                            key={p.id}
                            onClick={() => handleProductClick(p)}
                            disabled={isOOS}
                            className={`p-3 border rounded-lg text-left transition shadow-sm flex flex-col gap-2 relative group
                                ${isOOS ? 'bg-gray-100 opacity-60 grayscale cursor-not-allowed' : 'bg-white hover:border-blue-500 hover:shadow-md'}
                            `}
                        >
                            <div className="w-full h-24 bg-gray-100 rounded overflow-hidden relative">
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin Foto</div>
                                )}
                                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow ${stockColor}`}>
                                    {p.totalStock} u.
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{p.name}</h3>
                                <p className="text-[10px] text-gray-500 truncate">{p.ownerName}</p>
                            </div>
                            
                            <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                                {/* Mostramos rango de precios o precio único */}
                                {p.variants.length > 1 ? (
                                    <span className="text-blue-700 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded">Ver opciones</span>
                                ) : (
                                    <span className="text-blue-700 font-bold text-lg">${p.variants[0]?.price || 0}</span>
                                )}
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded truncate max-w-[80px]">{p.categoryName}</span>
                            </div>
                        </button>
                    )})}
                </div>
            )}
        </div>
      </div>

      {/* === COLUMNA DERECHA (TICKET) === */}
      <div className="md:col-span-1 h-full">
        <div className="bg-white border rounded-lg shadow-lg flex flex-col h-[calc(100vh-2rem)] sticky top-4">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800">Ticket</h2>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded font-mono">{cart.length} items</span>
          </div>
          
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {cart.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <p className="text-4xl mb-2">🛒</p>
                <p className="text-sm">Escaneá o seleccioná<br/>productos.</p>
              </div>
            )}
            
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start border-b pb-3 animate-in fade-in slide-in-from-right-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">
                    {item.type === 'SERVICE' && <span className="mr-1">✂️</span>}
                    {item.name}
                  </p>
                  
                  {item.type === 'SERVICE' ? (
                     <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">$</span>
                        <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateServicePrice(index, e.target.value)}
                            className="w-20 border rounded px-1 py-0.5 text-sm font-bold bg-gray-50"
                        />
                     </div>
                  ) : (
                     <p className="text-xs text-gray-500 mt-1">{item.quantity} x ${item.price}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-gray-800">${(item.quantity * item.price).toLocaleString()}</span>
                    <button onClick={() => removeFromCart(index)} className="text-xs text-red-500 hover:bg-red-50 px-2 rounded">x</button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t">
             <div className="grid grid-cols-2 gap-2 mb-4">
                <button 
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-2 rounded text-xs font-bold border transition flex items-center justify-center gap-1 ${paymentMethod === "CASH" ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300 text-gray-500"}`}
                >
                    💵 EFECTIVO
                </button>
                <button 
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={`p-2 rounded text-xs font-bold border transition flex items-center justify-center gap-1 ${paymentMethod === "TRANSFER" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 text-gray-500"}`}
                >
                    🏦 TRANSFER.
                </button>
             </div>

             <div className="flex justify-between text-2xl font-bold mb-4">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
             </div>
             
             <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className={`w-full py-3 rounded font-bold text-lg transition active:scale-95 text-white shadow-lg ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}`}
            >
              {loading ? "..." : "COBRAR"}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* === MODAL DE SELECCIÓN DE VARIANTE === */}
    {selectedProductForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{selectedProductForModal.name}</h3>
                    <button onClick={() => setSelectedProductForModal(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                </div>
                
                <div className="p-4 max-h-[60vh] overflow-y-auto grid grid-cols-2 gap-3">
                    {selectedProductForModal.variants.map(variant => {
                        const hasStock = variant.stock > 0
                        return (
                            <button
                                key={variant.id}
                                disabled={!hasStock}
                                onClick={() => {
                                    addVariantToCart(selectedProductForModal.name, variant)
                                    setSelectedProductForModal(null) // Cerrar al elegir
                                }}
                                className={`p-3 border rounded-lg text-left transition flex flex-col justify-between
                                    ${hasStock 
                                        ? 'hover:border-blue-500 hover:bg-blue-50 border-gray-200' 
                                        : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'}
                                `}
                            >
                                <div>
                                    <span className="font-bold text-gray-800 block">{variant.name}</span>
                                    <span className="text-xs text-gray-500">{hasStock ? 'Disponible' : 'Agotado'}</span>
                                </div>
                                <div className="mt-2 flex justify-between items-end">
                                    <span className="text-blue-700 font-bold">${variant.price}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                        {variant.stock} u.
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
                
                <div className="p-3 bg-gray-50 border-t text-center">
                    <button onClick={() => setSelectedProductForModal(null)} className="text-gray-500 text-sm font-bold hover:text-gray-800">Cancelar</button>
                </div>
            </div>
        </div>
    )}
    </>
  )
}