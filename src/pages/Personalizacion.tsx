// Personalización (render/05-personalizacion): idea + foto de referencia → WhatsApp o Instagram.
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { BotonFlotante, EstadoCatalogo } from '../components/catalogo'
import { BotonEnvio, copiar, pieEnvio, VentanaInstagram } from '../components/envio'
import { Icon } from '../components/Icon'
import { linkWhatsApp, useCatalogo } from '../lib/catalogo'
import { formatCLP } from '../lib/format'
import { ErrorFoto, prepararReferencia, subirReferencia } from '../lib/fotos'
import { linkInstagramApp } from '../lib/mensaje'
import { armarMensajePersonalizacion, IDEA_MAX, puedeGuardar, validarIdea } from '../lib/personalizacion'
import { supabase } from '../lib/supabase'
import type { CanalContacto } from '../lib/types'

const IMG = `${import.meta.env.BASE_URL}img/`
const CLAVE_BORRADOR = 'itaca-personalizacion-borrador-v1'
const CLAVE_ULTIMA = 'itaca-personalizacion-ultima-v1'

const leer = (clave: string) => {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}
const escribir = (clave: string, valor: string | null) => {
  try {
    if (valor === null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, valor)
  } catch {
    // Sin almacenamiento: el borrador vive solo mientras la página está abierta.
  }
}

type Foto =
  | { estado: 'subiendo'; previa: string }
  | { estado: 'lista'; previa: string; path: string; url: string }
  | { estado: 'error'; previa: string; error: string }

