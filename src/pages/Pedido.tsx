// Tu pedido (render/06-pedido): entrega, total y envío por WhatsApp o Instagram.
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { EstadoCatalogo } from '../components/catalogo'
import { BotonEnvio, copiar, pieEnvio, VentanaInstagram } from '../components/envio'
import { Icon } from '../components/Icon'
import { Logo } from '../components/ui'
import { useCarrito } from '../lib/carrito'
import { fotoUrl, linkWhatsApp, useCatalogo, type ProductoCatalogo } from '../lib/catalogo'
import { formatCLP } from '../lib/format'
import { armarMensaje, detalleRetiro, linkInstagramApp, NOMBRE_MAX, tituloRetiro } from '../lib/mensaje'
import { lineasPedido, textoColores, textoPack, totalPedido, type Entrega, type LineaPedido } from '../lib/pedido'

const CLAVE_DATOS = 'itaca-pedido-datos-v1'

function leerDatos(): { nombre: string; entrega: Entrega | null } {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_DATOS) ?? '{}')
    const entrega = ['retiro', 'envio', 'starken'].includes(d?.entrega) ? (d.entrega as Entrega) : null
    return { nombre: typeof d?.nombre === 'string' ? d.nombre.slice(0, NOMBRE_MAX) : '', entrega }
  } catch {
    return { nombre: '', entrega: null }
  }
}

