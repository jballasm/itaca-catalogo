// Piezas comunes de las pantallas públicas (render 02–04).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useCarrito } from '../lib/carrito'
import { useCatalogo } from '../lib/catalogo'
import { formatCLP } from '../lib/format'
import { BotonPrimario, Logo } from './ui'

/** Botón redondo sobre foto (volver, bolsa): 44 px, fondo papel 92 %. */
export function BotonFlotante({ to, label, children, className = '' }: { to: string; label: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={`absolute top-3.5 w-11 h-11 rounded-full bg-papel/92 text-tinta flex items-center justify-center ${className}`}
    >
      {children}
    </Link>
  )
}

/** "$85.990", o "Consultar" si todo es "Consultar precio". */
export function textoTotal(total: number, hayConsultar: boolean): string {
  return hayConsultar && total === 0 ? 'Consultar' : formatCLP(total)
}

/** Barra "Tu pedido" fija abajo. Solo aparece si hay productos. */
export function BarraPedido({ oscura = false }: { oscura?: boolean }) {
  const { resumen } = useCarrito()
  if (resumen.unidades === 0) return null
  const n = resumen.unidades
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 pointer-events-none">
      <div className="max-w-[480px] mx-auto px-4 pb-5 pt-2.5">
        <Link
          to="/pedido"
          className={`pointer-events-auto h-[58px] rounded-full flex items-center justify-between gap-3 pl-[22px] pr-2 text-[14px] shadow-[0_6px_20px_rgba(43,36,28,.18)] ${
            oscura ? 'bg-tinta text-papel' : 'bg-tarjeta text-tinta border border-tinta'
          }`}
        >
          <span className="min-w-0 flex flex-col leading-tight">
            <span className="truncate">
              Tu pedido · {n} {n === 1 ? 'producto' : 'productos'}
            </span>
            {resumen.hayConsultar && resumen.total > 0 && (
              <span className={`text-[11px] ${oscura ? 'text-papel/70' : 'text-tinta-2'}`}>+ productos a consultar</span>
            )}
          </span>
          <span
            className={`h-[42px] shrink-0 px-4 rounded-full flex items-center font-medium cifra ${
              oscura ? 'bg-papel text-tinta' : 'bg-tinta text-papel'
            }`}
          >
            {textoTotal(resumen.total, resumen.hayConsultar)}&nbsp;&nbsp;→
          </span>
        </Link>
      </div>
    </div>
  )
}

/** Espacio al final de la página para que la barra fija no tape contenido. */
export function EspacioBarra() {
  const { resumen } = useCarrito()
  return resumen.unidades > 0 ? <div className="h-[96px]" aria-hidden="true" /> : <div className="h-6" aria-hidden="true" />
}

/** Aviso breve ("Agregado · Náxos (Rojo)"). `abajo`: px desde el borde inferior (sobre la barra fija). */
export function useAviso(abajo = 96): [ReactNode, (texto: string) => void] {
  const [texto, setTexto] = useState<string | null>(null)
  const t = useRef<number | undefined>(undefined)
  const mostrar = useCallback((s: string) => {
    setTexto(s)
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => setTexto(null), 2200)
  }, [])
  useEffect(() => () => window.clearTimeout(t.current), [])
  const nodo = (
    <div aria-live="polite" style={{ bottom: abajo }} className="fixed inset-x-0 z-30 flex justify-center pointer-events-none px-4">
      {texto && <div className="rounded-full bg-tinta text-papel text-[14px] text-center px-5 py-2.5 shadow-lg">{texto}</div>}
    </div>
  )
  return [nodo, mostrar]
}

/** Mientras carga o si falló la carga del catálogo. Devuelve null cuando está listo. */
export function EstadoCatalogo() {
  const { estado, reintentar } = useCatalogo()
  if (estado === 'listo') return null
  return (
    <div className="min-h-dvh max-w-[480px] mx-auto px-8 flex flex-col items-center justify-center gap-6 text-center">
      <Logo className={`w-20 h-10 ${estado === 'cargando' ? 'opacity-60 animate-pulse' : ''}`} />
      {estado === 'error' && (
        <>
          <p className="text-[15px] text-tinta-2">No pudimos cargar el catálogo. Revisa tu conexión.</p>
          <BotonPrimario onClick={reintentar} className="rounded-full">
            Reintentar
          </BotonPrimario>
        </>
      )}
    </div>
  )
}

/** Pantalla simple para "no encontrado" y marcadores provisorios. */
export function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="min-h-dvh max-w-[480px] mx-auto px-8 flex flex-col items-center justify-center gap-4 text-center">
      <Logo className="w-16 h-8" />
      <h1 className="font-serif text-[28px] font-semibold tracking-[0.14em] uppercase">{titulo}</h1>
      <p className="text-[15px] text-tinta-2">{texto}</p>
      <Link to="/categorias" className="min-h-11 flex items-center text-[15px] text-tierra-texto underline underline-offset-4">
        Volver al catálogo
      </Link>
    </div>
  )
}
