const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/** $1.234.567 (sin decimales). */
export function formatCLP(monto: number): string {
  return clp.format(Math.round(monto)).replace(/\s/g, '')
}

export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-10-18" → "18 oct" */
export function fechaCorta(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MESES_CORTOS[m - 1]}`
}
