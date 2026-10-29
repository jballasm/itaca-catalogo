// Mensaje del pedido para WhatsApp e Instagram (plan §7). Lógica pura (tests/mensaje.test.ts).
import { formatCLP } from './format'
import { textoColores, textoPack, type Entrega, type LineaPedido, type TotalPedido } from './pedido'
import type { Config } from './types'

export const NOMBRE_MAX = 60

/** "Retiro en Vitacura (dirección se entrega por interno)" → "Retiro en Vitacura". */
export function tituloRetiro(config: Pick<Config, 'retiro_texto'>): string {
  return config.retiro_texto.split(' (')[0].trim() || 'Retiro'
}

/** "Retiro en Vitacura (dirección se entrega por interno)" → "Dirección se entrega por interno" (o null). */
export function detalleRetiro(config: Pick<Config, 'retiro_texto'>): string | null {
  const i = config.retiro_texto.indexOf('(')
  if (i < 0) return null
  const d = config.retiro_texto.slice(i + 1).replace(/\)\s*$/, '').trim()
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : null
}

/** "· Náxos (Rojo) x1 — $45.000", "· Aura pack 2 — $40.990", "· Cartera 2 — consultar precio". */
export function lineaMensaje(l: LineaPedido): string {
  const colores = textoColores(l)
  const pack = textoPack(l)
  const conColores = colores ? ` (${colores})` : ''
  if (l.subtotal === null) {
    return `· ${l.nombre}${conColores}${l.cantidad > 1 ? ` x${l.cantidad}` : ''} — consultar precio`
  }
  if (pack) return `· ${l.nombre} ${pack}${conColores} — ${formatCLP(l.subtotal)}`
  return `· ${l.nombre}${conColores} x${l.cantidad} — ${formatCLP(l.subtotal)}`
}

export function lineaEntrega(entrega: Entrega, config: Pick<Config, 'retiro_texto' | 'envio_precio'>): string {
  if (entrega === 'retiro') return `Entrega: ${tituloRetiro(config)} (gratis)`
  if (entrega === 'envio') return `Entrega: Envío a domicilio (${formatCLP(config.envio_precio)})`
  return 'Entrega: Otra comuna (Starken) — costo por confirmar'
}

export function lineaTotal(t: TotalPedido): string {
  const extras = [t.envioPorConfirmar && 'envío por confirmar', t.hayConsultar && 'productos por consultar'].filter(Boolean)
  return `Total: ${formatCLP(t.total)}${extras.map((e) => ` + ${e}`).join('')}`
}

export function limpiarNombre(nombre: string): string {
  return nombre.replace(/\s+/g, ' ').trim().slice(0, NOMBRE_MAX)
}

export function armarMensaje(d: {
  lineas: LineaPedido[]
  entrega: Entrega
  config: Pick<Config, 'retiro_texto' | 'envio_precio'>
  total: TotalPedido
  nombre: string
}): string {
  const nombre = limpiarNombre(d.nombre)
  return [
    '¡Hola Tere! Quiero hacer un pedido desde el catálogo de Ítaca:',
    ...d.lineas.map(lineaMensaje),
    lineaEntrega(d.entrega, d.config),
    lineaTotal(d.total),
    ...(nombre ? [`Nombre: ${nombre}`] : []),
  ].join('\n')
}

/** Chat de Instagram con la cuenta de Ítaca (link web). */
export function linkInstagram(config: Pick<Config, 'instagram'>): string {
  return `https://ig.me/m/${config.instagram}`
}

/**
 * Link que abre la **app** de Instagram en el chat. En Android los navegadores (Chrome,
 * Samsung Internet) se quedan en la web con ig.me, así que se usa un intent con el paquete
 * de Instagram y la web como respaldo si la app no está. En iPhone y computador, ig.me.
 */
export function linkInstagramApp(config: Pick<Config, 'instagram'>, userAgent: string): string {
  const web = linkInstagram(config)
  if (!/Android/i.test(userAgent)) return web
  return `intent://ig.me/m/${config.instagram}#Intent;scheme=https;package=com.instagram.android;S.browser_fallback_url=${encodeURIComponent(web)};end`
}
