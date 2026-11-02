import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Presentación de fechas en zona America/Argentina/Cordoba.
 * Fechas comerciales/evento son `date` (sin hora); instantes de auditoría son
 * `timestamptz`. Ver docs/01_PLAN_MAESTRO.md (definiciones de indicadores).
 */
export const APP_TIME_ZONE = 'America/Argentina/Cordoba'

/** Fecha comercial `date` (YYYY-MM-DD) → "dd/MM/yyyy". */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'dd/MM/yyyy', { locale: es })
}

/** Instante `timestamptz` → "dd/MM/yyyy HH:mm" en hora de Córdoba. */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`
}
