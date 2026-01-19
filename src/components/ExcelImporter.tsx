'use client'

import { useState } from "react"
import readXlsxFile from "read-excel-file"
import { importProductBatch } from "@/actions/bulk-actions"
import { cn } from "@/lib/utils"

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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ El archivo es demasiado grande. Máximo 5MB.")
        e.target.value = "" 
        return
    }

    try {
      const data = await readXlsxFile(file)
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

  const startImport = async () => {
    setProcessing(true)
    setLogs([]) 
    
    const BATCH_SIZE = 20
    const batches = chunkArray(rows, BATCH_SIZE)
    
    let processedCount = 0
    let errorCount = 0
    let batchIndex = 1

    for (const batch of batches) {
        try {
            const result = await importProductBatch(batch)

            if (result.success) {
                processedCount += batch.length
                setLogs(prev => [...prev, `✅ Lote ${batchIndex}/${batches.length}: ${batch.length} items procesados.`])
            } else {
                errorCount += batch.length
                setLogs(prev => [...prev, `❌ Error en Lote ${batchIndex}: ${result.error}`])
            }
        } catch (err) {
            errorCount += batch.length
            setLogs(prev => [...prev, `❌ Error crítico en Lote ${batchIndex}.`])
        }

        processedCount = Math.min(processedCount, rows.length) 
        setProgress(p => ({ 
            current: processedCount + errorCount,
            total: rows.length, 
            errors: errorCount 
        }))

        batchIndex++
    }

    setProcessing(false)
    setLogs(prev => [...prev, `🏁 FIN DEL PROCESO. Éxitos: ${processedCount} | Fallos: ${errorCount}`])
    
    if (errorCount === 0) {
        setTimeout(() => {
            alert("Importación completada exitosamente.")
            setRows([])
        }, 500)
    }
  }

  return (
    <div className="bg-card p-6 md:p-8 rounded-3xl shadow-sm border border-border h-full flex flex-col">
      <h2 className="text-xl font-black text-foreground mb-4 font-nunito flex items-center gap-2">
         <span>📊</span> Importación Masiva (Excel)
      </h2>
      
      <div className="mb-6 p-5 bg-primary/5 text-foreground text-sm rounded-2xl border border-primary/10">
        <strong className="block mb-3 font-bold uppercase text-xs text-primary tracking-wide">Columnas Requeridas</strong>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
            <div>1. Nombre Producto</div>
            <div>2. Variante (Talle/Color)</div>
            <div>3. Categoría</div>
            <div>4. Dueño</div>
            <div>5. Costo</div>
            <div>6. Precio Venta</div>
        </div>
      </div>

      {!processing && rows.length === 0 && (
        <label className="flex flex-col items-center justify-center w-full flex-1 min-h-[200px] border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/30 transition group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className="text-4xl mb-3 grayscale opacity-50 group-hover:scale-110 transition-transform">📄</span>
                <p className="mb-1 text-sm font-bold text-foreground">Subir archivo Excel</p>
                <p className="text-xs text-muted-foreground">Click o arrastrar aquí (.xlsx)</p>
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
          <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border">
             <div className="flex items-center gap-3">
                 <span className="text-2xl">📑</span>
                 <div>
                    <p className="font-bold text-sm text-foreground">{rows.length} filas listas</p>
                    <p className="text-xs text-muted-foreground">Preparado para importar</p>
                 </div>
             </div>
             <button 
               onClick={() => { setRows([]); setLogs([]); }} 
               className="text-muted-foreground hover:text-destructive text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition"
             >
               Cancelar
             </button>
          </div>
          <button 
            onClick={startImport}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black shadow-lg shadow-green-900/20 transition active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
          >
            <span>🚀</span> Comenzar Importación
          </button>
        </div>
      )}

      {/* BARRA DE PROGRESO */}
      {(processing || progress.current > 0) && (
        <div className="mt-6 space-y-3 animate-in fade-in">
          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <span>Progreso del lote</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  progress.errors > 0 ? 'bg-orange-500' : 'bg-primary'
              )}
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">Procesando {progress.current} de {progress.total}...</span>
            {progress.errors > 0 && <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded">{progress.errors} errores</span>}
          </div>
        </div>
      )}

      {/* CONSOLA DE LOGS */}
      <div className="mt-6 bg-slate-950 dark:bg-black text-slate-300 p-4 rounded-2xl font-mono text-[10px] h-48 overflow-y-auto border border-border shadow-inner custom-scrollbar">
        {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-30 italic">
                Esperando inicio del proceso...
            </div>
        ) : (
            logs.map((log, i) => (
                <div key={i} className={cn(
                    "mb-1.5 border-b border-white/5 pb-1 last:border-0",
                    log.includes('❌') ? 'text-red-400 font-bold' : 'text-green-400'
                )}>
                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                </div>
            ))
        )}
      </div>
    </div>
  )
}