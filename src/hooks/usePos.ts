'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { processSale } from "@/actions/sale-actions"
import { useToast } from "@/components/ui/Toast"

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

export type CustomerOption = {
  id: string
  name: string
}

export type CartItem = {
  type: 'PRODUCT' | 'SERVICE'
  id: string
  name: string
  price: number
  quantity: number
  stockMax?: number
}

type PaymentMethod = "CASH" | "TRANSFER" | "CHECKING_ACCOUNT"

type SaleResult = {
    id: string
    date: Date
    items: { description: string; quantity: number; price: number }[]
    total: number
    method: PaymentMethod
}

export function usePos(products: ProductGroupType[], customers: CustomerOption[]) {
  const { addToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">("ALL")
  const [selectedProductForModal, setSelectedProductForModal] = useState<ProductGroupType | null>(null)

  // FIX: Usamos un ref para evitar loop infinito de useEffect si agregamos dependencias
  const processedParamsRef = useRef(false)

  // --- EFECTO: Carga de Servicios desde URL ---
  useEffect(() => {
    const apptId = searchParams.get("apptId")
    const petName = searchParams.get("petName")
    
    // Solo ejecutar si no se ha procesado ya para evitar re-renders y loops
    if (apptId && petName && !processedParamsRef.current) {
       processedParamsRef.current = true
       
       setCart(current => {
         // Verificación defensiva
         if (current.some(i => i.id === apptId && i.type === 'SERVICE')) return current
         
         // Retornar nuevo estado
         return [{
            type: 'SERVICE',
            id: apptId,
            name: `Servicio: ${petName}`,
            price: 0, 
            quantity: 1
         }, ...current]
       })

       // FIX: Sacamos el Toast del flujo de renderizado usando setTimeout
       setTimeout(() => {
           addToast(`Servicio para ${petName} cargado`, 'info')
       }, 100)
    }
  }, [searchParams, addToast])

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
                // FIX: Toast asíncrono
                setTimeout(() => addToast("Stock máximo alcanzado", 'error'), 0)
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

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart])

  const checkout = async () => {
    if (total === 0 && !confirm("¿Confirmar venta por $0?")) return
    
    if (paymentMethod === 'CHECKING_ACCOUNT' && !selectedCustomerId) {
        addToast("⚠️ Seleccioná un cliente para fiar.", 'error')
        return
    }

    setLoading(true)
    
    const payload = cart.map(item => ({ 
        type: item.type, 
        id: item.id, 
        description: item.name, 
        price: item.price, 
        quantity: item.quantity 
    }))
    
    const result = await processSale(payload, total, paymentMethod, selectedCustomerId || undefined)
    
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
      setSelectedCustomerId("")
      setPaymentMethod("CASH")

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
    cart, total, loading, paymentMethod, lastSale,
    search, selectedCategory, categories, filteredProducts, selectedProductForModal,
    selectedCustomerId,
    setPaymentMethod, setSearch, setSelectedCategory, setSelectedProductForModal, clearLastSale,
    setSelectedCustomerId,
    handleProductClick, addVariantToCart, removeFromCart, updateServicePrice, checkout
  }
}