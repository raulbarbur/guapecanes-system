// src/components/SearchInput.tsx
'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"

export default function SearchInput({ placeholder, className }: { placeholder: string, className?: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  
  const [term, setTerm] = useState(searchParams.get('query')?.toString() || '')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      const currentQueryInUrl = params.get('query') || ''
      
      if (currentQueryInUrl === term) return

      if (term) {
        params.set('query', term)
      } else {
        params.delete('query')
      }
      
      replace(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [term, searchParams, pathname, replace])

  return (
    <div className={cn("relative flex flex-1 flex-shrink-0", className)}>
      <label htmlFor="search" className="sr-only">Buscar</label>
      <input
        className="peer block w-full rounded-2xl border border-input bg-background py-3 pl-10 text-sm outline-none text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition shadow-sm"
        placeholder={placeholder}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground peer-focus:text-primary transition-colors"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    </div>
  )
}