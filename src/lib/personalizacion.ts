// Personalización (plan §7): mensaje y reglas del formulario. Lógica pura (tests/personalizacion.test.ts).

export const IDEA_MAX = 1500
/** Como mucho una solicitud guardada por minuto en cada navegador (anti-spam simple, plan §6.3). */
export const ESPERA_MS = 60_000

/** Limpia la idea (espacios al final de cada línea, líneas vacías repetidas) y la valida. */
export function validarIdea(texto: string): { idea: string } | { error: string } {
  const idea = texto
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!idea) return { error: 'Cuéntanos tu idea' }
  if (idea.length > IDEA_MAX) return { error: `Máximo ${IDEA_MAX} caracteres` }
  return { idea }
}

export function armarMensajePersonalizacion(idea: string, urlFoto: string | null): string {
  return ['¡Hola Tere! Quiero una pieza personalizada:', idea, ...(urlFoto ? [`Foto de referencia: ${urlFoto}`] : [])].join('\n')
}

/** ¿Se puede guardar otra solicitud? (`ultimo`: hora de la anterior en ms, o null). */
export function puedeGuardar(ultimo: number | null, ahora: number): boolean {
  return ultimo === null || !Number.isFinite(ultimo) || ahora - ultimo >= ESPERA_MS || ahora < ultimo
}
