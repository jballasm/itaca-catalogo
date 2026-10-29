import { describe, expect, it } from 'vitest'
import { linkWhatsApp } from '../src/lib/catalogo'
import { armarMensajePersonalizacion, ESPERA_MS, IDEA_MAX, puedeGuardar, validarIdea } from '../src/lib/personalizacion'

const FOTO = 'https://ejemplo.supabase.co/storage/v1/object/public/referencias/0b8e5f0c-1a2b-4c3d-8e9f-0123456789ab.jpg'

describe('mensaje de personalización (plan §7)', () => {
  it('con foto de referencia', () => {
    expect(armarMensajePersonalizacion('Unos aros como Náxos, en azul, para el 20 de diciembre', FOTO)).toBe(
      [
        '¡Hola Tere! Quiero una pieza personalizada:',
        'Unos aros como Náxos, en azul, para el 20 de diciembre',
        `Foto de referencia: ${FOTO}`,
      ].join('\n'),
    )
  })

  it('sin foto no lleva la última línea', () => {
    const m = armarMensajePersonalizacion('Una pulsera dorada', null)
    expect(m).toBe('¡Hola Tere! Quiero una pieza personalizada:\nUna pulsera dorada')
  })

  it('el link de WhatsApp conserva tildes, ¡ y saltos de línea', () => {
    const m = armarMensajePersonalizacion('Aros rojos\npara mi mamá', FOTO)
    const url = linkWhatsApp({ whatsapp: '56911111111' } as never, m)
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(m)
  })
})

describe('validarIdea', () => {
  it('limpia espacios y líneas vacías repetidas, conserva saltos de línea', () => {
    expect(validarIdea('  Aros azules   \r\n\r\n\r\n\r\npara el 20  \n')).toEqual({ idea: 'Aros azules\n\npara el 20' })
  })

  it('vacía o solo espacios → error', () => {
    expect(validarIdea('')).toEqual({ error: 'Cuéntanos tu idea' })
    expect(validarIdea('   \n  ')).toEqual({ error: 'Cuéntanos tu idea' })
  })

  it(`máximo ${IDEA_MAX} caracteres`, () => {
    expect(validarIdea('a'.repeat(IDEA_MAX))).toEqual({ idea: 'a'.repeat(IDEA_MAX) })
    expect(validarIdea('a'.repeat(IDEA_MAX + 1))).toEqual({ error: `Máximo ${IDEA_MAX} caracteres` })
  })
})

describe('puedeGuardar (1 por minuto)', () => {
  const t = 1_000_000
  it('primera vez sí', () => expect(puedeGuardar(null, t)).toBe(true))
  it('antes de un minuto no', () => expect(puedeGuardar(t, t + ESPERA_MS - 1)).toBe(false))
  it('después de un minuto sí', () => expect(puedeGuardar(t, t + ESPERA_MS)).toBe(true))
  it('si el reloj del celular retrocede, sí', () => expect(puedeGuardar(t, t - 5000)).toBe(true))
})