export function Pedido() {
  const { estado, productos, config } = useCatalogo()
  const { items, cambiar, vaciar } = useCarrito()
  const navigate = useNavigate()
  const location = useLocation()
  const [datos] = useState(leerDatos)
  const [nombre, setNombre] = useState(datos.nombre)
  const [entrega, setEntrega] = useState<Entrega | null>(datos.entrega)
  const [faltaEntrega, setFaltaEntrega] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [textoManual, setTextoManual] = useState<string | null>(null)
  const [ventanaIg, setVentanaIg] = useState(false)
  const cerrarVentanaIg = useCallback(() => setVentanaIg(false), [])
  const refEntrega = useRef<HTMLFieldSetElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_DATOS, JSON.stringify({ nombre, entrega }))
    } catch {
      // Sin almacenamiento: los datos viven solo mientras la página está abierta.
    }
  }, [nombre, entrega])

  if (estado !== 'listo') return <EstadoCatalogo />

  const volver = () => (location.key !== 'default' ? navigate(-1) : navigate('/categorias'))
  const lineas = lineasPedido(items, productos)

  if (!lineas.length) {
    return (
      <div className="min-h-dvh max-w-[480px] mx-auto px-8 flex flex-col items-center justify-center gap-4 text-center">
        <Logo className="w-16 h-8" />
        <h1 className="font-serif text-[28px] font-semibold">Tu pedido está vacío</h1>
        <p className="text-[15px] text-tinta-2">Elige tus piezas en el catálogo y vuelve aquí para enviarlo.</p>
        <Link to="/categorias" className="mt-2 h-12 px-6 rounded-full bg-tinta text-papel flex items-center text-[15px] font-medium">
          Ver catálogo
        </Link>
      </div>
    )
  }

  const resumen = {
    unidades: lineas.reduce((s, l) => s + l.cantidad, 0),
    total: lineas.reduce((s, l) => s + (l.subtotal ?? 0), 0),
    hayConsultar: lineas.some((l) => l.subtotal === null),
  }
  const total = config && entrega ? totalPedido(resumen, entrega, config) : null
  const mensaje = config && entrega && total ? armarMensaje({ lineas, entrega, config, total, nombre }) : null

  /** Sin entrega elegida no se envía: se marca la sección y se lleva la vista hasta ella. */
  function revisar(e: MouseEvent): boolean {
    if (mensaje) return true
    e.preventDefault()
    setFaltaEntrega(true)
    refEntrega.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return false
  }

  /**
   * Instagram (pedido de Vicente): se copia en este mismo toque y se muestra una ventana que
   * explica qué hacer. Instagram se abre recién con el "Ok" (otro toque, así no se bloquea).
   */
  function porInstagram(e: MouseEvent) {
    if (!revisar(e) || !mensaje) return
    setTextoManual(null)
    copiar(mensaje, () => setTextoManual(mensaje))
    setVentanaIg(true)
  }

  const productoDe = (l: LineaPedido) => productos.find((p) => p.id === l.producto_id) as ProductoCatalogo

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 pt-3.5 pb-1.5">
        <button type="button" onClick={volver} aria-label="Seguir mirando" className="w-11 h-11 flex items-center justify-center">
          <Icon name="volver" size={20} />
        </button>
        <h1 className="font-serif text-[26px] font-semibold">Tu pedido</h1>
        <span className="w-11" aria-hidden="true" />
      </header>

      <div className="px-5 pt-2 pb-[250px] flex flex-col gap-2.5">
        {lineas.map((l) => (
          <TarjetaLinea key={l.producto_id} l={l} p={productoDe(l)} cambiar={cambiar} />
        ))}

        <label className="flex flex-col gap-1.5 mt-1.5">
          <span className="text-[12px] tracking-[0.14em] text-tinta-2 uppercase">Tu nombre (opcional)</span>
          <input
            type="text"
            value={nombre}
            maxLength={NOMBRE_MAX}
            autoComplete="given-name"
            onChange={(e) => setNombre(e.target.value)}
            className="h-12 rounded-[10px] border border-linea bg-tarjeta px-3.5 text-[16px] text-tinta outline-none focus:border-tierra"
          />
        </label>

        {config && (
          <fieldset ref={refEntrega} className="flex flex-col gap-1.5">
            <legend className={`text-[12px] tracking-[0.14em] uppercase pb-1.5 ${faltaEntrega && !entrega ? 'text-terracota-texto' : 'text-tinta-2'}`}>
              Entrega{faltaEntrega && !entrega && ' · elige cómo quieres recibirlo'}
            </legend>
            <Opcion
              valor="retiro"
              actual={entrega}
              elegir={setEntrega}
              titulo={tituloRetiro(config)}
              detalle={detalleRetiro(config)}
              precio={<span className="text-tinta-2">Gratis</span>}
            />
            <Opcion
              valor="envio"
              actual={entrega}
              elegir={setEntrega}
              titulo="Envío a domicilio"
              detalle={config.envio_comunas.join(', ')}
              precio={<span className="font-medium cifra">{formatCLP(config.envio_precio)}</span>}
            />
            <Opcion
              valor="starken"
              actual={entrega}
              elegir={setEntrega}
              titulo="Otra comuna · Starken"
              detalle={config.starken_texto}
              precio={<span className="text-tinta-2 text-[12px]">Por confirmar</span>}
            />
          </fieldset>
        )}

        {enviado && (
          <div className="mt-2 rounded-xl border border-linea bg-tarjeta p-4 flex items-center justify-between gap-3">
            <span className="text-[14px] text-tinta-2">¿Ya lo enviaste?</span>
            <button
              type="button"
              onClick={() => {
                vaciar()
                setEnviado(false)
              }}
              className="min-h-11 px-4 rounded-full border border-tinta text-[14px] font-medium"
            >
              Vaciar pedido
            </button>
          </div>
        )}

      </div>

      {ventanaIg && config && (
        <VentanaInstagram
          que="pedido"
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
          <div className="flex justify-between items-baseline px-1">
            <span className="text-[14px] text-tinta-2">{entrega === 'envio' ? 'Total con envío' : 'Total'}</span>
            <span className="text-right">
              <span className="font-serif text-[28px] font-semibold cifra">{formatCLP(total?.total ?? resumen.total)}</span>
              {(total?.envioPorConfirmar || resumen.hayConsultar) && (
                <span className="block text-[11px] text-tinta-2">
                  {[total?.envioPorConfirmar && '+ envío por confirmar', resumen.hayConsultar && '+ productos por consultar']
                    .filter(Boolean)
                    .join(' ')}
                </span>
              )}
            </span>
          </div>
          {!config && <p className="text-[13px] text-terracota-texto px-1">No pudimos cargar los datos de contacto. Recarga la página.</p>}
          <BotonEnvio
            href={config && mensaje ? linkWhatsApp(config, mensaje) : null}
            deshabilitado={!config}
            onClick={(e) => {
              if (revisar(e)) setEnviado(true)
            }}
            className="h-14 bg-tinta text-papel gap-2.5 text-[15px] font-medium"
          >
            <Icon name="whatsapp" size={20} strokeWidth={1.6} />
            Enviar pedido por WhatsApp
          </BotonEnvio>
          <BotonEnvio
            href={null}
            deshabilitado={!config}
            onClick={porInstagram}
            className="h-[50px] border border-tinta text-tinta gap-2.5 text-[14px]"
          >
            <Icon name="instagram" size={18} strokeWidth={1.6} />
            Prefiero Instagram (se copia el pedido)
          </BotonEnvio>
        </div>
      </div>
    </div>
  )
}

