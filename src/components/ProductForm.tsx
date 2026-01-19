'use client'

import { useState } from "react"
import { createProduct, updateProduct } from "@/actions/product-actions"
import dynamic from 'next/dynamic'
import { useRouter } from "next/navigation"
import Image from "next/image" // ✅ Importamos Image para previsualizar sin errores
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { SubmitButton } from "@/components/ui/SubmitButton" 
import { CollapsibleSection } from "@/components/ui/CollapsibleSection"

// Cargamos dinámicamente el uploader para evitar problemas de SSR
const ImageUpload = dynamic(() => import('./ImageUpload'), {
  loading: () => <p className="text-xs text-muted-foreground animate-pulse">Cargando módulo de imágenes...</p>,
  ssr: false
})

type VariantItem = {
  id?: string 
  name: string
  costPrice: number
  salePrice: number
  stock?: number 
}

type Props = {
  owners: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  initialData?: {
    id: string
    name: string
    description: string | null
    ownerId: string
    categoryId: string
    imageUrl: string | null
    variants: VariantItem[]
  }
}

export default function ProductForm({ owners, categories, initialData }: Props) {
  const router = useRouter()
  const { addToast } = useToast()
  
  // Estado local
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "")
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [variants, setVariants] = useState<VariantItem[]>(
    initialData?.variants || [{ name: "Estándar", costPrice: 0, salePrice: 0 }]
  )

  // Flag visual
  const showImages = process.env.NEXT_PUBLIC_ENABLE_IMAGES === 'true'

  // --- LÓGICA DE VARIANTES ---
  const addVariant = () => {
    setVariants([...variants, { name: "", costPrice: 0, salePrice: 0 }])
  }

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
        addToast("Debe haber al menos una variante.", "error")
        return
    }
    if (variants[index].id) {
        addToast("Las variantes guardadas no se borran desde aquí para proteger el historial.", "info")
        return
    }
    const newList = [...variants]
    newList.splice(index, 1)
    setVariants(newList)
  }

  const updateVariant = (index: number, field: keyof VariantItem, value: string | number) => {
    const newList = [...variants]
    newList[index] = { ...newList[index], [field]: value }
    setVariants(newList)
  }

  // --- SUBMIT ---
  const handleSubmit = async (formData: FormData) => {
    // Validaciones Frontend
    if (variants.some(v => !v.name.trim())) {
        addToast("Todas las variantes deben tener un nombre.", "error")
        return
    }
    if (variants.some(v => v.salePrice < v.costPrice)) {
        addToast("Revisá los precios: Hay rentabilidad negativa.", "error")
        return
    }

    // Preparar FormData
    if (imageUrl) formData.append("imageUrl", imageUrl)
    if (isNewCategory) formData.append("isNewCategory", "true")
    formData.append("variantsJson", JSON.stringify(variants))

    // Server Actions
    if (initialData) {
        formData.append("id", initialData.id)
        const result = await updateProduct(formData)
        
        if (result && 'error' in result) {
            addToast(result.error || "Error al actualizar.", "error")
        } else {
            addToast("Producto actualizado con éxito.", "success")
            router.push("/products")
            router.refresh()
        }
    } else {
        const result = await createProduct(formData)

        if (result && 'error' in result) {
            addToast(result.error || "Error al crear.", "error")
        } else {
            addToast("Producto creado con éxito.", "success")
            router.refresh()
        }
    }
  }

  // Estilos
  const inputClass = "w-full border border-input bg-background p-2 rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none transition"
  const labelClass = "block text-xs font-bold text-muted-foreground uppercase mb-1.5"

  return (
    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
      <h2 className="text-xl font-black text-foreground mb-6 font-nunito">
        {initialData ? "Editar Producto" : "Nuevo Producto"}
      </h2>
      
      <form action={handleSubmit} className="space-y-6">
        
        {/* BLOQUE 1: DATOS PRINCIPALES (Visible siempre) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className={labelClass}>Nombre del Producto *</label>
                    <input name="name" defaultValue={initialData?.name} type="text" required placeholder="Ej: Collar de Cuero" className={inputClass} autoFocus />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelClass}>Dueño *</label>
                    <select name="ownerId" defaultValue={initialData?.ownerId || ""} required className={inputClass}>
                        <option value="">Seleccionar...</option>
                        {owners.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
                    </select>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className={labelClass}>Categoría *</label>
                        <button type="button" onClick={() => setIsNewCategory(!isNewCategory)} className="text-[10px] text-primary font-bold hover:underline uppercase">
                            {isNewCategory ? "Cancelar" : "+ Nueva"}
                        </button>
                    </div>
                    {isNewCategory ? (
                        <input name="categoryName" type="text" placeholder="Nombre nueva..." className={cn(inputClass, "bg-primary/5 border-primary/20")} />
                    ) : (
                        <select name="categoryId" defaultValue={initialData?.categoryId || ""} required className={inputClass}>
                            <option value="">Seleccionar...</option>
                            {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                    )}
                </div>
            </div>
        </div>

        {/* BLOQUE 2: VARIANTES Y PRECIOS (Core) */}
        <div className="bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-foreground">Variantes y Precios</label>
                <button type="button" onClick={addVariant} className="text-xs bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-90 font-bold transition">
                    + Agregar Variante
                </button>
            </div>
            <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground px-2">
                    <div className="col-span-4">Nombre</div>
                    <div className="col-span-3">Costo</div>
                    <div className="col-span-3">Venta</div>
                    <div className="col-span-1 text-center">Stock</div>
                    <div className="col-span-1"></div>
                </div>
                {variants.map((variant, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-card p-3 md:p-0 rounded-lg md:bg-transparent border md:border-0 border-border mb-2 md:mb-0 shadow-sm md:shadow-none">
                        <div className="col-span-4">
                            <span className="md:hidden text-xs font-bold text-muted-foreground block mb-1">Nombre Variante</span>
                            <input type="text" value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} placeholder="Ej: XL, Rojo..." className={inputClass} />
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                            <span className="text-xs text-muted-foreground md:hidden w-12">Costo:</span>
                            <input type="number" step="0.01" value={variant.costPrice} onChange={(e) => updateVariant(idx, 'costPrice', parseFloat(e.target.value) || 0)} className={inputClass} />
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                            <span className="text-xs text-muted-foreground md:hidden w-12">Venta:</span>
                            <input type="number" step="0.01" value={variant.salePrice} onChange={(e) => updateVariant(idx, 'salePrice', parseFloat(e.target.value) || 0)} className={cn(inputClass, "font-bold text-green-600 dark:text-green-400")} />
                        </div>
                        <div className="col-span-1 text-center text-xs font-mono text-muted-foreground hidden md:block">
                            {variant.id ? variant.stock : '-'}
                        </div>
                        <div className="col-span-1 text-right md:text-center">
                            <button type="button" onClick={() => removeVariant(idx)} className="text-muted-foreground hover:text-destructive transition p-2 bg-muted md:bg-transparent rounded-lg">✕</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* BLOQUE 3: DETALLES (Colapsable) */}
        <CollapsibleSection title="Detalles Adicionales" icon="📝">
             <div>
                <label className={labelClass}>Descripción (Opcional)</label>
                <textarea 
                    name="description" 
                    defaultValue={initialData?.description || ""} 
                    className={inputClass} 
                    rows={3} 
                    placeholder="Detalles internos o características..."
                />
            </div>
        </CollapsibleSection>

        {/* BLOQUE 4: IMAGEN (Colapsable) */}
        {showImages && (
            <CollapsibleSection title="Imagen del Producto" icon="📸" defaultOpen={!!imageUrl}>
                <div className="pt-4 flex flex-col md:flex-row gap-6 items-start">
                    {/* Previsualización manual para evitar el error de prop 'initialUrl' */}
                    {imageUrl && (
                         <div className="relative w-full aspect-video md:w-32 md:aspect-square rounded-xl overflow-hidden border border-border bg-muted shrink-0">
                            <Image 
                                src={imageUrl} 
                                alt="Previsualización" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                    )}

                    <div className="flex-1 w-full">
                        <label className={labelClass}>
                            {imageUrl ? "Cambiar Imagen" : "Subir Nueva"}
                        </label>
                        {/* Usamos el componente ImageUpload limpio, sin props inventadas */}
                        <ImageUpload onImageUpload={(url) => setImageUrl(url)} />
                    </div>
                </div>
            </CollapsibleSection>
        )}

        <div className="pt-4">
            <SubmitButton loadingText="Guardando..." className="w-full py-4 text-lg">
                GUARDAR PRODUCTO
            </SubmitButton>
        </div>
      </form>
    </div>
  )
}