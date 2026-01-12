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
 * Devuelve la fecha actual en Argentina (GMT-3) en formato YYYY-MM-DD.
 * Útil para establecer el valor por defecto en inputs type="date".
 */
export function getLocalDateISO(): string {
  // Obtenemos la fecha actual
  const now = new Date()
  
  // Forzamos el offset de Argentina (-3 horas)
  // Nota: Esto es una aproximación manual rápida para evitar librerías pesadas como date-fns-tz
  const offsetMs = -3 * 60 * 60 * 1000
  const argentinaTime = new Date(now.getTime() + offsetMs)
  
  return argentinaTime.toISOString().split('T')[0]
}

/**
 * Construye un objeto Date asegurando que sea interpretado como GMT-3 (Argentina).
 * Prisma guardará esto en UTC, pero la conversión será correcta.
 * 
 * @param dateStr Formato "YYYY-MM-DD"
 * @param timeStr Formato "HH:MM" (opcional, default 00:00)
 */
export function buildArgentinaDate(dateStr: string, timeStr: string = "00:00:00"): Date {
  // Aseguramos formato de segundos
  const timeFull = timeStr.length === 5 ? `${timeStr}:00` : timeStr
  
  // Construimos string ISO con el offset explícito de Argentina
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