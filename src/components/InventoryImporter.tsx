// src/components/InventoryImporter.tsx
'use client'

import { useState } from "react"
import { exportInventorySheet } from "@/actions/inventory-export-actions"
import { bulkUpdateStock } from "@/actions/inventory-bulk-actions"
import readXlsxFile from "read-excel-file"
import { cn } from "@/lib/utils"

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
        const rows = await readXlsxFile(file)
        const dataRows = rows.slice(1) // Omitir cabecera
        
        const payload = dataRows.map(r => ({
            variantId: r[0] as string,
            quantity: Number(r[5]), 
            reason: r[6] as string  
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
        e.target.value = "" 
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-foreground">Gestión Masiva (Excel)</h2>
          <p className="text-sm text-muted-foreground">Actualizá stock rápidamente descargando la planilla y volviéndola a subir.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* PASO 1: BAJAR */}
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
                <p className="text-sm font-bold text-foreground">Descargar Planilla</p>
            </div>
            <button 
                onClick={handleDownload}
                disabled={downloading}
                className={cn(
                    "w-full bg-background hover:bg-accent text-foreground px-4 py-3 rounded-xl font-bold border border-border shadow-sm transition flex items-center justify-center gap-2 group",
                    downloading && "opacity-50 cursor-wait"
                )}
            >
                <span className="text-xl group-hover:scale-110 transition">📥</span>
                {downloading ? "Generando..." : "Bajar Excel de Stock"}
            </button>
        </div>

        {/* PASO 2: SUBIR */}
        <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10">
            <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">2</span>
                <p className="text-sm font-bold text-foreground">Subir Cambios</p>
            </div>
            
            <div className="relative group">
                {uploading ? (
                    <div className="w-full py-3 text-center text-sm font-bold text-green-600 animate-pulse bg-green-500/10 rounded-xl">
                        Procesando movimientos...
                    </div>
                ) : (
                    <input 
                        type="file" 
                        accept=".xlsx"
                        onChange={handleUpload}
                        className="
                          block w-full text-sm text-muted-foreground
                          file:mr-4 file:py-3 file:px-4
                          file:rounded-xl file:border-0
                          file:text-sm file:font-bold
                          file:bg-green-600 file:text-white
                          hover:file:bg-green-700
                          cursor-pointer
                          file:cursor-pointer
                          file:transition
                        "
                    />
                )}
            </div>
        </div>
      </div>

      {/* LOGS TERMINAL */}
      {logs.length > 0 && (
        <div className="mt-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-inner">
            <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Consola de Resultados</p>
            <div className="font-mono text-xs space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {logs.map((l, i) => (
                    <div key={i} className={cn(
                        "break-all",
                        l.includes('❌') ? "text-red-400" : 
                        l.includes('✅') ? "text-green-400" : 
                        "text-zinc-300"
                    )}>
                        {l}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  )
}