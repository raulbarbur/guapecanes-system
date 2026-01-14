// src/components/MainNav.tsx
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/actions/auth-actions" // 👈 Importamos la acción

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
    { href: "/admin/users", label: "Equipo", icon: "🛡️", exact: false },
  ]

  return (
    <>
      {/* ==============================================
          ESTILO ESCRITORIO (Sidebar Izquierda)
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

        {/* FOOTER DEL SIDEBAR CON LOGOUT */}
        <div className="p-4 border-t border-slate-800">
            <div className="mb-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Estado</p>
                <div className="flex items-center justify-center gap-2 text-xs text-green-400 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                </div>
            </div>

            {/* 👇 BOTÓN DE CERRAR SESIÓN */}
            <form action={logout}>
                <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 py-2 rounded transition text-xs font-bold border border-slate-700 hover:border-red-900"
                >
                    <span>🚪</span> Cerrar Sesión
                </button>
            </form>
        </div>
      </aside>


      {/* ==============================================
          ESTILO MÓVIL (Bottom Navigation)
         ============================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex justify-between items-center px-2 py-2 safe-area-bottom shadow-2xl overflow-x-auto no-scrollbar">
        {routes.map((route) => {
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
                      ? 'bg-green-600 text-white -mt-6 h-14 w-14 rounded-full shadow-lg border-4 border-gray-50' 
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
        
        {/* Botón Salir Móvil (Pequeño al final) */}
        <form action={logout} className="min-w-[50px] flex flex-col items-center justify-center border-l border-slate-800 pl-2 ml-1">
            <button type="submit" className="text-red-500 text-xl hover:text-red-400">
                🚪
            </button>
            <span className="text-[8px] font-bold text-red-500 uppercase mt-1">Salir</span>
        </form>

      </nav>
    </>
  )
}