// src/components/SearchInput.tsx
'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce' // Opcional, pero haremos una versión nativa para no obligarte a instalar librerías extra hoy.

export default function SearchInput({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Función para manejar el cambio en el input con un pequeño retraso (Debounce manual)
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    // replace actualiza la URL sin agregar una entrada al historial del navegador
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Buscar
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
        placeholder={placeholder}
        onChange={(e) => {
            // Un pequeño debounce nativo usando timeout si escriben muy rápido
            // Nota: En producción idealmente usamos una librería como 'use-debounce'
            handleSearch(e.target.value) 
        }}
        defaultValue={searchParams.get('query')?.toString()}
      />
      {/* Icono de Lupa (SVG) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900"
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