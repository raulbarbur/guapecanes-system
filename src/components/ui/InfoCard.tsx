'use client'

import { cn } from "@/lib/utils"

interface InfoCardProps {
  icon: string
  label: string
  value: string | null
  action?: () => void
  actionLabel?: string
  className?: string
}

export function InfoCard({ icon, label, value, action, actionLabel, className }: InfoCardProps) {
  if (!value) return null

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-sm min-w-[140px]",
      className
    )}>
      <div className="w-10 h-10 flex items-center justify-center bg-secondary text-lg rounded-full shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            {label}
        </p>
        <p className="font-bold text-sm text-foreground truncate" title={value}>
            {value}
        </p>
        {action && (
            <button 
                onClick={action}
                className="text-[10px] text-primary font-bold hover:underline mt-0.5 block"
            >
                {actionLabel || "Acción"}
            </button>
        )}
      </div>
    </div>
  )
}