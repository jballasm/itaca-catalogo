import { describe, expect, it } from 'vitest'
import { linkWhatsApp } from '../src/lib/catalogo'
import { armarMensaje, detalleRetiro, linkInstagram, linkInstagramApp, tituloRetiro } from '../src/lib/mensaje'
import { lineasPedido, resumenPedido, totalPedido, type Entrega, type ItemCarrito, type ProductoLinea } from '../src/lib/pedido'
import type { Config } from '../src/lib/types'

// Datos inventados (el número no es el de Tere).
const config: Config = {
  user_id: 'u',
  whatsapp: '56911111111',
  instagram: 'itaca.cl',
  envio_comunas: ['Vitacura', 'Las Condes', 'Lo Barnechea', 'Providencia'],
  envio_precio: 3500,
  retiro_texto: 'Retiro en Vitacura (dirección se entrega por interno)',
  starken_texto: 'Otras comunas por Starken · Tere te confirma el costo',
  personalizacion_costo: 15000,
  personalizacion_dias: 7,
}

const naxos: ProductoLinea = {
  id: 'naxos', nombre: 'Náxos', precio: 45000, precio_pack: null, unidades_pack: null, consultar_precio: false,
  colores: [{ id: 'rojo', nombre: 'Rojo' }, { id: 'burdeo', nombre: 'Burdeo' }],
}
const aura: ProductoLinea = {
  id: 'aura', nombre: 'Aura', precio: 23990, precio_pack: 40990, unidades_pack: 2, consultar_precio: false, colores: [],
}
const cartera: ProductoLinea = {
  id: 'cartera-2', nombre: 'Cartera 2', precio: 0, precio_pack: null, unidades_pack: null, consultar_precio: true, colores: [],
}
const catalogo = [naxos, aura, cartera]
const it_ = (producto_id: string, cantidad: number, color_id: string | null = null): ItemCarrito => ({ producto_id, color_id, cantidad })

function mensaje(items: ItemCarrito[], entrega: Entrega, nombre = '') {
  const total = totalPedido(resumenPedido(items, catalogo), entrega, config)
  return { total, texto: armarMensaje({ lineas: lineasPedido(items, catalogo), entrega, config, total, nombre }) }
}