function Contador({ cantidad, cambiar, etiqueta }: { cantidad: number; cambiar: (n: number) => void; etiqueta: string }) {
  return (
    <div className="flex items-center border border-linea rounded-full shrink-0">
      <button type="button" aria-label={`Quitar uno · ${etiqueta}`} onClick={() => cambiar(cantidad - 1)} className="w-10 h-11 text-[18px]">
        −
      </button>
      <span className="w-4 text-center cifra">{cantidad}</span>
      <button type="button" aria-label={`Agregar uno · ${etiqueta}`} onClick={() => cambiar(cantidad + 1)} className="w-10 h-11 text-[18px]">
        +
      </button>
    </div>
  )
}

function TarjetaLinea({
  l,
  p,
  cambiar,
}: {
  l: LineaPedido
  p: ProductoCatalogo
  cambiar: (producto_id: string, color_id: string | null, cantidad: number) => void
}) {
  const unico = l.items.length === 1 ? l.items[0] : null
  const fotoColor = unico?.color_id ? p.colores.find((c) => c.id === unico.color_id)?.foto : null
  const pack = textoPack(l)
  // "Pack 2 · Rojo", "X3 (pack 2 + 1)", "Rojo"
  const detalle = [pack && pack.charAt(0).toUpperCase() + pack.slice(1), unico && textoColores(l)].filter(Boolean).join(' · ')
  return (
    <div className="bg-tarjeta border border-linea rounded-xl p-2.5 flex flex-col gap-2">
      <div className="flex gap-3 items-center">
        <img src={fotoUrl(fotoColor ?? p.foto_principal)} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0 bg-arena" />
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="font-serif text-[19px] font-semibold tracking-[0.12em] uppercase leading-tight cifra">{p.nombre}</div>
          {detalle && <div className="text-[13px] text-tinta-2 truncate">{detalle}</div>}
          <div className="text-[14px] font-medium cifra">{l.subtotal === null ? 'Consultar precio' : formatCLP(l.subtotal)}</div>
        </div>
        {unico && (
          <Contador
            cantidad={unico.cantidad}
            etiqueta={`${p.nombre}${unico.color ? ` ${unico.color}` : ''}`}
            cambiar={(n) => cambiar(l.producto_id, unico.color_id, n)}
          />
        )}
      </div>
      {!unico &&
        l.items.map((i) => (
          <div key={i.color_id ?? 'sin-color'} className="flex items-center justify-between gap-3 pl-[76px]">
            <span className="text-[14px] text-tinta-2">{i.color ?? p.nombre}</span>
            <Contador
              cantidad={i.cantidad}
              etiqueta={`${p.nombre}${i.color ? ` ${i.color}` : ''}`}
              cambiar={(n) => cambiar(l.producto_id, i.color_id, n)}
            />
          </div>
        ))}
    </div>
  )
}

function Opcion({
  valor,
  actual,
  elegir,
  titulo,
  detalle,
  precio,
}: {
  valor: Entrega
  actual: Entrega | null
  elegir: (e: Entrega) => void
  titulo: string
  detalle: string | null
  precio: ReactNode
}) {
  const activa = actual === valor
  return (
    <label
      className={`flex items-center gap-2.5 min-h-[52px] px-3 py-2 rounded-[10px] bg-tarjeta text-[14px] cursor-pointer ${
        activa ? 'border-[1.5px] border-tinta' : 'border border-linea'
      }`}
    >
      <input
        type="radio"
        name="entrega"
        checked={activa}
        onChange={() => elegir(valor)}
        className="w-[18px] h-[18px] shrink-0 accent-tinta"
      />
      <span className="flex-1 flex flex-col min-w-0">
        <span>{titulo}</span>
        {detalle && <span className="text-[11px] text-tinta-2 leading-snug">{detalle}</span>}
      </span>
      <span className="shrink-0">{precio}</span>
    </label>
  )
}
