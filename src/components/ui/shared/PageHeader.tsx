'use client'

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode // Para botones de acción (Nuevo, Exportar, etc)
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-in slide-in-from-left-2 duration-300", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-foreground font-nunito tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground font-medium">
            {description}
          </p>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-3 w-full md:w-auto">
          {children}
        </div>
      )}
    </div>
  )
}