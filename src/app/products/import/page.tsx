//export const dynamic = 'force-dynamic'

import ExcelImporter from "@/components/ExcelImporter"
import ExportButtons from "@/components/ExportButtons"
import Link from "next/link"
import { PageHeader } from "@/components/ui/shared/PageHeader" // Usamos el header estándar

export default function ImportPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      
      {/* Navegación Breadcrumb simple */}
      <Link 
        href="/products" 
        className="text-primary hover:underline text-xs font-bold uppercase tracking-wide flex items-center gap-1"
      >
        <span>←</span> Volver a Productos
      </Link>
      
      <PageHeader 
        title="Centro de Carga Masiva"
        description="Administrá tu inventario subiendo planillas Excel."
      />

      {/* SECCIÓN 1: DESCARGAS */}
      <div className="space-y-4">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
            1. Descargar Plantillas
          </h3>
          <ExportButtons />
      </div>

      <hr className="border-border border-dashed" />

      {/* SECCIÓN 2: IMPORTADOR */}
      <div className="space-y-4 h-full">
         <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">
            2. Subir Modificaciones
          </h3>
         <ExcelImporter />
      </div>
    </div>
  )
}