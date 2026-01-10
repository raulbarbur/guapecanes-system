// src/components/PosSystem.tsx
'use client'

import { useState, useEffect, useMemo } from "react"
import { processSale } from "@/actions/sale-actions"
import { useSearchParams, useRouter } from "next/navigation"
import TicketView from "./TicketView"

type ProductType = {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string | null
  ownerName: string
  categoryName: string 
}

type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  name: string
  price: number
  quantity: number
  stockMax?: number
}

type PaymentMethod = "CASH" | "TRANSFER"

// Estructura que espera el TicketView
type SaleResult = {
    id: string
    date: Date
    items: { description: string; quantity: number; price: number }[] // 👈 Ajustado
    total: number
    method: PaymentMethod
}

export default function PosSystem({ products }: { products: ProductType[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">("ALL")
  
  const searchParams = useSearchParams()
  const router = useRouter()

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

  const addProductToCart = (product: ProductType) => {
    if (product.stock <= 0) return alert("Sin stock")

    setCart(current => {
      const existing = current.find(item => item.id === product.id && item.type === 'PRODUCT')
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("No hay más stock disponible")
          return current
        }
        return current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { type: 'PRODUCT', id: product.id, name: product.name, price: product.price, quantity: 1, stockMax: product.stock }]
    })
  }

  const updateServicePrice = (index: number, newPrice: string) => {
    const val = parseFloat(newPrice)
    setCart(current => current.map((item, i) => i === index ? { ...item, price: isNaN(val) ? 0 : val } : item))
  }

  const removeFromCart = (index: number) => {
    setCart(current => current.filter((_, i) => i !== index))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleCheckout = async () => {
    if (total === 0 && !confirm("¿Confirmar venta por $0?")) return
    const methodText = paymentMethod === 'CASH' ? 'EFECTIVO' : 'TRANSFERENCIA'
    if (!confirm(`¿Cobrar $${total.toLocaleString()} con ${methodText}?`)) return
    
    setLoading(true)
    
    // Payload para el servidor (Aquí sí usábamos description, eso estaba bien)
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
      
      // ✅ CORRECCIÓN AQUÍ:
      // Mapeamos el carrito para que tenga la propiedad 'description' en lugar de 'name'
      // para que coincida con lo que espera el TicketView.
      const ticketItems = cart.map(item => ({
        description: item.name, // 👈 EL CAMBIO CLAVE
        quantity: item.quantity,
        price: item.price
      }))

      setLastSale({
        id: result.saleId,
        date: result.date,
        items: ticketItems, // Usamos la lista mapeada
        total: total,
        method: paymentMethod
      })
      
      setCart([]) 
      
      if (searchParams.get("apptId")) {
         router.replace("/pos") 
      }
    } else {
      alert("Error: " + result.error)
    }
  }

  if (lastSale) {
    return (
        <TicketView 
            mode="POS" // 👈 Explicito
            saleId={lastSale.id}
            date={lastSale.date}
            items={lastSale.items}
            total={lastSale.total}
            paymentMethod={lastSale.method}
            onClose={() => setLastSale(null)} // 👈 Cambiado de onNewSale a onClose
        />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20 h-full">
      
      {/* === COLUMNA IZQUIERDA === */}
      <div className="md:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
        
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
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? "ALL" : cat)}
                        className={`
                            px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition
                            ${selectedCategory === cat 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                            }
                        `}
                    >
                        {cat === "ALL" ? "Todo" : cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <span className="text-4xl mb-2">🔍</span>
                    <p>No encontré nada con "{searchTerm}"</p>
                    <button onClick={() => {setSearchTerm(""); setSelectedCategory("ALL")}} className="text-blue-500 underline text-sm mt-2">Limpiar filtros</button>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredProducts.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => addProductToCart(p)}
                            disabled={p.stock === 0}
                            className={`p-3 border rounded-lg text-left transition shadow-sm flex flex-col gap-2 relative group
                                ${p.stock === 0 ? 'bg-gray-100 opacity-60 grayscale cursor-not-allowed' : 'bg-white hover:border-blue-500 hover:shadow-md'}
                            `}
                        >
                            <div className="w-full h-24 bg-gray-100 rounded overflow-hidden relative">
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin Foto</div>
                                )}
                                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow
                                    ${p.stock === 0 ? 'bg-red-500' : p.stock <= 3 ? 'bg-orange-500' : 'bg-green-600'}
                                `}>
                                    {p.stock} u.
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{p.name}</h3>
                                <p className="text-[10px] text-gray-500 truncate">{p.ownerName}</p>
                            </div>
                            
                            <div className="mt-auto pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                                <span className="text-blue-700 font-bold text-lg">${p.price}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded">{p.categoryName}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* === COLUMNA DERECHA === */}
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
                    className={`p-2 rounded text-xs font-bold border transition flex items-center justify-center gap-1
                        ${paymentMethod === "CASH" ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300 text-gray-500"}
                    `}
                >
                    💵 EFECTIVO
                </button>
                <button 
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={`p-2 rounded text-xs font-bold border transition flex items-center justify-center gap-1
                        ${paymentMethod === "TRANSFER" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 text-gray-500"}
                    `}
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
              className={`w-full py-3 rounded font-bold text-lg transition active:scale-95 text-white shadow-lg
                ${cart.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}
              `}
            >
              {loading ? "..." : "COBRAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}