// Modo Tere · ajustes: contacto, envíos, personalización y categorías (lanzar Collares).
import { useState } from 'react'
import { formatCLP } from '../lib/format'
import type { Config } from '../lib/types'
import { actualizarCategoria, actualizarConfig, useDatosTere } from './datos'
import { leerMonto, normalizarInstagram, normalizarWhatsapp, parsearComunas } from './reglas'
import { Campo, EncabezadoTere, FotoSubible, Interruptor, Resultado, Seccion, Texto } from './ui'

const sinPuntos = (n: number) => formatCLP(n).replace('$', '')

/** WhatsApp guardado (56912345678) → "+56 9 1234 5678" para editarlo cómodo. */
const whatsappLegible = (w: string) => (/^56\d{9}$/.test(w) ? `+56 ${w.slice(2, 3)} ${w.slice(3, 7)} ${w.slice(7)}` : w)

function formDesde(c: Config) {
  return {
    whatsapp: whatsappLegible(c.whatsapp),
    instagram: c.instagram,
    envio_precio: sinPuntos(c.envio_precio),
    envio_comunas: c.envio_comunas.join(', '),
    retiro_texto: c.retiro_texto,
    starken_texto: c.starken_texto,
    personalizacion_costo: sinPuntos(c.personalizacion_costo),
    personalizacion_dias: String(c.personalizacion_dias),
  }
}

export function Ajustes() {
  const { config, categorias, recargar } = useDatosTere()
  if (!config) {
    return (
      <div className="max-w-[480px] mx-auto">
        <EncabezadoTere titulo="Ajustes" />
        <p className="p-6 text-center text-tinta-2">No encontramos la configuración del catálogo.</p>
      </div>
    )
  }
  return <Formulario config={config} categorias={categorias} recargar={recargar} />
}

