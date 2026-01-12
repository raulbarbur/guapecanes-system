// src/components/ProductForm.tsx
'use client'

import { useState } from "react"
import { createProduct, updateProduct } from "@/actions/product-actions"
import ImageUpload from "./ImageUpload"
import { useRouter } from "next/navigation"

// Tipo para las variantes en el estado local
type VariantItem = {
  id?: string // Si tiene ID, existe en DB. Si no, es nueva.
  name: string
  costPrice: number
  salePrice: number
  stock?: number // Solo lectura (el stock se mueve por inventario)
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
    variants: VariantItem[] // 👈 Ahora recibimos lista
  }
}

export default function ProductForm({ owners, categories, initialData }: Props) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "")
  const [loading, setLoading] = useState(false)
  const [isNewCategory, setIsNewCategory] = useState(false)

  // ESTADO DE VARIANTES
  // Si es nuevo producto, arrancamos con una variante "Estándar" por comodidad
  const [variants, setVariants] = useState<VariantItem[]>(
    initialData?.variants || [{ name: "Estándar", costPrice: 0, salePrice: 0 }]
  )

  const addVariant = () => {
    setVariants([...variants, { name: "", costPrice: 0, salePrice: 0 }])
  }

  const removeVariant = (index: number) => {
    // No permitimos vaciar la lista, mínimo 1 variante.
    if (variants.length <= 1) return alert("Debe haber al menos una variante.")
    
    // Si tiene ID (existe en DB), advertimos que esto NO borra la variante de la DB en este form simple
    // Para borrar variantes con historia se requiere otra lógica. Aquí solo la quitamos de la vista de edición.
    if (variants[index].id) {
       alert("⚠️ Nota: Las variantes ya guardadas no se eliminan desde aquí para proteger el historial de stock.\nSolo se ignorarán los cambios.")
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

  const handleSubmit = async (formData: FormData) => {
    // Validar antes de enviar
    if (variants.some(v => !v.name.trim())) return alert("Todas las variantes deben tener nombre (Ej: Talle S)")
    if (variants.some(v => v.salePrice < v.costPrice)) return alert("Revisá los precios: Hay variantes con rentabilidad negativa.")

    setLoading(true)

    // Agregamos la imagen si existe
    if (imageUrl) formData.append("imageUrl", imageUrl)
    
    // Flag de categoría nueva
    if (isNewCategory) formData.append("isNewCategory", "true")

    // 🔥 SERIALIZAMOS LAS VARIANTES
    formData.append("variantsJson", JSON.stringify(variants))

    let result;

    if (initialData) {
        // MODO EDICIÓN
        formData.append("id", initialData.id)
        result = await updateProduct(formData)
        
        if (result?.success) {
            alert("✅ Producto actualizado")
            router.push("/products")
            router.refresh()
        } else {
            alert("❌ Error: " + result?.error)
        }

    } else {
        // MODO CREACIÓN
        result = await createProduct(formData)
        if (result?.error) alert("❌ Error: " + result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto border">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        {initialData ? "Editar Producto y Variantes" : "Nuevo Producto"}
      </h2>
      
      <form action={handleSubmit} className="space-y-6">
        
        {/* === DATOS GENERALES === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">Nombre del Producto *</label>
                    <input 
                        name="name" 
                        defaultValue={initialData?.name} 
                        type="text" 
                        required 
                        placeholder="Ej: Collar de Cuero"
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Descripción</label>
                    <textarea 
                        name="description" 
                        defaultValue={initialData?.description || ""} 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        rows={2} 
                    />
                </div>
            </div>

            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700">Dueño *</label>
                    <select 
                        name="ownerId" 
                        defaultValue={initialData?.ownerId || ""} 
                        required 
                        className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Seleccionar...</option>
                        {owners.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-gray-700">Categoría *</label>
                        <button 
                            type="button"
                            onClick={() => setIsNewCategory(!isNewCategory)}
                            className="text-xs text-blue-600 font-bold hover:underline"
                        >
                            {isNewCategory ? "Volver a Lista" : "+ Nueva"}
                        </button>
                    </div>
                    {isNewCategory ? (
                        <input 
                            name="categoryName"
                            type="text"
                            placeholder="Nueva categoría..."
                            className="w-full border p-2 rounded bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    ) : (
                        <select 
                            name="categoryId" 
                            defaultValue={initialData?.categoryId || ""} 
                            required 
                            className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Seleccionar...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
        </div>

        <hr className="border-gray-200" />

        {/* === VARIANTES (TABLA DINÁMICA) === */}
        <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-sm font-bold text-gray-700">Variantes / Talles / Colores</label>
                <button 
                    type="button" 
                    onClick={addVariant}
                    className="text-xs bg-slate-800 text-white px-3 py-1 rounded hover:bg-black font-bold"
                >
                    + Agregar Variante
                </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-3 text-left">Variante (Ej: "XL")</th>
                            <th className="p-3 text-left w-32">Costo</th>
                            <th className="p-3 text-left w-32">Venta</th>
                            <th className="p-3 text-center w-20">Stock</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                        {variants.map((variant, idx) => (
                            <tr key={idx}>
                                <td className="p-2">
                                    <input 
                                        type="text" 
                                        value={variant.name}
                                        onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                        placeholder="Ej: Estándar, Rojo S..."
                                        className="w-full border p-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={variant.costPrice}
                                        onChange={(e) => updateVariant(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                                        className="w-full border p-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={variant.salePrice}
                                        onChange={(e) => updateVariant(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                                        className="w-full border p-1.5 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </td>
                                <td className="p-2 text-center text-gray-500 font-mono">
                                    {variant.id ? variant.stock : '-'}
                                </td>
                                <td className="p-2 text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => removeVariant(idx)}
                                        className="text-red-400 hover:text-red-600 font-bold px-2"
                                        title="Quitar de la lista"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                * El stock inicial de nuevas variantes es 0. Hacé un Ingreso de Mercadería luego de crear el producto.
            </p>
        </div>

        {/* === IMAGEN Y SUBMIT === */}
        <div className="border-t pt-4 flex items-center justify-between">
            <div className="w-1/2">
                <ImageUpload onImageUpload={(url) => setImageUrl(url)} />
                {imageUrl && <p className="text-xs text-green-600 mt-1">✓ Imagen lista para guardar</p>}
            </div>
            
            <button 
                type="submit" 
                disabled={loading}
                className={`px-8 py-3 rounded font-bold text-white shadow transition
                    ${loading 
                        ? 'bg-gray-400 cursor-wait' 
                        : 'bg-green-600 hover:bg-green-700 active:scale-95'
                    }
                `}
            >
                {loading ? "Guardando..." : "GUARDAR TODO"}
            </button>
        </div>

      </form>
    </div>
  )
}