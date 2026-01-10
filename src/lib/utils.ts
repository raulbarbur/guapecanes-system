// src/lib/utils.ts

/**
 * Devuelve la fecha actual en Argentina (GMT-3) en formato YYYY-MM-DD.
 * Útil para inputs type="date".
 */
export function getLocalDateISO() {
  const now = new Date()
  
  // Ajuste manual a GMT-3 (Argentina)
  // getTimezoneOffset() devuelve minutos. Argentina es UTC-3 (180 min).
  // Pero para estar 100% seguros independientemente del servidor, forzamos el cálculo:
  const ARGENTINA_OFFSET = -3 * 60 * 60 * 1000 // -3 horas en milisegundos
  
  // Obtenemos el tiempo UTC actual y le restamos 3 horas
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const argentinaTime = new Date(utc + ARGENTINA_OFFSET)
  
  return argentinaTime.toISOString().split('T')[0]
}

/**
 * Convierte un string "YYYY-MM-DD" y una hora "HH:MM" en un objeto Date
 * que representa ese momento EXACTO en Argentina (GMT-3).
 * El servidor lo guardará como UTC, pero el punto en el tiempo será el correcto.
 */
export function buildArgentinaDate(dateStr: string, timeStr: string = "00:00:00"): Date {
    // Si timeStr viene solo como "14:30", le agregamos segundos para cumplir formato ISO
    const timeFull = timeStr.length === 5 ? `${timeStr}:00` : timeStr
    
    // Construimos ISO forzando el offset "-03:00"
    const isoString = `${dateStr}T${timeFull}-03:00`
    
    return new Date(isoString)
}

/**
 * Devuelve el rango de inicio y fin de un día en Argentina.
 * Útil para filtros de base de datos (Prisma gte/lte).
 */
export function getArgentinaDayRange(dateStr?: string) {
    const targetDate = dateStr || getLocalDateISO()
    
    // Inicio del día: 00:00:00.000
    const start = buildArgentinaDate(targetDate, "00:00:00")
    
    // Fin del día: 23:59:59.999
    // Nota: Usamos buildArgentinaDate base y ajustamos manual o pasamos hora final
    // Para mayor precisión, seteamos la hora final
    const end = new Date(buildArgentinaDate(targetDate, "23:59:59").getTime() + 999)
    
    return { start, end, dateStr: targetDate }
}