describe('mensaje de WhatsApp', () => {
  it('ejemplo del plan §7: Náxos + pack Aura + envío = $89.490', () => {
    const { total, texto } = mensaje([it_('naxos', 1, 'rojo'), it_('aura', 2)], 'envio', 'Camila')
    expect(total.total).toBe(89490)
    expect(texto).toBe(
      [
        '¡Hola Tere! Quiero hacer un pedido desde el catálogo de Ítaca:',
        '· Náxos (Rojo) x1 — $45.000',
        '· Aura pack 2 — $40.990',
        'Entrega: Envío a domicilio ($3.500)',
        'Total: $89.490',
        'Nombre: Camila',
      ].join('\n'),
    )
  })

  it('los productos salen en el orden en que se agregaron', () => {
    const { texto } = mensaje([it_('aura', 2), it_('cartera-2', 1), it_('naxos', 1, 'rojo')], 'retiro')
    const lineas = texto.split('\n').filter((l) => l.startsWith('·'))
    expect(lineas.map((l) => l.split(' ')[1])).toEqual(['Aura', 'Cartera', 'Náxos'])
  })

  it('ignora productos que ya no están en el catálogo', () => {
    const { texto } = mensaje([it_('borrado', 1), it_('naxos', 1, 'rojo')], 'retiro')
    expect(texto.split('\n').filter((l) => l.startsWith('·'))).toEqual(['· Náxos (Rojo) x1 — $45.000'])
  })

  it('retiro: gratis y sin línea de nombre si no lo escribió', () => {
    const { total, texto } = mensaje([it_('naxos', 1, 'rojo')], 'retiro', '   ')
    expect(total.total).toBe(45000)
    expect(texto).toContain('Entrega: Retiro en Vitacura (gratis)')
    expect(texto).toContain('Total: $45.000')
    expect(texto).not.toContain('Nombre:')
  })

  it('Starken: no suma al total y queda por confirmar', () => {
    const { total, texto } = mensaje([it_('naxos', 1, 'rojo')], 'starken')
    expect(total).toEqual({ total: 45000, envioPorConfirmar: true, hayConsultar: false })
    expect(texto).toContain('Entrega: Otra comuna (Starken) — costo por confirmar')
    expect(texto).toContain('Total: $45.000 + envío por confirmar')
  })

  it('consultar precio: no suma al total y se marca', () => {
    const { total, texto } = mensaje([it_('naxos', 1, 'rojo'), it_('cartera-2', 1)], 'envio')
    expect(total.total).toBe(48500)
    expect(texto).toContain('· Cartera 2 — consultar precio')
    expect(texto).toContain('Total: $48.500 + productos por consultar')
  })

  it('Starken y consultar precio juntos', () => {
    const { texto } = mensaje([it_('cartera-2', 2)], 'starken')
    expect(texto).toContain('· Cartera 2 x2 — consultar precio')
    expect(texto).toContain('Total: $0 + envío por confirmar + productos por consultar')
  })

  it('Aura x3: un pack y una suelta', () => {
    const { total, texto } = mensaje([it_('aura', 3)], 'retiro')
    expect(total.total).toBe(40990 + 23990)
    expect(texto).toContain('· Aura x3 (pack 2 + 1) — $64.980')
  })

  it('Aura x4: dos packs', () => {
    expect(mensaje([it_('aura', 4)], 'retiro').texto).toContain('· Aura x4 (2 packs de 2) — $81.980')
  })

  it('varios colores del mismo producto en una línea', () => {
    const { texto } = mensaje([it_('naxos', 1, 'rojo'), it_('naxos', 2, 'burdeo')], 'retiro')
    expect(texto).toContain('· Náxos (Rojo + Burdeo x2) x3 — $135.000')
  })

  it('el nombre se limpia y se corta en 60 caracteres', () => {
    const { texto } = mensaje([it_('naxos', 1, 'rojo')], 'retiro', '  Camila   Pérez  ' + 'x'.repeat(80))
    const linea = texto.split('\n').at(-1)!
    expect(linea.startsWith('Nombre: Camila Pérez x')).toBe(true)
    expect(linea.length).toBe('Nombre: '.length + 60)
  })
})

describe('textos de retiro', () => {
  it('separa título y detalle', () => {
    expect(tituloRetiro(config)).toBe('Retiro en Vitacura')
    expect(detalleRetiro(config)).toBe('Dirección se entrega por interno')
    expect(detalleRetiro({ retiro_texto: 'Retiro en Vitacura' })).toBeNull()
  })
})

describe('links', () => {
  it('WhatsApp codifica tildes, ¡ y saltos de línea', () => {
    const { texto } = mensaje([it_('naxos', 1, 'rojo')], 'envio')
    const url = linkWhatsApp(config, texto)
    expect(url.startsWith('https://wa.me/56911111111?text=')).toBe(true)
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(texto)
    expect(url).not.toMatch(/[\n ¡á]/)
  })

  it('Instagram abre el chat de la cuenta', () => {
    expect(linkInstagram(config)).toBe('https://ig.me/m/itaca.cl')
  })

  it('en Android usa un intent a la app de Instagram con la web de respaldo', () => {
    const android = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36'
    expect(linkInstagramApp(config, android)).toBe(
      'intent://ig.me/m/itaca.cl#Intent;scheme=https;package=com.instagram.android;S.browser_fallback_url=https%3A%2F%2Fig.me%2Fm%2Fitaca.cl;end',
    )
  })

  it('en iPhone y computador usa ig.me', () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    expect(linkInstagramApp(config, iphone)).toBe('https://ig.me/m/itaca.cl')
    expect(linkInstagramApp(config, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('https://ig.me/m/itaca.cl')
  })
})
