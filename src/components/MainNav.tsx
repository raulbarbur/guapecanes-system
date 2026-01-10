// src/components/MainNav.tsx
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MainNav() {
  const pathname = usePathname()

  // Definimos las rutas del sistema
  const routes = [
    { href: "/dashboard", label: "📊 Dashboard", exact: true },
    { href: "/agenda", label: "📅 Agenda", exact: false },
    { href: "/pos", label: "💰 CAJA", exact: true, highlight: true }, // Resaltado especial
    { href: "/sales", label: "🗂️ Ventas", exact: false },
    { href: "/products", label: "📦 Productos", exact: false },
    { href: "/pets", label: "🐶 Clientes", exact: false },
    { href: "/owners", label: "👥 Consignantes", exact: false }, // Usamos emoji aproximado
    // Sub-ruta importante que queremos tener a mano
    { href: "/owners/balance", label: "⚖️ Finanzas", exact: true },
  ]

  return (
    <nav className="bg-slate-900 text-gray-300 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between overflow-x-auto">
          
          {/* LOGO / NOMBRE */}
          <div className="flex-shrink-0 font-bold text-white text-xl tracking-tight mr-8">
            GUAPECANES
          </div>

          {/* LISTA DE ENLACES */}
          <div className="flex space-x-2">
            {routes.map((route) => {
              // Lógica para saber si el link está activo
              const isActive = route.exact 
                ? pathname === route.href
                : pathname.startsWith(route.href)

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                    ${route.highlight 
                        ? 'bg-green-600 text-white hover:bg-green-500 shadow-md shadow-green-900/20' // Estilo botón Caja
                        : isActive 
                            ? 'bg-slate-800 text-white' // Estilo Activo normal
                            : 'hover:bg-slate-800 hover:text-white' // Estilo Inactivo
                    }
                  `}
                >
                  {route.label}
                </Link>
              )
            })}
          </div>
          
        </div>
      </div>
    </nav>
  )
}