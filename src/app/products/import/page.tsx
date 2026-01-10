import ExcelImporter from "@/components/ExcelImporter"
import Link from "next/link"

export default function ImportPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/products" className="text-blue-600 hover:underline mb-4 block">
        ← Volver a Productos
      </Link>
      <h1 className="text-3xl font-bold mb-8">Asistente de Importación</h1>
      <ExcelImporter />
    </div>
  )
}