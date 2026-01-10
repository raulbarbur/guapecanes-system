// src/components/MainNav.tsx
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MainNav() {
  const pathname = usePathname()

  // Definimos las rutas
  const routes = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", exact: true },
    { href: "/pos", label: "CAJA", icon: "💰", exact: true, highlight: true },
    { href: "/agenda", label: "Agenda", icon: "📅", exact: false },
    { href: "/sales", label: "Ventas", icon: "🗂️", exact: false },
    { href: "/products", label: "Productos", icon: "📦", exact: false },
    { href: "/pets", label: "Clientes", icon: "🐶", exact: false },
    { href: "/owners", label: "Consign.", icon: "👥", exact: false },
    { href: "/owners/balance", label: "Finanzas", icon: "⚖️", exact: true },
  ]

  return (
    <>
      {/* ==============================================
          ESTILO ESCRITORIO (Sidebar Izquierda)
          Visible solo en pantallas medianas o grandes (md:flex)
         ============================================== */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-gray-300 border-r border-slate-800 h-screen sticky top-0 overflow-y-auto">
        
        {/* LOGO */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            GUAPECANES
            <span className="text-green-500">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Sistema de Gestión v3.0</p>
        </div>

        {/* LISTA DE NAVEGACIÓN VERTICAL */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {routes.map((route) => {
            const isActive = route.exact 
                ? pathname === route.href
                : pathname.startsWith(route.href)

            return (
              <Link
                key={route.href}
                href={route.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${route.highlight 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-900/20 hover:scale-105 justify-center text-base' 
                      : isActive 
                          ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
                          : 'hover:bg-slate-800 hover:text-white hover:pl-5'
                  }
                `}
              >
                <span className="text-xl">{route.icon}</span>
                {route.label}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER DEL SIDEBAR */}
        <div className="p-4 border-t border-slate-800 text-center">
            <div className="text-xs text-slate-500">
                Usuario: Staff<br/>
                <span className="text-green-500">● Online</span>
            </div>
        </div>
      </aside>


      {/* ==============================================
          ESTILO MÓVIL (Bottom Navigation)
          Visible solo en pantallas pequeñas (md:hidden)
          Fijo abajo.
         ============================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex justify-between items-center px-2 py-2 safe-area-bottom shadow-2xl">
        {routes.map((route) => {
            // En móvil mostramos menos items o íconos más grandes. 
            // Filtramos algunos si son muchos, o usamos scroll horizontal.
            // Aquí usamos scroll horizontal simple si desborda.
            const isActive = route.exact 
                ? pathname === route.href
                : pathname.startsWith(route.href)

            return (
              <Link
                key={route.href}
                href={route.href}
                className={`
                  flex flex-col items-center justify-center min-w-[60px] p-1 rounded-md transition-colors
                  ${route.highlight 
                      ? 'bg-green-600 text-white -mt-6 h-14 w-14 rounded-full shadow-lg border-4 border-gray-50' // Efecto botón flotante para CAJA
                      : isActive 
                          ? 'text-white' 
                          : 'text-slate-500 hover:text-slate-300'
                  }
                `}
              >
                <span className={`${route.highlight ? 'text-2xl' : 'text-xl'}`}>{route.icon}</span>
                {!route.highlight && (
                    <span className="text-[9px] font-bold mt-1 uppercase">{route.label.slice(0, 6)}</span>
                )}
              </Link>
            )
        })}
      </nav>
    </>
  )
}