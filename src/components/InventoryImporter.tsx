// src/components/InventoryImporter.tsx
'use client'

import { useState } from "react"
import { exportInventorySheet } from "@/actions/inventory-export-actions"
import { bulkUpdateStock } from "@/actions/inventory-bulk-actions"
import readXlsxFile from "read-excel-file"

export default function InventoryImporter() {
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // 1. DESCARGAR PLANILLA
  const handleDownload = async () => {
    setDownloading(true)
    const res = await exportInventorySheet()
    if (res.success && res.base64) {
        const link = document.createElement("a")
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.base64}`
        link.download = res.filename!
        link.click()
    } else {
        alert("Error descargando planilla")
    }
    setDownloading(false)
  }

  // 2. IMPORTAR PLANILLA
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm("⚠️ ¿Estás seguro de procesar este archivo?\n\nLas cantidades ingresadas se SUMARÁN al stock actual.")) {
        e.target.value = "" // Reset
        return
    }

    setUploading(true)
    setLogs([])

    try {
        // Mapeo de columnas por índice (A=0, B=1...)
        // A: ID (0), F: CANTIDAD (5), G: MOTIVO (6)
        const rows = await readXlsxFile(file)
        
        // Omitir cabecera
        const dataRows = rows.slice(1)
        
        const payload = dataRows.map(r => ({
            variantId: r[0] as string,
            quantity: Number(r[5]), // Columna F
            reason: r[6] as string  // Columna G
        })).filter(item => item.variantId && item.quantity !== 0 && !isNaN(item.quantity))

        if (payload.length === 0) {
            alert("No se detectaron cantidades válidas para procesar.")
            setUploading(false)
            return
        }

        setLogs(prev => [...prev, `⏳ Procesando ${payload.length} movimientos...`])

        const res = await bulkUpdateStock(payload)

        if (res.success) {
            setLogs(prev => [...prev, `✅ Éxito: ${res.count} items actualizados.`])
            if (res.errors && res.errors.length > 0) {
                res.errors.forEach(err => setLogs(p => [...p, `❌ ${err}`]))
            }
        } else {
            setLogs(prev => [...prev, `⛔ Error General: ${res.error}`])
        }

    } catch (error) {
        console.error(error)
        alert("Error leyendo el archivo.")
    } finally {
        setUploading(false)
        e.target.value = "" // Reset input
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Gestión Masiva de Stock</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* PASO 1: BAJAR */}
        <div className="border-r md:pr-6 border-gray-100">
            <p className="text-sm text-gray-500 mb-2">1. Descargá la planilla con tus productos actuales.</p>
            <button 
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded font-bold border border-blue-200 hover:bg-blue-100 transition flex items-center justify-center gap-2"
            >
                {downloading ? "Generando..." : "📥 Descargar Planilla de Carga"}
            </button>
        </div>

        {/* PASO 2: SUBIR */}
        <div>
            <p className="text-sm text-gray-500 mb-2">2. Subí el Excel con la columna "CANTIDAD" completa.</p>
            <div className="relative">
                {uploading ? (
                    <div className="text-center py-2 text-sm font-bold text-blue-600 animate-pulse">
                        Procesando movimientos...
                    </div>
                ) : (
                    <input 
                        type="file" 
                        accept=".xlsx"
                        onChange={handleUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
                    />
                )}
            </div>
        </div>
      </div>

      {/* LOGS */}
      {logs.length > 0 && (
        <div className="mt-4 bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}