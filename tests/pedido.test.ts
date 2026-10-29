import { describe, expect, it } from 'vitest'
import { resumenPedido, subtotal, type ItemCarrito, type PrecioProducto } from '../src/lib/pedido'

const aura: PrecioProducto = { id: 'aura', precio: 23990, precio_pack: 40990, unidades_pack: 2, consultar_precio: false }
const naxos: PrecioProducto = { id: 'naxos', precio: 45000, precio_pack: null, unidades_pack: null, consultar_precio: false }
const cartera: PrecioProducto = { id: 'cartera-2', precio: 0, precio_pack: null, unidades_pack: null, consultar_precio: true }
const catalogo = [aura, naxos, cartera]

const item = (producto_id: string, cantidad: number, color_id: string | null = null): ItemCarrito => ({ producto_id, color_id, cantidad })

describe('subtotal con pack Aura', () => {
  it('1 unidad: precio normal', () => expect(subtotal(aura, 1)).toBe(23990))
  it('2 unidades: precio pack', () => expect(subtotal(aura, 2)).toBe(40990))
  it('3 unidades: pack + 1', () => expect(subtotal(aura, 3)).toBe(40990 + 23990))
  it('0 unidades: 0', () => expect(subtotal(aura, 0)).toBe(0))
})

describe('resumenPedido', () => {
  it('el pack se arma con colores distintos', () => {
    const r = resumenPedido([item('aura', 1, 'burdeo'), item('aura', 1, 'dorado')], catalogo)
    expect(r).toEqual({ unidades: 2, total: 40990, hayConsultar: false })
  })

  it('mezcla de productos (ejemplo del plan §7)', () => {
    const r = resumenPedido([item('naxos', 1, 'rojo'), item('aura', 2)], catalogo)
    expect(r.total).toBe(85990)
    expect(r.unidades).toBe(3)
  })

  it('"Consultar precio" no suma al total pero se marca', () => {
    const r = resumenPedido([item('naxos', 1), item('cartera-2', 1)], catalogo)
    expect(r).toEqual({ unidades: 2, total: 45000, hayConsultar: true })
  })

  it('ignora productos que ya no están en el catálogo', () => {
    const r = resumenPedido([item('naxos', 1), item('borrado', 3)], catalogo)
    expect(r).toEqual({ unidades: 1, total: 45000, hayConsultar: false })
  })

  it('carrito vacío', () => {
    expect(resumenPedido([], catalogo)).toEqual({ unidades: 0, total: 0, hayConsultar: false })
  })
})
