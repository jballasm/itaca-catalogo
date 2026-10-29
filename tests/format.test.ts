import { describe, expect, it } from 'vitest'
import { fechaCorta, formatCLP } from '../src/lib/format'

describe('formatCLP', () => {
  it('formatea con punto de miles y sin decimales', () => {
    expect(formatCLP(45000)).toBe('$45.000')
    expect(formatCLP(40990)).toBe('$40.990')
    expect(formatCLP(0)).toBe('$0')
  })

  it('redondea', () => {
    expect(formatCLP(3499.6)).toBe('$3.500')
  })
})

describe('fechaCorta', () => {
  it('acepta fecha o timestamp', () => {
    expect(fechaCorta('2026-10-18')).toBe('18 oct')
    expect(fechaCorta('2026-01-05T14:30:00Z')).toBe('5 ene')
  })
})
