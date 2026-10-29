// Modo Tere · solicitudes de personalización (las más nuevas primero).
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { fechaCorta } from '../lib/format'
import type { EstadoSolicitud, SolicitudPersonalizacion } from '../lib/types'
import { cambiarEstadoSolicitud, eliminarSolicitud, fotoReferenciaUrl, useDatosTere } from './datos'
import { EncabezadoTere, Resultado } from './ui'

const ESTADOS: { valor: EstadoSolicitud; texto: string }[] = [
  { valor: 'nueva', texto: 'Nueva' },
  { valor: 'contactada', texto: 'Contactada' },
  { valor: 'cerrada', texto: 'Cerrada' },
]

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

export function Solicitudes() {
  const { solicitudes, recargar } = useDatosTere()
  const [error, setError] = useState<string | null>(null)
  const [ocupada, setOcupada] = useState<string | null>(null)

  async function hacer(s: SolicitudPersonalizacion, accion: () => Promise<void>) {
    setError(null)
    setOcupada(s.id)
    try {
      await accion()
      await recargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo falló.')
    } finally {
      setOcupada(null)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <EncabezadoTere titulo="Solicitudes" />
      <div className="px-4 pt-4 pb-10 flex flex-col gap-3">
        <Resultado texto={null} error={error} />
        {solicitudes.length === 0 && <p className="text-center text-tinta-2 py-10">Aún no llegan solicitudes de personalización.</p>}
        {solicitudes.map((s) => (
          <article
            key={s.id}
            className={`bg-tarjeta border rounded-2xl p-4 flex flex-col gap-3 ${s.estado === 'nueva' ? 'border-tierra' : 'border-linea'} ${ocupada === s.id ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between text-[12px] text-tinta-2">
              <span>
                {fechaCorta(s.created_at)} · {hora(s.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name={s.canal === 'whatsapp' ? 'whatsapp' : 'instagram'} size={14} />
                {s.canal === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
              </span>
            </div>
            {s.nombre && <p className="font-medium">{s.nombre}</p>}
            <div className="flex gap-3">
              {s.foto_path && (
                <a href={fotoReferenciaUrl(s.foto_path)} target="_blank" rel="noopener noreferrer" aria-label="Ver foto de referencia" className="shrink-0">
                  <img src={fotoReferenciaUrl(s.foto_path)} alt="Foto de referencia" loading="lazy" className="w-20 h-20 object-cover rounded-lg bg-arena" />
                </a>
              )}
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words flex-1">{s.idea}</p>
            </div>
            <div role="radiogroup" aria-label="Estado" className="grid grid-cols-3 gap-1.5">
              {ESTADOS.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  role="radio"
                  aria-checked={s.estado === e.valor}
                  disabled={ocupada === s.id}
                  onClick={() => s.estado !== e.valor && hacer(s, () => cambiarEstadoSolicitud(s.id, e.valor))}
                  className={`h-11 rounded-full text-[13px] ${s.estado === e.valor ? 'bg-tinta text-papel font-medium' : 'border border-linea'}`}
                >
                  {e.texto}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={ocupada === s.id}
              onClick={() => window.confirm('¿Eliminar esta solicitud y su foto?') && hacer(s, () => eliminarSolicitud(s))}
              className="self-end min-h-11 text-[13px] text-terracota-texto underline underline-offset-2"
            >
              Eliminar
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
