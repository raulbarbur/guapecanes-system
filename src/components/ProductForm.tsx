// src/components/ProductForm.tsx
'use client'

import { useState } from "react"
import { createProduct } from "@/actions/product-actions"
import ImageUpload from "./ImageUpload"

// Definimos qué datos esperamos recibir (props)
type Props = {
  owners: { id: string; name: string }[]
  categories: { id: string; name: string }[]
}

export default function ProductForm({ owners, categories }: Props) {
  const [imageUrl, setImageUrl] = useState("")

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border">
      <h2 className="text-xl font-bold mb-6">Nuevo Producto</h2>
      
      <form action={createProduct} className="space-y-4">
        
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Producto *</label>
          <input name="name" type="text" required className="w-full border p-2 rounded" placeholder="Ej: Correa Extensible" />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="description" className="w-full border p-2 rounded" rows={2} />
        </div>

        {/* Selectores (Relaciones) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dueño (Consignante) *</label>
            <select name="ownerId" required className="w-full border p-2 rounded bg-white">
              <option value="">Seleccionar...</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría *</label>
            <select name="categoryId" required className="w-full border p-2 rounded bg-white">
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
            <label className="block text-sm font-medium text-gray-700">Costo (Lo que pagamos) *</label>
            <input name="costPrice" type="number" step="0.01" required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio Venta (Público) *</label>
            <input name="salePrice" type="number" step="0.01" required className="w-full border p-2 rounded" />
          </div>
        </div>

        {/* Imagen (Componente Especial) */}
        <div className="border-t pt-4">
          <ImageUpload onImageUpload={(url) => setImageUrl(url)} />
          {/* TRUCO: Input oculto para enviar la URL al servidor */}
          <input type="hidden" name="imageUrl" value={imageUrl} />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold">
          Guardar Producto
        </button>

      </form>
    </div>
  )
}