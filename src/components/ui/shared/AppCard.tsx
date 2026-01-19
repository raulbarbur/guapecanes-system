'use client'

import { cn } from "@/lib/utils"

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  noPadding?: boolean // Para tablas que necesitan llegar al borde
  hoverEffect?: boolean // Para items clickeables
}

export function AppCard({ 
  children, 
  className, 
  noPadding = false,
  hoverEffect = false,
  ...props 
}: AppCardProps) {
  return (
    <div 
      className={cn(
        // Estilos Base (Según Auditoría: rounded-3xl para contenedores)
        "bg-card border border-border rounded-3xl shadow-sm transition-all duration-200 overflow-hidden",
        
        // Padding condicional
        !noPadding && "p-6",
        
        // Efecto Hover (útil para listas de tarjetas)
        hoverEffect && "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}