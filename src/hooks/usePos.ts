// src/hooks/usePos.ts
'use client'

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { processSale } from "@/actions/sale-actions"
import { useToast } from "@/components/ui/Toast"

// --- TIPOS ---
export type VariantType = {
  id: string
  name: string
  price: number
  stock: number
}

export type ProductGroupType = {
  id: string
  name: string
  categoryName: string
  ownerName: string
  imageUrl: string | null
  totalStock: number
  variants: VariantType[]
}

export type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  name: string
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

export function usePos(products: ProductGroupType[]) {
  const { addToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // --- ESTADOS ---
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)
  
  // Filtros
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">("ALL")

  // Modal de Selección
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductGroupType | null>(null)

  // --- EFECTOS ---
  
  // Carga de servicios desde la URL (Agenda)
  useEffect(() => {
    const apptId = searchParams.get("apptId")
    const petName = searchParams.get("petName")
    
    // Solo cargamos si hay datos y el carrito está vacío para evitar duplicados infinitos
    if (apptId && petName) {
       // Verificamos si ya está en el carrito
       setCart(current => {
         const exists = current.some(i => i.id === apptId && i.type === 'SERVICE')
         if (exists) return current

         addToast(`Servicio para ${petName} cargado`, 'info')
         return [{
            type: 'SERVICE',
            id: apptId,
            name: `Servicio: ${petName}`,
            price: 0, 
            quantity: 1
         }, ...current]
       })
    }
  }, [searchParams, addToast])

  // --- LÓGICA FILTROS ---
  const categories = useMemo(() => {
    const cats = products.map(p => p.categoryName)
    return ["ALL", ...Array.from(new Set(cats))].sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase()
    return products.filter(p => {
        const matchesCategory = selectedCategory === "ALL" || p.categoryName === selectedCategory
        const matchesText = 
            p.name.toLowerCase().includes(term) || 
            p.ownerName.toLowerCase().includes(term) ||
            p.categoryName.toLowerCase().includes(term)
        return matchesCategory && matchesText
    })
  }, [products, search, selectedCategory])

  // --- LÓGICA CARRITO ---

  const addVariantToCart = useCallback((productName: string, variant: VariantType) => {
    if (variant.stock <= 0) {
        addToast(`Sin stock para ${variant.name}`, 'error')
        return
    }

    setCart(current => {
        const existingIndex = current.findIndex(item => item.id === variant.id && item.type === 'PRODUCT')
        
        if (existingIndex >= 0) {
            const existingItem = current[existingIndex]
            if (existingItem.quantity >= variant.stock) {
                addToast("Stock máximo alcanzado", 'error')
                return current
            }
            
            const newCart = [...current]
            newCart[existingIndex] = { ...existingItem, quantity: existingItem.quantity + 1 }
            return newCart
        }
        
        const displayName = variant.name === "Estándar" ? productName : `${productName} - ${variant.name}`
        
        return [...current, { 
            type: 'PRODUCT', 
            id: variant.id, 
            name: displayName, 
            price: variant.price, 
            quantity: 1, 
            stockMax: variant.stock 
        }]
    })
  }, [addToast])

  const handleProductClick = useCallback((product: ProductGroupType) => {
    const activeVariants = product.variants.filter(v => v.stock > 0)

    if (activeVariants.length === 0) {
        addToast("Producto agotado", 'error')
        return
    }

    if (activeVariants.length === 1) {
        addVariantToCart(product.name, activeVariants[0])
    } else {
        setSelectedProductForModal(product)
    }
  }, [addVariantToCart, addToast])

  const removeFromCart = useCallback((index: number) => {
    setCart(current => current.filter((_, i) => i !== index))
  }, [])

  const updateServicePrice = useCallback((index: number, newPrice: string) => {
    const val = parseFloat(newPrice)
    setCart(current => current.map((item, i) => i === index ? { ...item, price: isNaN(val) ? 0 : val } : item))
  }, [])

  // --- CHECKOUT ---
  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart])

  const checkout = async () => {
    if (total === 0 && !confirm("¿Confirmar venta por $0?")) return
    
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
      addToast("✅ Venta Exitosa", 'success')
      setLastSale({
        id: result.saleId,
        date: result.date,
        items: cart.map(i => ({ description: i.name, quantity: i.quantity, price: i.price })),
        total: total,
        method: paymentMethod
      })
      setCart([]) 
      
      // Si veníamos de la agenda, limpiamos la URL para no volver a cargar el servicio
      if (searchParams.get("apptId")) {
          router.replace("/pos") 
      } else {
          router.refresh()
      }
    } else {
      addToast(result.error || "Error al procesar", 'error')
    }
  }

  const clearLastSale = () => setLastSale(null)

  return {
    // Estado
    cart,
    total,
    loading,
    paymentMethod,
    lastSale,
    search,
    selectedCategory,
    categories,
    filteredProducts,
    selectedProductForModal,
    
    // Setters
    setPaymentMethod,
    setSearch,
    setSelectedCategory,
    setSelectedProductForModal,
    clearLastSale,

    // Acciones
    handleProductClick,
    addVariantToCart,
    removeFromCart,
    updateServicePrice,
    checkout
  }
}