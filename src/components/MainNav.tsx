'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./ThemeToggle"
import { logout } from "@/actions/auth-actions"

export default function MainNav() {
  const pathname = usePathname()
  
  // 🛑 FIX: Si estamos en el login, no renderizamos nada (return null)
  // Esto permite que el formulario de login ocupe toda la pantalla y se centre.
  if (pathname === "/login") return null

  // Estado local para colapso
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState === "true") {
      setIsCollapsed(true)
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const routes = [
    { href: "/dashboard", label: "Inicio", icon: "🏠", exact: true },
    { href: "/pos", label: "Caja", icon: "🛍️", exact: true, highlight: true },
    { href: "/agenda", label: "Agenda", icon: "📅", exact: false },
    { href: "/sales", label: "Ventas", icon: "🧾", exact: false },
    { href: "/customers", label: "Clientes", icon: "👤", exact: false }, 
    { href: "/products", label: "Stock", icon: "📦", exact: false },
    { href: "/pets", label: "Mascotas", icon: "🐶", exact: false },
    { href: "/owners", label: "Dueños", icon: "👥", exact: false },
    { href: "/owners/balance", label: "Finanzas", icon: "💎", exact: true },
    { href: "/admin/users", label: "Equipo", icon: "🛡️", exact: false },
  ]

  // Si no está montado, renderizamos placeholder para evitar layout shift
  if (!isMounted) return <div className="hidden md:flex w-72 h-screen bg-card" />

  return (
    <>
      {/* === DESKTOP SIDEBAR === */}
      <aside 
        className={cn(
            "hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-72"
        )}
      >
        
        {/* LOGO */}
        <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed ? "p-4 justify-center" : "p-8 pb-6"
        )}>
          {isCollapsed ? (
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl shadow-lg cursor-pointer" onClick={toggleSidebar}>
                🐶
             </div>
          ) : (
             <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-3xl font-black font-nunito tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-foreground animate-in fade-in">
                    GUAPECANES
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest truncate">
                    Sistema Profesional v3
                </p>
             </div>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 space-y-2 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {routes.map((route) => {
            const isActive = route.exact 
                ? pathname === route.href
                : pathname.startsWith(route.href)

            return (
              <Link
                key={route.href}
                href={route.href}
                title={isCollapsed ? route.label : undefined}
                className={cn(
                  "flex items-center transition-all duration-200 group relative",
                  isCollapsed ? "justify-center p-3 rounded-xl" : "gap-4 px-4 py-3 rounded-2xl",
                  "text-sm font-bold",
                  route.highlight 
                    ? cn(
                        "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] mb-6",
                        isCollapsed ? "rounded-2xl aspect-square" : "justify-center text-base"
                      )
                    : isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                )}
              >
                <span className={cn(
                    "transition-transform group-hover:scale-110 shrink-0", 
                    route.highlight && "animate-pulse",
                    isCollapsed ? "text-2xl" : "text-xl"
                )}>
                    {route.icon}
                </span>
                
                <span className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-300",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                    {route.label}
                </span>
                
                {!isCollapsed && !route.highlight && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}

                {isCollapsed && isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-card" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-3 border-t border-border space-y-3 shrink-0">
            <div className={cn(
                "flex items-center bg-background/50 rounded-2xl border border-border transition-all duration-300",
                isCollapsed ? "flex-col gap-2 p-2 bg-transparent border-none" : "justify-between p-3"
            )}>
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold shrink-0">
                            ST
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">Staff</p>
                            <p className="text-[10px] text-green-500 font-bold uppercase truncate">● Online</p>
                        </div>
                    </div>
                ) : (
                     <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold shrink-0" title="Staff Online">
                        ST
                    </div>
                )}
                
                <ThemeToggle />
            </div>

            <form action={logout}>
                <button 
                    type="submit"
                    className={cn(
                        "flex items-center justify-center gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition text-xs font-bold",
                        isCollapsed ? "w-full p-2 rounded-xl" : "w-full py-2 rounded-xl"
                    )}
                    title="Cerrar Sesión"
                >
                    <span className="text-lg">🚪</span> 
                    {!isCollapsed && <span>Cerrar Sesión</span>}
                </button>
            </form>

            <button 
                onClick={toggleSidebar}
                className="w-full h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors text-lg font-black"
            >
                {isCollapsed ? "»" : "«"}
            </button>
        </div>
      </aside>

      {/* === MOBILE NAV === */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border pb-safe pt-2 px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center">
            {routes.slice(0, 5).map((route) => {
                const isActive = route.exact ? pathname === route.href : pathname.startsWith(route.href)
                
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