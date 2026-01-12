// src/components/ExportButtons.tsx
'use client'

import { useState } from "react"
import { exportProducts } from "@/actions/export-actions"

export default function ExportButtons() {
  const [loading, setLoading] = useState<'TEMPLATE' | 'FULL' | null>(null)

  const handleExport = async (mode: 'TEMPLATE' | 'FULL') => {
    setLoading(mode)
    
    try {
      const result = await exportProducts(mode)

      if (result.success && result.base64 && result.filename) {
        // Truco para descargar archivo desde Base64 en el cliente
        const link = document.createElement("a")
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.base64}`
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert("Error: " + result.error)
      }
    } catch (error) {
      console.error(error)
      alert("Error de conexión al exportar.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      
      {/* OPCIÓN 1: PLANTILLA VACÍA */}
      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-center gap-2">
        <h3 className="font-bold text-gray-700">¿Carga Nueva?</h3>
        <p className="text-xs text-gray-500 max-w-xs">Descargá el formato oficial para completar y subir.</p>
        <button 
          onClick={() => handleExport('TEMPLATE')}
          disabled={!!loading}
          className="mt-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded text-sm font-bold hover:bg-gray-100 transition shadow-sm w-full md:w-auto"
        >
          {loading === 'TEMPLATE' ? "Generando..." : "📄 Descargar Plantilla Vacía"}
        </button>
      </div>

      {/* OPCIÓN 2: EXPORTAR DATOS REALES */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center gap-2">
        <h3 className="font-bold text-blue-900">Edición Masiva</h3>
        <p className="text-xs text-blue-700 max-w-xs">Bajá todo tu inventario actual, editá precios en Excel y volvé a subirlo.</p>
        <button 
           onClick={() => handleExport('FULL')}
           disabled={!!loading}
           className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition shadow w-full md:w-auto"
        >
          {loading === 'FULL' ? "Procesando..." : "📥 Exportar Inventario Completo"}
        </button>
      </div>

    </div>
  )
}