// src/components/ImageUpload.tsx
'use client' // Necesario para interactuar con el usuario

import { useState } from "react"

export default function ImageUpload({ onImageUpload }: { onImageUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    // 1. Preparar los datos para Cloudinary
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!)

    try {
      // 2. Enviar a Cloudinary (Petición directa desde el navegador)
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.secure_url) {
        // 3. Éxito: Guardamos la URL y avisamos al componente padre
        setPreview(data.secure_url)
        onImageUpload(data.secure_url) // 👈 Esta función viene de afuera
      } else {
        alert("Error al subir imagen")
      }
    } catch (error) {
      console.error(error)
      alert("Error de conexión al subir imagen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Imagen del Producto</label>
      
      <div className="flex items-center gap-4">
        {/* Input de archivo */}
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        {/* Indicador de carga */}
        {uploading && <span className="text-sm text-blue-600">Subiendo...</span>}
      </div>

      {/* Previsualización */}
      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Vista previa" className="h-32 w-32 object-cover rounded-md border" />
        </div>
      )}
    </div>
  )
}