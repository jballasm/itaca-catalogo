// Piezas de interfaz de Modo Tere.
import { useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { fotoUrl } from '../lib/catalogo'
import { ErrorFoto, prepararFotoCatalogo, subirFotoCatalogo } from '../lib/fotos'

export const inputTere =
  'h-11 w-full rounded-[10px] border border-linea bg-white px-3 text-[16px] text-tinta outline-none focus:border-tierra disabled:bg-arena disabled:text-tinta-2'

/** Encabezado de las pantallas internas: volver + título. `puedeSalir` pregunta si hay cambios sin guardar. */
export function EncabezadoTere({
  titulo,
  volverA = '/tere',
  accion,
  puedeSalir,
}: {
  titulo: string
  volverA?: string
  accion?: ReactNode
  puedeSalir?: () => boolean
}) {
  return (
    <header className="sticky top-0 z-20 bg-tinta text-papel px-3 py-2 flex items-center gap-2">
      <Link
        to={volverA}
        aria-label="Volver"
        onClick={(e) => puedeSalir && !puedeSalir() && e.preventDefault()}
        className="w-11 h-11 flex items-center justify-center"
      >
        <Icon name="volver" size={20} />
      </Link>
      <h1 className="font-serif text-[22px] font-semibold flex-1 truncate">{titulo}</h1>
      {accion}
    </header>
  )
}

/** Etiqueta + campo. La ayuda va fuera de la etiqueta (el lector de pantalla no la lee como parte del nombre). */
export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] tracking-[0.18em] text-tinta-2 uppercase">{etiqueta}</span>
        {children}
      </label>
      {ayuda && <span className="text-[12px] text-tinta-2">{ayuda}</span>}
    </div>
  )
}

export function Texto(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" {...props} className={`${inputTere} ${props.className ?? ''}`} />
}

/** Casilla grande (44 px) con texto. */
export function Interruptor({
  activo,
  cambiar,
  texto,
  detalle,
}: {
  activo: boolean
  cambiar: (v: boolean) => void
  texto: string
  detalle?: string
}) {
  return (
    <label className="min-h-11 flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={activo} onChange={(e) => cambiar(e.target.checked)} className="w-6 h-6 shrink-0 accent-oliva" />
      <span className="flex flex-col">
        <span className="text-[15px]">{texto}</span>
        {detalle && <span className="text-[12px] text-tinta-2">{detalle}</span>}
      </span>
    </label>
  )
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-tarjeta border border-linea rounded-2xl p-4 flex flex-col gap-3.5">
      <h2 className="text-[12px] tracking-[0.2em] text-tinta-2 uppercase">{titulo}</h2>
      {children}
    </section>
  )
}

/**
 * Foto que Tere puede subir o cambiar: comprime, sube a catalogo/productos/<slug>/ y avisa la ruta.
 * La foto anterior no se borra del bucket (puede estar usada en otra parte).
 */
export function FotoSubible({
  ruta,
  slug,
  etiqueta,
  alSubir,
  alQuitar,
  tamano = 'w-24 h-24',
}: {
  ruta: string | null
  slug: string
  etiqueta: string
  alSubir: (ruta: string) => void
  alQuitar?: () => void
  tamano?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function elegir(file: File | undefined) {
    if (!file) return
    setError(null)
    setSubiendo(true)
    try {
      alSubir(await subirFotoCatalogo(await prepararFotoCatalogo(file), slug))
    } catch (e) {
      setError(e instanceof ErrorFoto ? e.message : 'No pudimos subir la foto.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 w-min">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        aria-label={`${ruta ? 'Cambiar' : 'Subir'} ${etiqueta.toLowerCase()}`}
        className={`${tamano} relative rounded-lg overflow-hidden border border-dashed border-tierra bg-papel flex items-center justify-center`}
      >
        {ruta ? (
          <img src={fotoUrl(ruta)} alt="" className={`w-full h-full object-cover ${subiendo ? 'opacity-40' : ''}`} />
        ) : (
          <Icon name="camara" size={24} strokeWidth={1.5} className="text-tierra" />
        )}
        {subiendo && <span className="absolute inset-0 flex items-center justify-center text-[11px] bg-papel/60">Subiendo…</span>}
      </button>
      <span className="text-[11px] text-tinta-2 text-center leading-tight">{etiqueta}</span>
      {ruta && alQuitar && (
        <button type="button" onClick={alQuitar} className="text-[11px] text-terracota-texto underline underline-offset-2 min-h-8">
          Quitar
        </button>
      )}
      {error && <span className="text-[11px] text-terracota-texto text-center">{error}</span>}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void elegir(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** Aviso de resultado al guardar. */
export function Resultado({ texto, error }: { texto: string | null; error: string | null }) {
  if (error) return <p role="alert" className="text-[14px] text-terracota-texto text-center">{error}</p>
  if (texto) return <p aria-live="polite" className="text-[14px] text-oliva text-center">{texto}</p>
  return null
}
