// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind CSS de forma inteligente.
 * Resuelve conflictos (ej: si pasas 'bg-red-500' y luego 'bg-blue-500', gana el último).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * FE-05: Formateador de moneda unificado.
 * Maneja tanto números puros como objetos Decimal de Prisma.
 */
export function formatCurrency(value: number | string | object): string {
  // Conversión segura a número
  const numberValue = Number(value)

  if (isNaN(numberValue)) return "$0"

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0, // Evita centavos si son .00 (más limpio)
    maximumFractionDigits: 2,
  }).format(numberValue)
}

/**
 * Devuelve la fecha actual en Argentina (GMT-3) en formato YYYY-MM-DD.
 * Útil para establecer el valor por defecto en inputs type="date".
 */
export function getLocalDateISO(): string {
  const now = new Date()
  const offsetMs = -3 * 60 * 60 * 1000
  const argentinaTime = new Date(now.getTime() + offsetMs)
  return argentinaTime.toISOString().split('T')[0]
}

/**
 * Construye un objeto Date asegurando que sea interpretado como GMT-3 (Argentina).
 * Prisma guardará esto en UTC, pero la conversión será correcta.
 */
export function buildArgentinaDate(dateStr: string, timeStr: string = "00:00:00"): Date {
  const timeFull = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  const isoString = `${dateStr}T${timeFull}-03:00`
  return new Date(isoString)
}

/**
 * Devuelve el rango de inicio y fin de un día específico en Argentina.
 * Se usa para buscar en la base de datos (ej: "Dames los turnos de hoy").
 */
export function getArgentinaDayRange(dateStr?: string) {
  const targetDate = dateStr || getLocalDateISO()
  
  // Inicio del día: 00:00:00.000 GMT-3
  const start = buildArgentinaDate(targetDate, "00:00:00")
  
  // Fin del día: 23:59:59.999 GMT-3
  // Sumamos casi 24hs (menos 1ms) al inicio
  const end = new Date(start.getTime() + (24 * 60 * 60 * 1000) - 1)
  
  return { start, end, dateStr: targetDate }
}