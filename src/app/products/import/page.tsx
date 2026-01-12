// src/app/products/import/page.tsx
import ExcelImporter from "@/components/ExcelImporter"
import ExportButtons from "@/components/ExportButtons" // 👈 Importamos
import Link from "next/link"

export default function ImportPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/products" className="text-blue-600 hover:underline mb-4 block font-bold text-sm">
        ← Volver a Productos
      </Link>
      
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Centro de Carga Masiva</h1>
        <p className="text-gray-500">Administrá tu inventario usando Excel.</p>
      </div>

      {/* SECCIÓN 1: DESCARGAS (NUEVO) */}
      <ExportButtons />

      <hr className="my-8 border-gray-200" />

      {/* SECCIÓN 2: IMPORTADOR (EXISTENTE) */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Subir Archivo Modificado</h2>
      <ExcelImporter />
    </div>
  )
}