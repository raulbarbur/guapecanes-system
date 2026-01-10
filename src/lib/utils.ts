// src/lib/utils.ts

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD respetando la zona horaria local.
 * Útil para filtrar consultas de base de datos sin errores de UTC.
 */
export function getLocalDateISO() {
  const now = new Date()
  
  // Forzamos zona horaria Argentina (GMT-3)
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  
  // Usamos Intl nativo de JS (no requiere librerías)
  const formatter = new Intl.DateTimeFormat('es-AR', options)
  const parts = formatter.formatToParts(now)
  
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  return `${year}-${month}-${day}`
}

/**
 * Devuelve objetos Date de inicio y fin del día LOCAL
 */
export function getLocalDayRange(dateStr?: string) {
    const targetDate = dateStr || getLocalDateISO()
    
    // Inicio del día: YYYY-MM-DDT00:00:00
    const start = new Date(`${targetDate}T00:00:00`)
    
    // Fin del día: YYYY-MM-DDT23:59:59
    const end = new Date(`${targetDate}T23:59:59`)
    
    return { start, end, dateStr: targetDate }
}