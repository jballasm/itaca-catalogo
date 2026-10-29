// Cálculo del pedido: packs, "Consultar precio" y entrega. Lógica pura (tests/pedido.test.ts, tests/mensaje.test.ts).
import type { Config, Producto } from './types'

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

// --- Entrega y total (Fase 6) ---

export type Entrega = 'retiro' | 'envio' | 'starken'

/** Costo de la entrega: retiro gratis, envío según config, Starken por confirmar (null). */
export function costoEnvio(entrega: Entrega, config: Pick<Config, 'envio_precio'>): number | null {
  if (entrega === 'retiro') return 0
  if (entrega === 'envio') return config.envio_precio
  return null
}

export interface TotalPedido {
  /** Productos con precio + envío (si tiene costo conocido). */
  total: number
  envioPorConfirmar: boolean
  hayConsultar: boolean
}

/** Starken y "Consultar precio" no suman al total. */
export function totalPedido(resumen: ResumenPedido, entrega: Entrega, config: Pick<Config, 'envio_precio'>): TotalPedido {
  const envio = costoEnvio(entrega, config)
  return { total: resumen.total + (envio ?? 0), envioPorConfirmar: envio === null, hayConsultar: resumen.hayConsultar }
}

// --- Líneas del pedido: una por producto, con sus colores juntos (el pack se arma entre colores) ---

export type ProductoLinea = PrecioProducto & Pick<Producto, 'nombre'> & { colores: { id: string; nombre: string }[] }

export interface LineaPedido {
  producto_id: string
  nombre: string
  items: { color_id: string | null; color: string | null; cantidad: number }[]
  cantidad: number
  /** null = "Consultar precio". */
  subtotal: number | null
  /** Packs completos y unidades sueltas, si el producto tiene pack y se alcanza. */
  pack: { unidades: number; packs: number; resto: number } | null
}

/** En el orden en que la clienta agregó cada producto. Ignora productos que ya no están. */
export function lineasPedido(items: ItemCarrito[], productos: ProductoLinea[]): LineaPedido[] {
  const lineas: LineaPedido[] = []
  const porId = new Map(productos.map((p) => [p.id, p]))
  for (const id of new Set(items.map((i) => i.producto_id))) {
    const p = porId.get(id)
    const propios = items.filter((i) => i.producto_id === id && i.cantidad > 0)
    if (!p || !propios.length) continue
    const cantidad = propios.reduce((s, i) => s + i.cantidad, 0)
    const u = p.unidades_pack
    const packs = p.precio_pack != null && u && u > 1 ? Math.floor(cantidad / u) : 0
    lineas.push({
      producto_id: p.id,
      nombre: p.nombre,
      items: propios.map((i) => ({
        color_id: i.color_id,
        color: p.colores.find((c) => c.id === i.color_id)?.nombre ?? null,
        cantidad: i.cantidad,
      })),
      cantidad,
      subtotal: p.consultar_precio ? null : subtotal(p, cantidad),
      pack: packs > 0 && u ? { unidades: u, packs, resto: cantidad - packs * u } : null,
    })
  }
  return lineas
}

/** "Rojo", "Rojo + Burdeo x2" o null si no hay colores. */
export function textoColores(l: Pick<LineaPedido, 'items'>): string | null {
  const conColor = l.items.filter((i) => i.color)
  if (!conColor.length) return null
  if (conColor.length === 1) return conColor[0].color
  return conColor.map((i) => (i.cantidad > 1 ? `${i.color} x${i.cantidad}` : i.color)).join(' + ')
}

/** "pack 2", "x3 (pack 2 + 1)", "x4 (2 packs de 2)" o null. */
export function textoPack(l: Pick<LineaPedido, 'pack' | 'cantidad'>): string | null {
  if (!l.pack) return null
  const { unidades, packs, resto } = l.pack
  if (packs === 1 && resto === 0) return `pack ${unidades}`
  const base = packs === 1 ? `pack ${unidades}` : `${packs} packs de ${unidades}`
  return `x${l.cantidad} (${base}${resto ? ` + ${resto}` : ''})`
}
