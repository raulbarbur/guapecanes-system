// src/components/ProductForm.tsx
'use client'

import { useState } from "react"
import { createProduct, updateProduct } from "@/actions/product-actions" // 👈 Importamos update
import ImageUpload from "./ImageUpload"
import { useRouter } from "next/navigation" // Para volver atrás después de editar

type Props = {
  owners: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  // 👇 NUEVO: Datos opcionales para edición
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
  
  // Función wrapper para manejar la redirección post-guardado si es edición
  const handleSubmit = async (formData: FormData) => {
    if (initialData) {
        // MODO EDICIÓN
        formData.append("id", initialData.id) // Agregamos el ID oculto
        await updateProduct(formData)
        alert("Producto actualizado correctamente")
        router.push("/products") // Volver al listado
        router.refresh() // Refrescar datos visuales
    } else {
        // MODO CREACIÓN
        await createProduct(formData)
        // createProduct ya hace redirect, no hace falta lógica aquí
    }
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
            defaultValue={initialData?.name} // 👈 Pre-carga
            type="text" 
            required 
            className="w-full border p-2 rounded" 
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea 
            name="description" 
            defaultValue={initialData?.description || ""} 
            className="w-full border p-2 rounded" 
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
              className="w-full border p-2 rounded bg-white"
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
              className="w-full border p-2 rounded bg-white"
            >
              <option value="">Seleccionar...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <label className="block text-sm font-medium text-gray-700">Costo (Dueño) *</label>
            <input 
                name="costPrice" 
                defaultValue={initialData?.costPrice} 
                type="number" 
                step="0.01" 
                required 
                className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Venta *</label>
            <input 
                name="salePrice" 
                defaultValue={initialData?.salePrice} 
                type="number" 
                step="0.01" 
                required 
                className="w-full border p-2 rounded" 
            />
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

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold">
          {initialData ? "Actualizar Cambios" : "Guardar Producto"}
        </button>

      </form>
    </div>
  )
}