// src/components/PosSystem.tsx
'use client'

import { useState, useEffect } from "react"
import { processSale } from "@/actions/sale-actions"
import { useSearchParams, useRouter } from "next/navigation"

type ProductType = {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string | null
  ownerName: string
}

// Estructura interna del carrito en el Frontend
type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  name: string
  price: number
  quantity: number
  stockMax?: number // Solo aplica a productos físicos
}

export default function PosSystem({ products }: { products: ProductType[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Hooks de Next.js para leer URL y navegar
  const searchParams = useSearchParams()
  const router = useRouter()

  // 1. DETECTAR SI VENIMOS DE LA AGENDA
  // Se ejecuta al cargar la página. Si hay "apptId" en la URL, agregamos el servicio.
  useEffect(() => {
    const apptId = searchParams.get("apptId")
    const petName = searchParams.get("petName")
    
    // Solo agregamos si el carrito está vacío para no duplicar al recargar
    if (apptId && petName && cart.length === 0) {
      setCart([{
        type: 'SERVICE',
        id: apptId,
        name: `Servicio: ${petName}`,
        price: 0, // Inicia en 0, el usuario debe poner el precio
        quantity: 1
      }])
    }
  }, [searchParams]) // Se ejecuta cuando cambian los params

  // Función: Agregar Producto al Carrito
  const addProductToCart = (product: ProductType) => {
    if (product.stock <= 0) return alert("Sin stock")

    setCart(current => {
      // Verificamos si ya está en el carrito
      const existing = current.find(item => item.id === product.id && item.type === 'PRODUCT')
      
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("No hay más stock disponible")
          return current
        }
        return current.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      // Si no existe, lo agregamos
      return [...current, { 
        type: 'PRODUCT',
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stockMax: product.stock
      }]
    })
  }

  // Función: Modificar Precio (Exclusivo para Servicios)
  const updateServicePrice = (index: number, newPrice: string) => {
    const val = parseFloat(newPrice)
    setCart(current => current.map((item, i) => 
        i === index ? { ...item, price: isNaN(val) ? 0 : val } : item
    ))
  }

  // Función: Quitar del Carrito
  const removeFromCart = (index: number) => {
    setCart(current => current.filter((_, i) => i !== index))
  }

  // Calcular Total en tiempo real
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Función Principal: Cobrar
  const handleCheckout = async () => {
    // Validaciones básicas de seguridad en cliente
    if (total === 0 && !confirm("¿Confirmar venta por $0?")) return
    if (!confirm(`¿Confirmar venta por $${total.toLocaleString()}?`)) return
    
    setLoading(true)
    
    // Preparamos el payload para el Server Action
    const payload = cart.map(item => ({
      type: item.type,
      id: item.id,
      description: item.name,
      price: item.price,
      quantity: item.quantity
    }))

    // Llamada al servidor
    const result = await processSale(payload, total)
    
    setLoading(false)

    if (result.success) {
      alert("¡Venta Exitosa!")
      setCart([])
      
      // Si veníamos de la agenda, volvemos a ella automáticamente
      if (searchParams.get("apptId")) {
        router.push("/agenda")
      }
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
      
      {/* SECCIÓN IZQUIERDA: PRODUCTOS FÍSICOS */}
      <div className="md:col-span-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <button 
              key={p.id}
              onClick={() => addProductToCart(p)}
              disabled={p.stock === 0}
              className={`p-4 border rounded-lg text-left transition shadow-sm flex flex-col gap-2 min-h-[180px]
                ${p.stock === 0 ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white hover:border-blue-500 hover:shadow-md'}
              `}
            >
              <div className="flex-1 w-full">
                 {p.imageUrl ? (
                     <img src={p.imageUrl} alt={p.name} className="h-24 w-full object-cover rounded mb-2"/>
                 ) : (
                     <div className="h-24 bg-gray-200 rounded mb-2 flex items-center justify-center text-xs text-gray-500">Sin Foto</div>
                 )}
                 <h3 className="font-bold text-gray-800 text-sm leading-tight">{p.name}</h3>
              </div>
              <div className="flex justify-between items-center w-full">
                <span className="text-blue-600 font-bold">${p.price}</span>
                <span className="text-xs text-gray-500">Stock: {p.stock}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN DERECHA: TICKET / CARRITO */}
      <div className="md:col-span-1">
        <div className="bg-white border rounded-lg shadow-lg sticky top-4 flex flex-col h-[calc(100vh-2rem)]">
          
          {/* Cabecera del Ticket */}
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-xl text-gray-800">Ticket Actual</h2>
          </div>
          
          {/* Lista de Items */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {cart.length === 0 && (
              <p className="text-gray-400 text-center py-10">
                El carrito está vacío.<br/>Seleccioná productos o servicios.
              </p>
            )}
            
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start border-b pb-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {/* Icono para diferenciar servicios de productos */}
                    {item.type === 'SERVICE' && <span className="mr-1">✂️</span>}
                    {item.name}
                  </p>
                  
                  {/* Si es SERVICIO: Input para poner el precio */}
                  {item.type === 'SERVICE' ? (
                     <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">Precio: $</span>
                        <input 
                            type="number" 
                            value={item.price} 
                            onChange={(e) => updateServicePrice(index, e.target.value)}
                            className="w-24 border rounded px-1 py-0.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                            placeholder="0.00"
                        />
                     </div>
                  ) : (
                     // Si es PRODUCTO: Cantidad x Precio fijo
                     <p className="text-sm text-gray-500">{item.quantity} x ${item.price}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-gray-800">${(item.quantity * item.price).toLocaleString()}</span>
                    <button 
                        onClick={() => removeFromCart(index)}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                        Quitar
                    </button>
                </div>
              </div>
            ))}
          </div>

          {/* Zona de Totales y Botón de Cobro */}
          <div className="p-6 bg-slate-900 text-white rounded-b-lg mt-auto">
            <div className="flex justify-between text-2xl font-bold mb-4">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className={`w-full py-4 rounded-lg font-bold text-xl transition transform active:scale-95
                ${cart.length === 0 
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-900/20'
                }
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