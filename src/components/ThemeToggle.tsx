"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Esperar a que el cliente monte para evitar error de hidratación
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        p-2 rounded-full transition-all duration-300
        bg-secondary hover:bg-primary text-secondary-foreground hover:scale-110 shadow-lg
      "
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  )
}