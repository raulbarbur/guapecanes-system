// src/components/ui/Pagination.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface PaginationProps {
  totalPages: number
  currentPage: number
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleNavigation = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) {
      return
    }
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(pageNumber))
    
    const newUrl = `${pathname}?${params.toString()}`

    // 1. Actualizar la URL en la barra de direcciones.
    router.push(newUrl)
    
    // 2. << LÍNEA CRÍTICA >> Forzar el refresco de los datos del Server Component.
    router.refresh()
  }

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  const commonButtonClass = "px-4 h-9 flex items-center justify-center rounded-lg font-bold text-xs transition border"
  const inactiveClass = "bg-card hover:bg-muted border-border"
  const disabledClass = "bg-muted text-muted-foreground border-border cursor-not-allowed"

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4 border-t border-border">
      <p className="text-xs text-muted-foreground font-bold">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleNavigation(currentPage - 1)}
          disabled={isFirstPage}
          className={cn(commonButtonClass, isFirstPage ? disabledClass : inactiveClass)}
        >
          Anterior
        </button>
        <button
          onClick={() => handleNavigation(currentPage + 1)}
          disabled={isLastPage}
          className={cn(commonButtonClass, isLastPage ? disabledClass : inactiveClass)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}