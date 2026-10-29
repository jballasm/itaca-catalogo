import { describe, expect, it } from 'vitest'
import {
  activoAlGuardar,
  leerMonto,
  mover,
  normalizarInstagram,
  normalizarWhatsapp,
  parsearComunas,
  slugify,
  slugUnico,
  validarProducto,
  type FormProducto,
} from '../src/tere/reglas'

const base: FormProducto = {
  nombre: 'Delos',
  categoria_producto_id: 'carteras',
  consultar: false,
  precio: '55.000',
  conPack: false,
  unidades_pack: '2',
  precio_pack: '',
  descripcion: '',
}

describe('validarProducto', () => {
  it('producto con precio', () => {
    expect(validarProducto(base, ['Sifnos'], null)).toEqual({
      nombre: 'Delos', categoria_producto_id: 'carteras', precio: 55000, consultar_precio: false,
      precio_pack: null, unidades_pack: null, descripcion: null,
    })
  })

  it('nombre obligatorio y sin repetir (sin importar tildes ni mayúsculas)', () => {
    expect(validarProducto({ ...base, nombre: '  ' }, [], null)).toBe('Ponle un nombre al producto.')
    expect(validarProducto({ ...base, nombre: 'naxos' }, ['Náxos'], null)).toBe('Ya existe un producto llamado naxos.')
  })

  it('precio obligatorio salvo "Consultar precio"', () => {
    expect(validarProducto({ ...base, precio: '' }, [], null)).toBe('Ingresa el precio o marca "Consultar precio".')
    expect(validarProducto({ ...base, precio: '0' }, [], null)).toBe('Ingresa el precio o marca "Consultar precio".')
  })

  it('"Consultar precio" conserva el precio anterior (Finanzas lo necesita) o 0 si es nuevo, y sin pack', () => {
    const nuevo = validarProducto({ ...base, consultar: true, precio: '', conPack: true }, [], null)
    expect(nuevo).toMatchObject({ precio: 0, consultar_precio: true, precio_pack: null, unidades_pack: null })
    expect(validarProducto({ ...base, consultar: true }, [], 45000)).toMatchObject({ precio: 45000, consultar_precio: true })
  })

  it('pack igual que en Finanzas', () => {
    const f = { ...base, nombre: 'Aura', precio: '23.990', conPack: true, unidades_pack: '2', precio_pack: '40.990' }
    expect(validarProducto(f, [], null)).toMatchObject({ precio: 23990, precio_pack: 40990, unidades_pack: 2 })
    expect(validarProducto({ ...f, unidades_pack: '1' }, [], null)).toBe('El pack tiene que ser de 2 o más unidades.')
    expect(validarProducto({ ...f, precio_pack: '' }, [], null)).toBe('Ingresa el precio del pack.')
    expect(validarProducto({ ...f, precio_pack: '47.980' }, [], null)).toBe('El pack debería costar menos que comprar las unidades por separado.')
  })

  it('limpia espacios del nombre y guarda la descripción', () => {
    expect(validarProducto({ ...base, nombre: '  Cartera   Delos ', descripcion: ' Tejida en algodón ' }, [], null)).toMatchObject({
      nombre: 'Cartera Delos',
      descripcion: 'Tejida en algodón',
    })
  })
})

describe('activoAlGuardar (Consultar precio ↔ Finanzas)', () => {
  it('nuevo: activo solo si tiene precio', () => {
    expect(activoAlGuardar(null, false)).toBe(true)
    expect(activoAlGuardar(null, true)).toBe(false)
  })
  it('sale de "Consultar precio" → activo (aparece en Registrar venta)', () => {
    expect(activoAlGuardar({ consultar_precio: true, activo: false }, false)).toBe(true)
  })
  it('en otros casos no se toca lo que decidió Finanzas', () => {
    expect(activoAlGuardar({ consultar_precio: false, activo: false }, false)).toBe(false)
    expect(activoAlGuardar({ consultar_precio: false, activo: true }, true)).toBe(true)
  })
})

describe('slugs', () => {
  it('igual que public.slugify', () => {
    expect(slugify('Náxos')).toBe('naxos')
    expect(slugify('Corfú')).toBe('corfu')
    expect(slugify('Cartera 1')).toBe('cartera-1')
    expect(slugify('  Penélope ')).toBe('penelope')
  })
  it('no repite', () => {
    expect(slugUnico('Delos', ['sifnos'])).toBe('delos')
    expect(slugUnico('Delos', ['delos', 'delos-2'])).toBe('delos-3')
  })
})

describe('ajustes', () => {
  it('WhatsApp chileno en cualquier formato', () => {
    expect(normalizarWhatsapp('+56 9 1234 5678')).toEqual({ valor: '56912345678' })
    expect(normalizarWhatsapp('9 1234 5678')).toEqual({ valor: '56912345678' })
    expect(normalizarWhatsapp('56912345678')).toEqual({ valor: '56912345678' })
    expect(normalizarWhatsapp('1234')).toHaveProperty('error')
  })
  it('Instagram sin @ ni link', () => {
    expect(normalizarInstagram('@itaca.cl')).toEqual({ valor: 'itaca.cl' })
    expect(normalizarInstagram('https://www.instagram.com/itaca.cl/')).toEqual({ valor: 'itaca.cl' })
    expect(normalizarInstagram('ítaca cl')).toHaveProperty('error')
  })
  it('comunas separadas por coma o línea, sin repetir', () => {
    expect(parsearComunas('Vitacura,  Las Condes\nvitacura, , Providencia')).toEqual(['Vitacura', 'Las Condes', 'Providencia'])
  })
  it('montos', () => {
    expect(leerMonto('$3.500')).toBe(3500)
    expect(leerMonto('')).toBeNull()
  })
  it('mover', () => {
    const l = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(mover(l, 1, -1)).toEqual(['b', 'a', 'c'])
    expect(mover(l, 2, 1)).toEqual(['a', 'b', 'c'])
  })
})
