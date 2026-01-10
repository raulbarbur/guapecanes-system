// src/lib/utils.ts

/**
 * Devuelve la fecha actual en Argentina (GMT-3) en formato YYYY-MM-DD.
 * Funciona igual en Vercel, Railway o tu PC local.
 */
export function getLocalDateISO() {
  const now = new Date()
  
  // 1. Obtenemos el tiempo UTC puro en milisegundos
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  
  // 2. Restamos 3 horas (Offset Argentina)
  const ARGENTINA_OFFSET = -3
  const argentinaTime = new Date(utcTime + (3600000 * ARGENTINA_OFFSET))
  
  // 3. Formateamos a ISO (Al haber ajustado el tiempo manualmente, el ISO sale con el día correcto)
  return argentinaTime.toISOString().split('T')[0]
}

/**
 * Devuelve objetos Date de inicio y fin del día LOCAL
 */
export function getLocalDayRange(dateStr?: string) {
    const targetDate = dateStr || getLocalDateISO()
    
    // Al agregar la hora explícita T00:00:00, JS entiende que es hora LOCAL del sistema, no UTC.
    const start = new Date(`${targetDate}T00:00:00`)
    const end = new Date(`${targetDate}T23:59:59`)
    
    return { start, end, dateStr: targetDate }
}