'use client'

import { useState } from "react"
import { exportProducts } from "@/actions/export-actions"
import { useToast } from "@/components/ui/Toast" // Usamos el sistema de notificaciones
import { cn } from "@/lib/utils"

export default function ExportButtons() {
  const [loading, setLoading] = useState<'TEMPLATE' | 'FULL' | null>(null)
  const { addToast } = useToast()

  const handleExport = async (mode: 'TEMPLATE' | 'FULL') => {
    setLoading(mode)
    
    try {
      const result = await exportProducts(mode)

      if (result.success && result.base64 && result.filename) {
        // Truco para descargar archivo desde Base64
        const link = document.createElement("a")
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.base64}`
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        addToast(
            mode === 'TEMPLATE' ? "📄 Plantilla descargada" : "📥 Exportación completa", 
            "success"
        )
      } else {
        addToast(`❌ ${result.error}`, "error")
      }
    } catch (error) {
      console.error(error)
      addToast("🚫 Error de conexión al exportar", "error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      
      {/* OPCIÓN 1: PLANTILLA VACÍA */}
      <div className="bg-card hover:bg-muted/30 p-6 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-2 transition-colors duration-200 group">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-1">
            📄
        </div>
        <h3 className="font-black text-foreground text-sm uppercase tracking-wide">¿Carga Nueva?</h3>
        <p className="text-xs text-muted-foreground max-w-xs font-medium">Descargá el formato oficial vacío para completar y subir.</p>
        <button 
          onClick={() => handleExport('TEMPLATE')}
          disabled={!!loading}
          className="mt-3 w-full md:w-auto bg-background hover:bg-accent text-foreground border border-input px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
        >
          {loading === 'TEMPLATE' ? "Generando..." : "Descargar Plantilla"}
        </button>
      </div>

      {/* OPCIÓN 2: EXPORTAR DATOS REALES */}
      <div className="bg-blue-500/5 hover:bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20 flex flex-col items-center justify-center text-center gap-2 transition-colors duration-200 group">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-1">
            📥
        </div>
        <h3 className="font-black text-blue-700 dark:text-blue-400 text-sm uppercase tracking-wide">Edición Masiva</h3>
        <p className="text-xs text-blue-600/80 dark:text-blue-300/80 max-w-xs font-medium">Bajá tu inventario actual, editá precios rápido y volvé a subirlo.</p>
        <button 
           onClick={() => handleExport('FULL')}
           disabled={!!loading}
           className="mt-3 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/20"
        >
          {loading === 'FULL' ? "Procesando..." : "Exportar Inventario"}
        </button>
      </div>

    </div>
  )
}