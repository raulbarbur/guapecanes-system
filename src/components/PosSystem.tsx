// src/components/PosSystem.tsx
'use client'

import { useState } from "react"
import { processSale } from "@/actions/sale-actions"

type ProductType = {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string | null
  ownerName: string
}

export default function PosSystem({ products }: { products: ProductType[] }) {
  const [cart, setCart] = useState<{ product: ProductType; quantity: number }[]>([])
  const [loading, setLoading] = useState(false)

  const addToCart = (product: ProductType) => {
    if (product.stock <= 0) return alert("Sin stock")

    setCart(currentCart => {
      const existing = currentCart.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("No hay más stock disponible")
          return currentCart
        }
        return currentCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }
      return [...currentCart, { product, quantity: 1 }]
    })
  }

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

  const handleCheckout = async () => {
    if (!confirm(`¿Confirmar venta por $${total}?`)) return
    
    setLoading(true)
    
    const payload = cart.map(item => ({
      variantId: item.product.id,
      quantity: item.quantity
    }))

    const result = await processSale(payload, total)
    
    setLoading(false)

    if (result.success) {
      alert("¡Venta Exitosa!")
      setCart([]) 
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20"> {/* pb-20 da espacio abajo */}
      
      {/* IZQUIERDA: GRILLA DE PRODUCTOS */}
      <div className="md:col-span-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock === 0}
              className={`p-4 border rounded-lg text-left transition shadow-sm flex flex-col gap-2 min-h-[200px]
                ${p.stock === 0 ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:border-blue-500 hover:shadow-md'}
              `}
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover rounded mb-2" />
              ) : (
                <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">Sin foto</div>
              )}
              <h3 className="font-bold text-gray-800 leading-tight">{p.name}</h3>
              <div className="flex justify-between items-center w-full mt-auto">
                <span className="text-blue-600 font-bold">${p.price}</span>
                <span className="text-xs text-gray-500">Stock: {p.stock}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DERECHA: TICKET / CARRITO (Sticky para que baje contigo) */}
      <div className="md:col-span-1">
        <div className="bg-white border rounded-lg shadow-lg sticky top-4">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-xl">Ticket Actual</h2>
          </div>
          
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {cart.length === 0 && (
              <p className="text-gray-400 text-center py-10">El carrito está vacío.<br/>Seleccioná productos de la izquierda.</p>
            )}
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x ${item.product.price}</p>
                </div>
                <span className="font-bold">${item.quantity * item.product.price}</span>
              </div>
            ))}
          </div>

          {/* ZONA DE COBRO */}
          <div className="p-6 bg-gray-900 text-white rounded-b-lg">
            <div className="flex justify-between text-2xl font-bold mb-4">
              <span>Total</span>
              <span>${total}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className={`w-full py-4 rounded font-bold text-xl transition
                ${cart.length === 0 ? 'bg-gray-600 cursor-not-allowed text-gray-400' : 'bg-green-500 hover:bg-green-600 text-white'}
              `}
            >
              {loading ? "Procesando..." : "COBRAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}