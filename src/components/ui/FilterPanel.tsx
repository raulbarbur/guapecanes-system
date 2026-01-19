'use client'

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FilterPanelProps {
  children: ReactNode
  activeFilters?: string[] // Lista de textos para los chips (ej: "Desde: 2023-01-01")
  title?: string
}

export function FilterPanel({ children, activeFilters = [], title = "Filtros" }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn(
      "border rounded-2xl transition-all duration-200 bg-card overflow-hidden",
      isOpen ? "border-primary/50 shadow-md" : "border-border shadow-sm"
    )}>
      {/* CABECERA (Siempre visible) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 gap-3">
        
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition select-none",
                    isOpen 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
            >
                <span>{isOpen ? "✕" : "🔍"}</span>
                <span>{title}</span>
            </button>

            {/* Chips de filtros activos (Visibles en desktop siempre, en mobile solo si cerrado) */}
            {activeFilters.length > 0 && (
                <div className={cn(
                    "flex flex-wrap gap-2 transition-opacity duration-200",
                    isOpen ? "opacity-50 grayscale" : "opacity-100"
                )}>
                    {activeFilters.map((filter, idx) => (
                        <span key={idx} className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                            {filter}
                        </span>
                    ))}
                </div>
            )}
        </div>

        {/* Mensaje de ayuda o contador (Opcional) */}
        {!isOpen && activeFilters.length === 0 && (
            <p className="text-xs text-muted-foreground hidden md:block animate-pulse">
                Desplegá para buscar por fecha o método...
            </p>
        )}
      </div>
      
      {/* CUERPO DEL FORMULARIO (Plegable) */}
      {isOpen && (
        <div className="p-4 pt-0 border-t border-dashed border-border mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="pt-4">
                {children}
            </div>
        </div>
      )}
    </div>
  )
}