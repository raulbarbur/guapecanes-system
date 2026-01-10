// src/components/ProductForm.tsx
'use client'

import { useState } from "react"
import { createProduct, updateProduct } from "@/actions/product-actions"
import ImageUpload from "./ImageUpload"
import { useRouter } from "next/navigation"

type Props = {
  owners: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  initialData?: {
    id: string
    name: string
    description: string | null
    ownerId: string
    categoryId: string
    costPrice: number
    salePrice: number
    imageUrl: string | null
  }
}

export default function ProductForm({ owners, categories, initialData }: Props) {
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "")
  const [loading, setLoading] = useState(false) // Feedback visual
  
  const handleSubmit = async (formData: FormData) => {
    setLoading(true)

    // Agregamos la URL de la imagen manualmente al FormData si cambió
    if (imageUrl) {
        // Si el input file está vacío pero tenemos URL en el estado (por carga previa), aseguramos enviarla
        // Nota: En este form simple confiamos en el input hidden, pero esto refuerza.
    }

    let result;

    if (initialData) {
        // MODO EDICIÓN
        formData.append("id", initialData.id)
        result = await updateProduct(formData)
        
        if (result?.success) {
            alert("✅ Producto actualizado correctamente")
            router.push("/products")
            router.refresh()
        } else {
            alert("❌ Error al actualizar:\n" + result?.error)
        }

    } else {
        // MODO CREACIÓN
        // createProduct hace redirect si todo sale bien. Si retorna algo, es un error.
        result = await createProduct(formData)
        
        if (result?.error) {
            alert("❌ No se pudo crear el producto:\n" + result.error)
        }
    }
    
    setLoading(false)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border">
      <h2 className="text-xl font-bold mb-6">
        {initialData ? "Editar Producto" : "Nuevo Producto"}
      </h2>
      
      <form action={handleSubmit} className="space-y-4">
        
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre *</label>
          <input 
            name="name" 
            defaultValue={initialData?.name} 
            type="text" 
            required 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description || ""} 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            rows={2} 
          />
        </div>

        {/* Selectores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dueño *</label>
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
            <label className="block text-sm font-medium text-gray-700">Categoría *</label>
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
          </div>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
          <div>
            <label className="block text-sm font-medium text-gray-700">Costo (Dueño) *</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input 
                    name="costPrice" 
                    defaultValue={initialData?.costPrice} 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required 
                    className="w-full border p-2 pl-7 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Venta *</label>
            <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input 
                    name="salePrice" 
                    defaultValue={initialData?.salePrice} 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required 
                    className="w-full border p-2 pl-7 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className="border-t pt-4">
          {imageUrl && (
            <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Imagen Actual:</p>
                <img src={imageUrl} alt="Actual" className="w-20 h-20 object-cover rounded border" />
            </div>
          )}
          <ImageUpload onImageUpload={(url) => setImageUrl(url)} />
          <input type="hidden" name="imageUrl" value={imageUrl} />
        </div>

        <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white py-3 rounded font-bold shadow transition
                ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 transform active:scale-95'
                }
            `}
        >
          {loading ? "Procesando..." : (initialData ? "Actualizar Cambios" : "Guardar Producto")}
        </button>

      </form>
    </div>
  )
}