import Decimal from 'decimal.js'

/**
 * Dinero en ARS. Regla del modelo de datos: importes `numeric(18,2)` en PostgreSQL
 * y decimal string / decimal.js en TS; NUNCA `number` para sumas críticas
 * (ver docs/03_MODELO_DATOS.md y docs/02_ARQUITECTURA_TECNICA.md).
 *
 * Esta capa no calcula impuestos ni tipo de cambio: `currency` se fija a ARS
 * mediante check en la base hasta que se valide otra moneda (D14).
 */

// Redondeo bancario a 2 decimales, coherente con el redondeo por fila de la DB.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN })

export type MoneyInput = string | number | Decimal

/** Construye un Decimal a partir de un string/numeric de la base. */
export function money(value: MoneyInput): Decimal {
  return new Decimal(value)
}

/** Suma una lista de importes sin pérdida de precisión. */
export function sumMoney(values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(new Decimal(v)), new Decimal(0))
}

/** Normaliza a string con 2 decimales, listo para enviar a `numeric(18,2)`. */
export function toAmountString(value: MoneyInput): string {
  return new Decimal(value).toFixed(2)
}

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formato de presentación en pesos argentinos. */
export function formatARS(value: MoneyInput): string {
  return arsFormatter.format(new Decimal(value).toNumber())
}

const decimalFmt = (n: number, max: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: max }).format(n)

/**
 * Monto compacto para KPIs, sin desbordar: `$850 mil`, `$1,25 M`, `$12 M`,
 * `$125,5 M`. No altera el valor original; el completo se muestra por tooltip
 * (usar `formatARS` para el title). Conserva el signo.
 */
export function formatARSCompact(value: MoneyInput): string {
  const d = new Decimal(value)
  const n = d.toNumber()
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${decimalFmt(abs / 1_000_000, 2)} M`
  if (abs >= 1_000) return `${sign}$${decimalFmt(abs / 1_000, 0)} mil`
  return formatARS(value)
}
