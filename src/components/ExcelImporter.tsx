// src/components/ExcelImporter.tsx
'use client'

import { useState } from "react"
import readXlsxFile from "read-excel-file"
// R-03: Importamos la nueva acción por lotes
import { importProductBatch } from "@/actions/bulk-actions"

// Helper para dividir array en chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export default function ExcelImporter() {
  const [rows, setRows] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 })
  const [logs, setLogs] = useState<string[]>([])

  // 1. LEER EL ARCHIVO
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // R-03: Validación de tamaño (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ El archivo es demasiado grande. Máximo 5MB.")
        e.target.value = "" // Reset input
        return
    }

    try {
      const data = await readXlsxFile(file)
      
      // Mapeo de columnas
      const cleanData = data.slice(1).map(row => ({
        name: row[0] as string,
        variantName: row[1] as string,
        categoryName: row[2] as string,
        ownerName: row[3] as string,
        cost: Number(row[4]),
        price: Number(row[5])
      }))

      setRows(cleanData)
      setLogs(prev => [...prev, `📂 Archivo cargado: ${cleanData.length} filas detectadas. Listo para importar.`])
      setProgress({ current: 0, total: cleanData.length, errors: 0 })
    } catch (error) {
      console.error(error)
      alert("Error leyendo Excel. Verificá el formato.")
    }
  }

  // 2. PROCESAR POR LOTES (BATCHING)
  const startImport = async () => {
    setProcessing(true)
    setLogs([]) // Limpiar logs anteriores
    
    // R-03: Chunking (Lotes de 20)
    const BATCH_SIZE = 20
    const batches = chunkArray(rows, BATCH_SIZE)
    
    let processedCount = 0
    let errorCount = 0
    let batchIndex = 1

    for (const batch of batches) {
        try {
            // Llamada al Server Action con el lote completo
            const result = await importProductBatch(batch)

            if (result.success) {
                processedCount += batch.length
                setLogs(prev => [...prev, `✅ Lote ${batchIndex}/${batches.length}: ${batch.length} items procesados OK.`])
            } else {
                errorCount += batch.length
                setLogs(prev => [...prev, `❌ Error en Lote ${batchIndex}: ${result.error}`])
                // Opcional: Detener proceso ante error masivo
                // break; 
            }
        } catch (err) {
            errorCount += batch.length
            setLogs(prev => [...prev, `❌ Error crítico en Lote ${batchIndex}.`])
        }

        // Actualizar progreso visual
        processedCount = Math.min(processedCount, rows.length) // Clamp visual
        setProgress(p => ({ 
            current: processedCount + errorCount, // Avanzamos la barra ya sea éxito o error
            total: rows.length, 
            errors: errorCount 
        }))

        batchIndex++
    }

    setProcessing(false)
    setLogs(prev => [...prev, `🏁 PROCESO FINALIZADO. Éxitos: ${processedCount}, Fallos: ${errorCount}`])
    
    if (errorCount === 0) {
        // Limpiar filas si todo salió bien para permitir nueva carga
        setTimeout(() => {
            alert("Importación completada exitosamente.")
            setRows([])
        }, 500)
    }
  }

  return (
    <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
      <h2 className="text-xl font-black text-foreground mb-4 font-nunito">Importación Masiva (Excel)</h2>
      
      <div className="mb-6 p-4 bg-primary/5 text-primary text-sm rounded-xl border border-primary/20">
        <strong className="block mb-2 font-bold uppercase text-xs">Formato requerido (Columnas):</strong>
        <ol className="list-decimal list-inside space-y-1 font-mono text-xs text-muted-foreground">
            <li>Nombre Producto <span className="text-primary/50">(Ej: Collar)</span></li>
            <li>Variante <span className="text-primary/50">(Ej: Rojo / XL)</span></li>
            <li>Categoría <span className="text-primary/50">(Ej: Accesorios)</span></li>
            <li>Nombre Dueño <span className="text-primary/50">(Ej: Juan Perez)</span></li>
            <li>Costo <span className="text-primary/50">(Numérico)</span></li>
            <li>Precio Venta <span className="text-primary/50">(Numérico)</span></li>
        </ol>
      </div>

      {!processing && rows.length === 0 && (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className="text-2xl mb-2">📂</span>
                <p className="mb-2 text-sm text-muted-foreground font-bold">Clic para subir archivo Excel</p>
                <p className="text-xs text-muted-foreground">.xlsx (Max 5MB)</p>
            </div>
            <input 
                type="file" 
                accept=".xlsx" 
                onChange={handleFile}
                className="hidden" 
            />
        </label>
      )}

      {rows.length > 0 && !processing && progress.current === 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border">
             <p className="font-bold text-sm text-foreground">📄 {rows.length} filas detectadas.</p>
             <button 
               onClick={() => { setRows([]); setLogs([]); }} 
               className="text-destructive text-xs font-bold hover:underline"
             >
               Cancelar
             </button>
          </div>
          <button 
            onClick={startImport}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-black shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🚀</span> INICIAR IMPORTACIÓN
          </button>
        </div>
      )}

      {/* BARRA DE PROGRESO */}
      {(processing || progress.current > 0) && (
        <div className="mt-6 space-y-2 animate-in fade-in">
          <div className="flex justify-between text-xs font-black uppercase text-muted-foreground">
            <span>Progreso</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${progress.errors > 0 ? 'bg-orange-500' : 'bg-primary'}`}
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">Procesados: {progress.current} / {progress.total}</span>
            {progress.errors > 0 && <span className="text-destructive">Fallos: {progress.errors}</span>}
          </div>
        </div>
      )}

      {/* LOGS DE CONSOLA */}
      <div className="mt-6 bg-zinc-950 text-zinc-300 p-4 rounded-xl font-mono text-[10px] h-48 overflow-y-auto border border-zinc-800 shadow-inner custom-scrollbar">
        {logs.length === 0 ? (
            <span className="opacity-30 italic">Esperando inicio del proceso...</span>
        ) : (
            logs.map((log, i) => (
                <div key={i} className={`mb-1.5 border-b border-white/5 pb-1 ${log.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                    {log}
                </div>
            ))
        )}
      </div>
    </div>
  )
}