// Envío a Tere por WhatsApp o Instagram: lo comparten Tu pedido y Personalización.
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { Icon } from './Icon'

/** Pie fijo con el total y los botones de envío. */
export const pieEnvio = 'fixed inset-x-0 bottom-0 z-20 bg-papel border-t border-linea'

/** Copia con el portapapeles moderno y, si falla, con un textarea oculto. Avisa si no se pudo. */
export function copiar(texto: string, siFalla: () => void) {
  const viejo = () => {
    try {
      const t = document.createElement('textarea')
      t.value = texto
      t.setAttribute('readonly', '')
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      t.remove()
      if (!ok) siFalla()
    } catch {
      siFalla()
    }
  }
  try {
    // Se llama dentro del mismo toque (sin await antes) para que el navegador lo permita.
    navigator.clipboard.writeText(texto).catch(viejo)
  } catch {
    viejo()
  }
}

/**
 * Ventana que explica cómo pegar el mensaje en Instagram. El "Ok" es un link real a la app
 * (`linkInstagramApp`: intent en Android, ig.me en iPhone): al ser un toque de la clienta,
 * el celular abre Instagram sin bloquearlo.
 */
export function VentanaInstagram({
  que,
  cuenta,
  href,
  textoManual,
  onOk,
  onVolver,
}: {
  /** Lo que se copió: "¡Tu pedido está copiado!" o "¡Tu mensaje está copiado!". */
  que: 'pedido' | 'mensaje'
  cuenta: string
  href: string
  textoManual: string | null
  onOk: () => void
  onVolver: () => void
}) {
  const refOk = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    refOk.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onVolver()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onVolver])

  return (
    // Tocar el fondo oscuro también vuelve (para lectores de pantalla está el botón "Volver").
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-titulo"
      onClick={(e) => e.target === e.currentTarget && onVolver()}
    >
      <div className="relative w-full max-w-[360px] rounded-[22px] bg-papel p-6 flex flex-col gap-4 text-center shadow-xl">
        <Icon name="instagram" size={28} strokeWidth={1.5} className="self-center text-tierra" />
        {textoManual ? (
          <>
            <h2 id="ig-titulo" className="font-serif text-[24px] font-semibold leading-tight">
              Copia tu {que}
            </h2>
            <p className="text-[15px] text-tinta-2 leading-relaxed">
              No pudimos copiarlo solo. Mantén presionado el texto, elige <b className="text-tinta font-medium">Copiar</b> y
              luego toca Ok.
            </p>
            <textarea readOnly value={textoManual} rows={6} className="w-full text-[13px] text-left bg-tarjeta rounded-lg p-2 border border-linea" />
          </>
        ) : (
          <>
            <h2 id="ig-titulo" className="font-serif text-[24px] font-semibold leading-tight">
              ¡Tu {que} está copiado!
            </h2>
            <p className="text-[15px] text-tinta-2 leading-relaxed">
              Ahora te llevamos al chat de <b className="text-tinta font-medium">@{cuenta}</b> en Instagram. Cuando se abra, mantén
              presionado el espacio para escribir, elige <b className="text-tinta font-medium">Pegar</b> y envíaselo a Tere.
            </p>
          </>
        )}
        {/* En la misma pestaña: así el celular pasa el link a la app (en pestaña nueva se queda en la web).
            No se pierde nada: lo escrito está guardado en el celular. */}
        <a
          ref={refOk}
          href={href}
          onClick={onOk}
          className="h-[52px] rounded-full bg-tinta text-papel flex items-center justify-center text-[15px] font-medium"
        >
          Ok, ir a Instagram
        </a>
        <button type="button" onClick={onVolver} className="min-h-11 text-[14px] text-tinta-2 underline underline-offset-4">
          Volver
        </button>
      </div>
    </div>
  )
}

/**
 * Con href: link real (abre WhatsApp en el mismo toque, sin que el celular lo bloquee).
 * Sin href: botón (Instagram, que abre la ventana; o cualquiera si falta algo por completar).
 */
export function BotonEnvio({
  href,
  deshabilitado,
  onClick,
  className,
  children,
}: {
  href: string | null
  deshabilitado: boolean
  onClick: (e: MouseEvent) => void
  className: string
  children: ReactNode
}) {
  const base = `rounded-full flex items-center justify-center disabled:opacity-50 ${className}`
  return href && !deshabilitado ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={base}>
      {children}
    </a>
  ) : (
    <button type="button" disabled={deshabilitado} onClick={onClick} className={base}>
      {children}
    </button>
  )
}
