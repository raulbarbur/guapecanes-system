// src/components/MainNav.tsx
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { logout } from "@/actions/auth-actions" // 👈 Backend Logic preservada

export default function MainNav() {
  const pathname = usePathname()

  const routes = [
    { href: "/dashboard", label: "Inicio", icon: "🏠", exact: true },
    { href: "/pos", label: "Caja", icon: "🛍️", exact: true, highlight: true },
    { href: "/agenda", label: "Agenda", icon: "📅", exact: false },
    { href: "/sales", label: "Ventas", icon: "🧾", exact: false },
    { href: "/products", label: "Stock", icon: "📦", exact: false }, // Icono ajustado
    { href: "/pets", label: "Mascotas", icon: "🐶", exact: false },
    { href: "/owners", label: "Dueños", icon: "👥", exact: false },
    { href: "/owners/balance", label: "Finanzas", icon: "💎", exact: true },
    // 👇 Backend: Agregamos el link de Admin que creamos hoy
    { href: "/admin/users", label: "Equipo", icon: "🛡️", exact: false },
  ]

  return (
    <>
      {/* === DESKTOP SIDEBAR === */}
      <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border h-screen sticky top-0 z-50 transition-colors duration-300">
        
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
                  
                  // 1. ESTILO BOTÓN DESTACADO (CAJA)
                  route.highlight 
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] justify-center text-base mb-6"
                    
                  // 2. ESTILO ACTIVO
                  : isActive 
                        ? "bg-primary/10 text-primary" 
                        
                  // 3. ESTILO INACTIVO
                        : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                )}
              >
                <span className={cn("text-xl transition-transform group-hover:scale-110", route.highlight && "animate-pulse")}>
                    {route.icon}
                </span>
                {route.label}
                
                {/* Indicador de Activo */}
                {!route.highlight && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER & TOGGLE & LOGOUT */}
        <div className="p-4 border-t border-border space-y-3">
            
            {/* Info Usuario + Theme Toggle */}
            <div className="flex justify-between items-center bg-background/50 p-3 rounded-2xl border border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold">
                        ST
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground">Staff</p>
                        <p className="text-[10px] text-green-500 font-bold uppercase">● Online</p>
                    </div>
                </div>
                <ThemeToggle />
            </div>

            {/* Botón Logout (Integrado al diseño UI) */}
            <form action={logout}>
                <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive py-2 rounded-xl transition text-xs font-bold"
                >
                    <span>🚪</span> Cerrar Sesión
                </button>
            </form>
        </div>
      </aside>

      {/* === MOBILE NAV === */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe pt-2 px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center">
            
            {/* Renderizamos solo los primeros 4 items + Admin si es necesario en móvil */}
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

             {/* Controles Móviles (Theme + Logout) */}
             <div className="flex flex-col gap-2 items-center opacity-80">
                <ThemeToggle />
                <form action={logout}>
                    <button type="submit" className="text-destructive text-lg" title="Salir">
                        🚪
                    </button>
                </form>
             </div>
        </div>
      </nav>
    </>
  )
}