// src/components/MainNav.tsx
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
<<<<<<< HEAD
import { logout } from "@/actions/auth-actions" // 👈 Importamos la acción
=======
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
>>>>>>> origin/feature/frontend-ui

export default function MainNav() {
  const pathname = usePathname()

  const routes = [
    { href: "/dashboard", label: "Inicio", icon: "🏠", exact: true },
    { href: "/pos", label: "Caja", icon: "🛍️", exact: true, highlight: true },
    { href: "/agenda", label: "Agenda", icon: "📅", exact: false },
<<<<<<< HEAD
    { href: "/sales", label: "Ventas", icon: "🗂️", exact: false },
    { href: "/products", label: "Productos", icon: "📦", exact: false },
    { href: "/pets", label: "Clientes", icon: "🐶", exact: false },
    { href: "/owners", label: "Consign.", icon: "👥", exact: false },
    { href: "/owners/balance", label: "Finanzas", icon: "⚖️", exact: true },
    { href: "/admin/users", label: "Equipo", icon: "🛡️", exact: false },
=======
    { href: "/sales", label: "Ventas", icon: "🧾", exact: false },
    { href: "/products", label: "Stock", icon: "🦴", exact: false },
    { href: "/pets", label: "Mascotas", icon: "🐶", exact: false },
    { href: "/owners", label: "Dueños", icon: "👥", exact: false },
    { href: "/owners/balance", label: "Finanzas", icon: "💎", exact: true },
>>>>>>> origin/feature/frontend-ui
  ]

  return (
    <>
<<<<<<< HEAD
      {/* ==============================================
          ESTILO ESCRITORIO (Sidebar Izquierda)
         ============================================== */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-gray-300 border-r border-slate-800 h-screen sticky top-0 overflow-y-auto">
=======
      {/* === DESKTOP SIDEBAR === */}
      <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border h-screen sticky top-0 z-50 transition-colors duration-300">
>>>>>>> origin/feature/frontend-ui
        
        {/* LOGO */}
        <div className="p-8 pb-6">
          <h1 className="text-3xl font-black font-nunito tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-foreground animate-in fade-in">
            GUAPECANES
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">
            Sistema Profesional v3
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
          {routes.map((route) => {
            const isActive = route.exact 
                ? pathname === route.href
                : pathname.startsWith(route.href)

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group relative",
                  
                  // 1. ESTILO BOTÓN DESTACADO (CAJA) - Degradado Primario
                  route.highlight 
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] justify-center text-base mb-6"
                    
                  // 2. ESTILO ACTIVO - Tinte suave del color primario
                  : isActive 
                        ? "bg-primary/10 text-primary" 
                        
                  // 3. ESTILO INACTIVO - Color muted
                        : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                )}
              >
                <span className={cn("text-xl transition-transform group-hover:scale-110", route.highlight && "animate-pulse")}>
                    {route.icon}
                </span>
                {route.label}
                
                {/* Indicador de Activo (Puntito) */}
                {!route.highlight && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

<<<<<<< HEAD
        {/* FOOTER DEL SIDEBAR CON LOGOUT */}
        <div className="p-4 border-t border-slate-800">
            <div className="mb-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Estado</p>
                <div className="flex items-center justify-center gap-2 text-xs text-green-400 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                </div>
=======
        {/* FOOTER & TOGGLE */}
        <div className="p-4 border-t border-border">
            <div className="flex justify-between items-center bg-background/50 p-3 rounded-2xl border border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
                        ST
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground">Staff Turno</p>
                        <p className="text-[10px] text-green-500 font-bold uppercase">● Online</p>
                    </div>
                </div>
                {/* Aquí integramos el Toggle que creamos antes */}
                <ThemeToggle />
>>>>>>> origin/feature/frontend-ui
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

      {/* === MOBILE NAV === */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe pt-2 px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center">
            {routes.slice(0, 5).map((route) => {
                const isActive = route.exact ? pathname === route.href : pathname.startsWith(route.href)
                
                // Botón flotante central en móvil
                if (route.highlight) {
                    return (
                        <Link key={route.href} href={route.href} className="relative -top-6">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-2xl shadow-lg shadow-primary/40 border-4 border-background text-primary-foreground">
                                {route.icon}
                            </div>
                        </Link>
                    )
                }

<<<<<<< HEAD
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

=======
                return (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                    )}
                >
                    <span className="text-xl mb-0.5">{route.icon}</span>
                    <span className="text-[9px]">{route.label}</span>
                </Link>
                )
            })}
             <div className="p-2 opacity-80"><ThemeToggle /></div>
        </div>
>>>>>>> origin/feature/frontend-ui
      </nav>
    </>
  )
}