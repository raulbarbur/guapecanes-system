// src/components/ExcelImporter.tsx
'use client'

import { useState } from "react"
import readXlsxFile from "read-excel-file"
import { importSingleProduct } from "@/actions/bulk-actions"

export default function ExcelImporter() {
  const [rows, setRows] = useState<any[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 })
  const [logs, setLogs] = useState<string[]>([])

  // 1. LEER EL ARCHIVO
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Leemos el Excel. 
      // NUEVO ORDEN DE COLUMNAS:
      // 0: Producto | 1: Variante | 2: Categoría | 3: Dueño | 4: Costo | 5: Precio
      const data = await readXlsxFile(file)
      
      // Eliminamos la cabecera (fila 0) y mapeamos
      const cleanData = data.slice(1).map(row => ({
        name: row[0] as string,
        variantName: row[1] as string, // 👈 Nueva columna leída
        categoryName: row[2] as string,
        ownerName: row[3] as string,
        cost: Number(row[4]),
        price: Number(row[5])
      }))

      setRows(cleanData)
      setLogs(prev => [...prev, `Archivo cargado: ${cleanData.length} filas detectadas.`])
    } catch (error) {
      console.error(error)
      alert("Error leyendo Excel. Verificá el formato.")
    }
  }

  // 2. PROCESAR BUCLE
  const startImport = async () => {
    setProcessing(true)
    setProgress({ current: 0, total: rows.length, errors: 0 })
    setLogs([])

    let successCount = 0
    let errorCount = 0

    // BUCLE SECUENCIAL
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Validación básica visual
      if (!row.name || !row.ownerName) {
        setLogs(prev => [...prev, `❌ Fila ${i+2}: Faltan datos (Nombre o Dueño)`])
        errorCount++
        setProgress(p => ({ ...p, current: i + 1, errors: p.errors + 1 }))
        continue
      }

      // Llamada al Server
      const result = await importSingleProduct(row)

      if (result.success) {
        successCount++
      } else {
        errorCount++
        // Mostramos el nombre completo (Producto - Variante) en el log de error
        const fullName = row.variantName ? `${row.name} (${row.variantName})` : row.name
        setLogs(prev => [...prev, `❌ Error en "${fullName}": ${result.error}`])
      }

      // Actualizar progreso
      setProgress(p => ({ 
        current: i + 1, 
        total: rows.length, 
        errors: errorCount 
      }))
    }

    setProcessing(false)
    setLogs(prev => [...prev, `🏁 FINALIZADO. Procesados: ${successCount}, Errores: ${errorCount}`])
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">Importación Masiva (Excel)</h2>
      
      <div className="mb-6 p-4 bg-blue-50 text-blue-900 text-sm rounded border border-blue-100">
        <strong className="block mb-2 text-blue-700">Formato requerido (Columnas):</strong>
        <ol className="list-decimal list-inside space-y-1 font-mono text-xs">
            <li>Nombre Producto (Ej: Collar Nylon)</li>
            <li><strong>Variante (Ej: Rojo / XL)</strong> - <em>Nuevo! Dejar vacío para "Estándar"</em></li>
            <li>Categoría (Ej: Accesorios)</li>
            <li>Nombre Dueño (Ej: Juan Perez)</li>
            <li>Costo (Numérico)</li>
            <li>Precio Venta (Numérico)</li>
        </ol>
      </div>

      {!processing && rows.length === 0 && (
        <input 
          type="file" 
          accept=".xlsx" 
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
      )}

      {rows.length > 0 && !processing && progress.current === 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
             <p className="font-bold text-lg text-gray-800">{rows.length} filas listas.</p>
             <button 
               onClick={() => setRows([])} 
               className="text-red-500 text-xs font-bold hover:underline"
             >
               Cancelar
             </button>
          </div>
          <button 
            onClick={startImport}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-bold shadow transition"
          >
            Iniciar Importación
          </button>
        </div>
      )}

      {/* BARRA DE PROGRESO */}
      {(processing || progress.current > 0) && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Procesando: {progress.current} / {progress.total}</span>
            <span className={`${progress.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>Errores: {progress.errors}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ${processing ? 'bg-blue-600 animate-pulse' : 'bg-green-600'}`}
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* LOGS DE ERRORES */}
      <div className="mt-6 bg-slate-900 text-slate-300 p-4 rounded font-mono text-xs h-48 overflow-y-auto border border-slate-700 shadow-inner">
        {logs.length === 0 ? (
            <span className="opacity-50">Esperando inicio...</span>
        ) : (
            logs.map((log, i) => (
                <div key={i} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                    {log}
                </div>
            ))
        )}
      </div>
    </div>
  )
}