export function Personalizacion() {
  const { estado, config } = useCatalogo()
  const [idea, setIdea] = useState(() => (leer(CLAVE_BORRADOR) ?? '').slice(0, IDEA_MAX))
  const [trampa, setTrampa] = useState('')
  const [foto, setFoto] = useState<Foto | null>(null)
  const [errorIdea, setErrorIdea] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [ventanaIg, setVentanaIg] = useState(false)
  const [textoManual, setTextoManual] = useState<string | null>(null)
  const cerrarVentanaIg = useCallback(() => setVentanaIg(false), [])
  const refIdea = useRef<HTMLTextAreaElement>(null)
  const refArchivo = useRef<HTMLInputElement>(null)
  const turno = useRef(0) // descarta subidas viejas si la clienta cambia de foto
  const previaActual = useRef<string | null>(null)

  useEffect(() => {
    escribir(CLAVE_BORRADOR, idea || null)
  }, [idea])

  // Libera la vista previa anterior al cambiar de foto, quitarla o salir de la página.
  const cambiarPrevia = useCallback((url: string | null) => {
    if (previaActual.current) URL.revokeObjectURL(previaActual.current)
    previaActual.current = url
  }, [])
  useEffect(() => () => cambiarPrevia(null), [cambiarPrevia])

  if (estado !== 'listo') return <EstadoCatalogo />

  const validada = validarIdea(idea)
  const ideaLimpia = 'idea' in validada ? validada.idea : null
  const subiendo = foto?.estado === 'subiendo'
  const mensaje = ideaLimpia ? armarMensajePersonalizacion(ideaLimpia, foto?.estado === 'lista' ? foto.url : null) : null

  async function elegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir la misma foto
    if (!file) return
    const yo = ++turno.current
    const previa = URL.createObjectURL(file)
    cambiarPrevia(previa)
    setFoto({ estado: 'subiendo', previa })
    try {
      const { path, url } = await subirReferencia(await prepararReferencia(file))
      if (yo === turno.current) setFoto({ estado: 'lista', previa, path, url })
    } catch (err) {
      const error = err instanceof ErrorFoto ? err.message : 'No pudimos subir la foto, revisa tu conexión.'
      if (yo === turno.current) setFoto({ estado: 'error', previa, error })
    }
  }

  function quitarFoto() {
    turno.current++
    cambiarPrevia(null)
    setFoto(null)
  }

  /** Sin idea no se envía: se marca el campo y se lleva la vista hasta él. */
  function revisar(e: MouseEvent): boolean {
    if (mensaje && !subiendo) return true
    e.preventDefault()
    if (!ideaLimpia) {
      setErrorIdea('error' in validada ? validada.error : 'Cuéntanos tu idea')
      refIdea.current?.focus()
    }
    return false
  }

  /** Guarda la solicitud para Modo Tere. Si falla, el mensaje igual se envía (es lo importante). */
  function guardar(canal: CanalContacto) {
    if (!ideaLimpia || trampa) return // campo trampa lleno = robot: no se guarda
    const ultima = Number(leer(CLAVE_ULTIMA))
    if (!puedeGuardar(ultima || null, Date.now())) return
    escribir(CLAVE_ULTIMA, String(Date.now()))
    void supabase
      .from('solicitudes_personalizacion')
      .insert({ idea: ideaLimpia, canal, foto_path: foto?.estado === 'lista' ? foto.path : null })
      .then(({ error }) => {
        if (error) console.error('No se guardó la solicitud de personalización:', error.message)
      })
  }

  function porInstagram(e: MouseEvent) {
    if (!revisar(e) || !mensaje) return
    setTextoManual(null)
    copiar(mensaje, () => setTextoManual(mensaje))
    guardar('instagram')
    setVentanaIg(true)
  }

  function nueva() {
    setIdea('')
    quitarFoto()
    setEnviado(false)
    setErrorIdea(null)
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <div className="relative h-[200px] shrink-0 bg-arena">
        <img src={`${IMG}manos.jpg`} alt="Manos tejiendo" className="w-full h-full object-cover" />
        <BotonFlotante to="/categorias" label="Volver a categorías" className="left-4">
          <Icon name="volver" size={20} />
        </BotonFlotante>
      </div>

      <div className="relative -mt-[22px] bg-papel rounded-t-[22px] px-5 pt-3 pb-[170px] flex flex-col gap-3.5 flex-1">
        <div className="self-center w-10 h-1 rounded-full bg-linea" aria-hidden="true" />

        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-[30px] font-semibold tracking-[0.14em] leading-[1.1]">PERSONALIZACIÓN</h1>
          <p className="text-[14px] text-tinta-2 leading-[1.45]">
            Creamos cada pieza a tu gusto, cuidando cada detalle para que sea verdaderamente tuya.
          </p>
        </div>

        {enviado ? (
          <div className="rounded-xl border border-linea bg-tarjeta p-5 flex flex-col items-center gap-3 text-center">
            <Icon name="check" size={28} className="text-oliva" />
            <p className="font-serif text-[22px] font-semibold">¡Listo! Tere te responderá pronto.</p>
            <p className="text-[14px] text-tinta-2">Si no alcanzaste a enviar el mensaje, vuelve a tocar el botón de abajo.</p>
            <button type="button" onClick={nueva} className="min-h-11 px-5 rounded-full border border-tinta text-[14px] font-medium">
              Nueva solicitud
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="idea" className={`text-[11px] tracking-[0.2em] uppercase ${errorIdea ? 'text-terracota-texto' : 'text-tinta-2'}`}>
                Cuéntanos tu idea{errorIdea && ` · ${errorIdea}`}
              </label>
              <p className="text-[13px] text-tinta-2 leading-normal">
                Incluye: <b className="text-tinta font-medium">qué pieza</b>, <b className="text-tinta font-medium">colores</b>,{' '}
                <b className="text-tinta font-medium">tamaño o estilo</b> y{' '}
                <b className="text-tinta font-medium">para cuándo la necesitas</b>.
              </p>
              <textarea
                id="idea"
                ref={refIdea}
                value={idea}
                maxLength={IDEA_MAX}
                placeholder="Hola Tere, me gustaría unos aros…"
                aria-invalid={Boolean(errorIdea)}
                onChange={(e) => {
                  setIdea(e.target.value)
                  if (errorIdea) setErrorIdea(null)
                }}
                className={`h-[110px] rounded-xl border bg-tarjeta px-3.5 py-3 text-[16px] text-tinta resize-none outline-none focus:border-tierra ${
                  errorIdea ? 'border-terracota' : 'border-linea'
                }`}
              />
              <span className="self-end text-[11px] text-tinta-2 cifra">
                {idea.length} / {IDEA_MAX}
              </span>
              {/* Campo trampa: invisible para las personas; los robots lo llenan. */}
              <input
                type="text"
                name="sitio_web"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={trampa}
                onChange={(e) => setTrampa(e.target.value)}
                className="absolute -left-[9999px] w-px h-px opacity-0"
              />
            </div>

            <input ref={refArchivo} type="file" accept="image/*" onChange={elegirFoto} className="hidden" />
            {foto ? (
              <div className="rounded-xl border border-linea bg-tarjeta p-2.5 flex items-center gap-3">
                <img src={foto.previa} alt="Foto de referencia" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0 text-[14px]" aria-live="polite">
                  {foto.estado === 'subiendo' && <span className="text-tinta-2">Subiendo foto…</span>}
                  {foto.estado === 'lista' && (
                    <span className="flex items-center gap-1.5 text-oliva">
                      <Icon name="check" size={18} /> Foto lista
                    </span>
                  )}
                  {foto.estado === 'error' && <span className="text-terracota-texto">{foto.error}</span>}
                </div>
                <div className="flex flex-col shrink-0">
                  <button type="button" onClick={() => refArchivo.current?.click()} className="min-h-11 px-2 text-[13px] text-tierra-texto underline underline-offset-4">
                    Cambiar
                  </button>
                  <button type="button" onClick={quitarFoto} className="min-h-11 px-2 text-[13px] text-tinta-2 underline underline-offset-4">
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => refArchivo.current?.click()}
                className="h-16 rounded-xl border-[1.5px] border-dashed border-tierra bg-tarjeta flex items-center justify-center gap-3 text-[14px] text-tinta"
              >
                <Icon name="camara" size={24} strokeWidth={1.5} className="text-tierra" />
                Adjuntar foto de referencia (opcional)
              </button>
            )}
          </>
        )}

        {config && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] bg-arena px-3 py-2.5 flex flex-col gap-0.5">
              <span className="text-[11px] tracking-[0.16em] text-tinta-2 uppercase">Anticipación</span>
              <span className="text-[15px] font-medium">{config.personalizacion_dias} días</span>
            </div>
            <div className="rounded-[10px] bg-arena px-3 py-2.5 flex flex-col gap-0.5">
              <span className="text-[11px] tracking-[0.16em] text-tinta-2 uppercase">Costo adicional</span>
              <span className="text-[15px] font-medium cifra">{formatCLP(config.personalizacion_costo)}</span>
            </div>
          </div>
        )}
      </div>

      {ventanaIg && config && (
        <VentanaInstagram
          que="mensaje"
          cuenta={config.instagram}
          href={linkInstagramApp(config, navigator.userAgent)}
          textoManual={textoManual}
          onOk={() => {
            setVentanaIg(false)
            setEnviado(true)
          }}
          onVolver={cerrarVentanaIg}
        />
      )}

      <div className={pieEnvio}>
        <div className="max-w-[480px] mx-auto px-4 pt-3.5 pb-[22px] flex flex-col gap-2.5">
          {!config && <p className="text-[13px] text-terracota-texto px-1">No pudimos cargar los datos de contacto. Recarga la página.</p>}
          {subiendo && <p className="text-[13px] text-tinta-2 px-1 text-center">Esperando que termine de subir la foto…</p>}
          <BotonEnvio
            href={config && mensaje ? linkWhatsApp(config, mensaje) : null}
            deshabilitado={!config || subiendo}
            onClick={(e) => {
              if (!revisar(e)) return
              guardar('whatsapp')
              setEnviado(true)
            }}
            className="h-14 bg-tinta text-papel gap-2.5 text-[15px] font-medium"
          >
            <Icon name="whatsapp" size={20} strokeWidth={1.6} />
            Enviar por WhatsApp
          </BotonEnvio>
          <BotonEnvio
            href={null}
            deshabilitado={!config || subiendo}
            onClick={porInstagram}
            className="h-[50px] border border-tinta text-tinta gap-2.5 text-[14px]"
          >
            <Icon name="instagram" size={18} strokeWidth={1.6} />
            Enviar a @{config?.instagram ?? 'itaca.cl'}
          </BotonEnvio>
        </div>
      </div>
    </div>
  )
}