function Formulario({
  config,
  categorias,
  recargar,
}: {
  config: Config
  categorias: ReturnType<typeof useDatosTere>['categorias']
  recargar: () => Promise<void>
}) {
  const [f, setF] = useState(() => formDesde(config))
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<{ texto: string | null; error: string | null }>({ texto: null, error: null })
  const [errorCat, setErrorCat] = useState<string | null>(null)
  const hayCambios = JSON.stringify(f) !== JSON.stringify(formDesde(config))
  const set = (k: keyof typeof f, v: string) => {
    setResultado({ texto: null, error: null })
    setF((x) => ({ ...x, [k]: v }))
  }

  async function guardar() {
    const error = (texto: string) => setResultado({ texto: null, error: texto })
    const w = normalizarWhatsapp(f.whatsapp)
    if ('error' in w) return error(w.error)
    const ig = normalizarInstagram(f.instagram)
    if ('error' in ig) return error(ig.error)
    const envio = leerMonto(f.envio_precio)
    if (envio === null) return error('Revisa el precio del envío.')
    const comunas = parsearComunas(f.envio_comunas)
    if (!comunas.length) return error('Escribe al menos una comuna para el envío a domicilio.')
    const costo = leerMonto(f.personalizacion_costo)
    if (costo === null) return error('Revisa el costo de la personalización.')
    const dias = leerMonto(f.personalizacion_dias)
    if (dias === null) return error('Revisa los días de anticipación.')
    if (!f.retiro_texto.trim() || !f.starken_texto.trim()) return error('Completa los textos de retiro y de Starken.')

    setGuardando(true)
    try {
      await actualizarConfig(config.user_id, {
        whatsapp: w.valor,
        instagram: ig.valor,
        envio_precio: envio,
        envio_comunas: comunas,
        retiro_texto: f.retiro_texto.trim(),
        starken_texto: f.starken_texto.trim(),
        personalizacion_costo: costo,
        personalizacion_dias: dias,
      })
      await recargar()
      setResultado({ texto: 'Guardado ✓', error: null })
    } catch (e) {
      error(e instanceof Error ? e.message : 'Algo falló.')
    } finally {
      setGuardando(false)
    }
  }

  async function categoria(id: string, cambios: Parameters<typeof actualizarCategoria>[1]) {
    setErrorCat(null)
    try {
      await actualizarCategoria(id, cambios)
      await recargar()
    } catch (e) {
      setErrorCat(e instanceof Error ? e.message : 'Algo falló.')
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <EncabezadoTere titulo="Ajustes" puedeSalir={() => !hayCambios || window.confirm('Tienes cambios sin guardar. ¿Salir igual?')} />
      <div className="px-4 pt-4 pb-[120px] flex flex-col gap-3">
        <Seccion titulo="Contacto">
          <Campo etiqueta="WhatsApp" ayuda="Aquí llegan los pedidos.">
            <Texto inputMode="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </Campo>
          <Campo etiqueta="Instagram">
            <Texto value={f.instagram} onChange={(e) => set('instagram', e.target.value)} autoCapitalize="none" />
          </Campo>
        </Seccion>

        <Seccion titulo="Entrega">
          <Campo etiqueta="Texto de retiro" ayuda='Lo que va entre paréntesis se muestra como detalle: "Retiro en Vitacura (dirección se entrega por interno)".'>
            <Texto value={f.retiro_texto} onChange={(e) => set('retiro_texto', e.target.value)} />
          </Campo>
          <Campo etiqueta="Precio envío a domicilio">
            <Texto inputMode="numeric" value={f.envio_precio} onChange={(e) => set('envio_precio', e.target.value)} />
          </Campo>
          <Campo etiqueta="Comunas con envío" ayuda="Separadas por coma.">
            <Texto value={f.envio_comunas} onChange={(e) => set('envio_comunas', e.target.value)} />
          </Campo>
          <Campo etiqueta="Texto de Starken (otras comunas)">
            <Texto value={f.starken_texto} onChange={(e) => set('starken_texto', e.target.value)} />
          </Campo>
        </Seccion>

        <Seccion titulo="Personalización">
          <div className="grid grid-cols-2 gap-2">
            <Campo etiqueta="Costo adicional">
              <Texto inputMode="numeric" value={f.personalizacion_costo} onChange={(e) => set('personalizacion_costo', e.target.value)} />
            </Campo>
            <Campo etiqueta="Días de anticipación">
              <Texto inputMode="numeric" value={f.personalizacion_dias} onChange={(e) => set('personalizacion_dias', e.target.value)} />
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Categorías">
          <p className="text-[12px] text-tinta-2 -mt-1.5">Estos cambios se guardan al tiro.</p>
          <Resultado texto={null} error={errorCat} />
          {categorias.map((c) => (
            <div key={c.id} className="flex gap-3 items-center border-t border-linea pt-3 first-of-type:border-0 first-of-type:pt-0">
              <FotoSubible
                ruta={c.foto_portada}
                slug={`categoria-${c.slug ?? c.id}`}
                etiqueta="Portada"
                tamano="w-16 h-16"
                alSubir={(r) => void categoria(c.id, { foto_portada: r })}
              />
              <div className="flex-1">
                <p className="font-serif text-[18px] font-semibold tracking-[0.12em] uppercase">{c.nombre}</p>
                <Interruptor
                  activo={c.proximamente}
                  cambiar={(v) => void categoria(c.id, { proximamente: v })}
                  texto="Próximamente"
                  detalle={c.proximamente ? 'Las clientas la ven, pero no pueden entrar.' : 'Visible y abierta.'}
                />
              </div>
            </div>
          ))}
        </Seccion>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-papel border-t border-linea">
        <div className="max-w-[480px] mx-auto px-4 pt-2.5 pb-[18px] flex flex-col gap-1.5">
          <Resultado {...resultado} />
          <button
            type="button"
            disabled={!hayCambios || guardando}
            onClick={guardar}
            className="h-[54px] rounded-xl bg-tinta text-papel text-[14px] font-medium tracking-[0.16em] uppercase disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : 'Guardar ajustes'}
          </button>
        </div>
      </div>
    </div>
  )
}
