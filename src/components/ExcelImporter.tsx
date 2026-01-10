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
      // Leemos el Excel. Asumimos columnas en orden: Nombre, Categoria, Dueño, Costo, Precio
      const data = await readXlsxFile(file)
      
      // Eliminamos la cabecera (fila 0)
      const cleanData = data.slice(1).map(row => ({
        name: row[0] as string,
        categoryName: row[1] as string,
        ownerName: row[2] as string,
        cost: Number(row[3]),
        price: Number(row[4])
      }))

      setRows(cleanData)
      setLogs(prev => [...prev, `Archivo cargado: ${cleanData.length} productos detectados.`])
    } catch (error) {
      alert("Error leyendo Excel. Asegurate que sea un .xlsx válido.")
    }
  }

  // 2. PROCESAR BUCLE (LOOP)
  const startImport = async () => {
    setProcessing(true)
    setProgress({ current: 0, total: rows.length, errors: 0 })
    setLogs([])

    let successCount = 0
    let errorCount = 0

    // BUCLE SECUENCIAL
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Validar datos mínimos antes de llamar al server
      if (!row.name || !row.ownerName) {
        setLogs(prev => [...prev, `❌ Fila ${i+2}: Faltan datos obligatorios`])
        errorCount++
        continue
      }

      // Llamada al Server Action
      const result = await importSingleProduct(row)

      if (result.success) {
        successCount++
      } else {
        errorCount++
        setLogs(prev => [...prev, `❌ Error en "${row.name}": ${result.error}`])
      }

      // Actualizar barra de progreso
      setProgress({ 
        current: i + 1, 
        total: rows.length, 
        errors: errorCount 
      })
    }

    setProcessing(false)
    setLogs(prev => [...prev, `🏁 FINALIZADO. Éxitos: ${successCount}, Errores: ${errorCount}`])
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-bold mb-4">Importación Masiva (Excel)</h2>
      
      <div className="mb-4 p-4 bg-blue-50 text-blue-800 text-sm rounded">
        <strong>Formato requerido (Columnas):</strong>
        <br />
        1. Nombre Producto | 2. Categoría | 3. Nombre Dueño | 4. Costo | 5. Precio Venta
      </div>

      {!processing && rows.length === 0 && (
        <input 
          type="file" 
          accept=".xlsx" 
          onChange={handleFile}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      )}

      {rows.length > 0 && !processing && progress.current === 0 && (
        <div className="space-y-4">
          <p className="font-bold text-lg">{rows.length} productos listos para importar.</p>
          <button 
            onClick={startImport}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-bold"
          >
            Iniciar Importación
          </button>
        </div>
      )}

      {/* BARRA DE PROGRESO */}
      {(processing || progress.current > 0) && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Progreso: {progress.current} / {progress.total}</span>
            <span className="text-red-600">Errores: {progress.errors}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* LOGS DE ERRORES */}
      <div className="mt-6 max-h-40 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded font-mono text-xs">
        {logs.length === 0 ? "Esperando log..." : logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  )
}