import { describe, expect, it } from 'vitest'
import { formatARS, formatARSCompact, sumMoney, toAmountString } from './money'

describe('money', () => {
  it('suma sin pérdida de precisión de punto flotante', () => {
    // 0.1 + 0.2 !== 0.3 en float; con decimal.js debe cerrar exacto.
    expect(sumMoney(['0.10', '0.20']).toString()).toBe('0.3')
  })

  it('suma importes grandes de ventas de ejemplo', () => {
    expect(sumMoney(['4000000.00', '3000000.00']).toString()).toBe('7000000')
  })

  it('normaliza a string con 2 decimales para numeric(18,2)', () => {
    expect(toAmountString('12000000')).toBe('12000000.00')
    expect(toAmountString(1234.5)).toBe('1234.50')
  })

  it('formatea en pesos argentinos', () => {
    const out = formatARS('12000000')
    expect(out).toContain('12.000.000')
    expect(out).toMatch(/\$/)
  })

  it('formato compacto para KPIs', () => {
    expect(formatARSCompact('850000')).toBe('$850 mil')
    expect(formatARSCompact('1250000')).toBe('$1,25 M')
    expect(formatARSCompact('12000000')).toBe('$12 M')
    expect(formatARSCompact('125500000')).toBe('$125,5 M')
    // Montos chicos: valor completo (con separadores es-AR)
    expect(formatARSCompact('500')).toContain('500')
  })
})
