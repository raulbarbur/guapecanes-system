'use client'

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: string // Emoji opcional
}

export function CollapsibleSection({ title, children, defaultOpen = false, icon }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn(
      "border rounded-xl transition-all duration-200 overflow-hidden",
      isOpen ? "bg-card border-border shadow-sm" : "bg-muted/10 border-transparent"
    )}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left group"
      >
        <div className="flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            <span className={cn(
                "font-bold text-sm uppercase tracking-wide transition-colors",
                isOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
                {title}
            </span>
        </div>
        <span className={cn(
            "text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
        )}>
            ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
            {children}
        </div>
      )}
    </div>
  )
}