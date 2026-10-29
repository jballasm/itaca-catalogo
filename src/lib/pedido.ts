// Cálculo del pedido: packs y "Consultar precio". Lógica pura (tests/pedido.test.ts).
import type { Producto } from './types'

export type PrecioProducto = Pick<Producto, 'id' | 'precio' | 'precio_pack' | 'unidades_pack' | 'consultar_precio'>

/** Una línea del carrito. Los precios no se guardan: salen del catálogo actual. */
export interface ItemCarrito {
  producto_id: string
  color_id: string | null
  cantidad: number
}

/**
 * Subtotal aplicando el precio de pack por cada grupo completo (Aura: 2 por $40.990).
 * Copiado de Ítaca Finanzas (src/ventas/calculo.ts) para que ambas apps cobren igual.
 */
export function subtotal(p: Pick<Producto, 'precio' | 'precio_pack' | 'unidades_pack'>, cantidad: number): number {
  if (cantidad <= 0) return 0
  if (p.precio_pack != null && p.unidades_pack && p.unidades_pack > 1) {
    const packs = Math.floor(cantidad / p.unidades_pack)
    return packs * p.precio_pack + (cantidad - packs * p.unidades_pack) * p.precio
  }
  return cantidad * p.precio
}

/** Unidades por producto, sumando todos sus colores (el pack se arma con colores distintos). */
export function cantidadesPorProducto(items: ItemCarrito[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const it of items) m.set(it.producto_id, (m.get(it.producto_id) ?? 0) + it.cantidad)
  return m
}

export interface ResumenPedido {
  unidades: number
  /** Solo productos con precio. */
  total: number
  /** Hay al menos un producto "Consultar precio". */
  hayConsultar: boolean
}

/** Ignora ítems de productos que ya no están en el catálogo. */
export function resumenPedido(items: ItemCarrito[], productos: PrecioProducto[]): ResumenPedido {
  const porId = new Map(productos.map((p) => [p.id, p]))
  let unidades = 0
  let total = 0
  let hayConsultar = false
  for (const [id, q] of cantidadesPorProducto(items)) {
    const p = porId.get(id)
    if (!p || q <= 0) continue
    unidades += q
    if (p.consultar_precio) hayConsultar = true
    else total += subtotal(p, q)
  }
  return { unidades, total, hayConsultar }
}
