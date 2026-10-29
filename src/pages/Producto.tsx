// Producto (render/04-producto). Link para compartir: #/p/<slug>.
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BotonFlotante, EstadoCatalogo, Mensaje, useAviso } from '../components/catalogo'
import { Icon } from '../components/Icon'
import { useCarrito } from '../lib/carrito'
import { colorPorDefecto, fotoUrl, linkWhatsApp, miniaturas, useCatalogo, type ProductoCatalogo } from '../lib/catalogo'
import { formatCLP } from '../lib/format'
import { subtotal } from '../lib/pedido'

export function Producto() {
  const { slug } = useParams()
  const { estado, productos } = useCatalogo()
  if (estado !== 'listo') return <EstadoCatalogo />
  const p = productos.find((x) => x.slug === slug)
  if (!p) return <Mensaje titulo="No encontrado" texto="Este producto ya no está en el catálogo." />
  // key: al pasar de un producto a otro se reinicia la foto, el color y la cantidad.
  return <Ficha key={p.id} p={p} />
}

function Ficha({ p }: { p: ProductoCatalogo }) {
  const { categorias, config } = useCatalogo()
  const { agregar, resumen } = useCarrito()
  const [aviso, mostrarAviso] = useAviso()
  const [colorId, setColorId] = useState<string | null>(colorPorDefecto(p)?.id ?? null)
  const [foto, setFoto] = useState(p.foto_principal)
  const [cantidad, setCantidad] = useState(1)

  const cat = categorias.find((c) => c.id === p.categoria_producto_id)
  const color = p.colores.find((c) => c.id === colorId) ?? null
  const agotado = !p.disponible || (p.colores.length > 0 && !p.colores.some((c) => c.disponible))
  const thumbs = miniaturas(p)

  function elegirColor(id: string) {
    const c = p.colores.find((x) => x.id === id)
    if (!c?.disponible) return
    setColorId(id)
    if (c.foto) setFoto(c.foto)
  }

  function elegirFoto(ruta: string) {
    setFoto(ruta)
    const c = p.colores.find((x) => x.foto === ruta && x.disponible)
    if (c) setColorId(c.id)
  }

  function agregarAlPedido() {
    agregar(p.id, color?.id ?? null, cantidad)
    mostrarAviso(`Agregado · ${p.nombre}${color ? ` (${color.nombre})` : ''}${cantidad > 1 ? ` x${cantidad}` : ''}`)
    setCantidad(1)
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <div className="relative h-[400px] shrink-0 bg-arena">
        <img src={fotoUrl(foto)} alt={`${cat?.nombre ?? ''} ${p.nombre}`} className="w-full h-full object-cover object-[50%_30%]" />
        <BotonFlotante to={cat ? `/c/${cat.slug}` : '/categorias'} label={`Volver a ${cat?.nombre ?? 'categorías'}`} className="left-4">
          <Icon name="volver" size={20} />
        </BotonFlotante>
        <BotonFlotante
          to="/pedido"
          label={`Tu pedido, ${resumen.unidades} ${resumen.unidades === 1 ? 'producto' : 'productos'}`}
          className="right-4"
        >
          <Icon name="bolsa" size={20} strokeWidth={1.5} />
          {resumen.unidades > 0 && (
            <span className="absolute top-1 right-0.5 min-w-4 h-4 px-1 rounded-full bg-tierra text-white text-[10px] flex items-center justify-center">
              {resumen.unidades}
            </span>
          )}
        </BotonFlotante>
      </div>

      <div className="relative -mt-[22px] bg-papel rounded-t-[22px] px-5 pt-3.5 pb-[110px] flex flex-col gap-4 flex-1">
        <div className="self-center w-10 h-1 rounded-full bg-linea" aria-hidden="true" />

        {thumbs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] -mx-5 px-5 py-0.5">
            {thumbs.map((r) => (
              <button
                key={r}
                type="button"
                aria-label="Ver foto"
                aria-pressed={r === foto}
                onClick={() => elegirFoto(r)}
                className={`shrink-0 rounded-md ${r === foto ? 'ring-2 ring-tinta' : ''}`}
              >
                <img src={fotoUrl(r)} alt="" loading="lazy" className="w-[58px] h-[58px] object-cover rounded-md" />
              </button>
            ))}
          </div>
        )}

        {/* flex-wrap: si el nombre es largo, el precio baja a la línea siguiente en vez de partir el nombre. */}
        <div className="flex flex-wrap justify-between items-end gap-x-3 gap-y-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            {cat && <div className="text-[11px] tracking-[0.28em] text-tinta-2 uppercase">{cat.nombre}</div>}
            <h1
              className={`font-serif font-semibold tracking-[0.18em] leading-[1.1] uppercase cifra ${
                p.nombre.length > 8 ? 'text-[30px]' : 'text-[36px]'
              }`}
            >
              {p.nombre}
            </h1>
          </div>
          <div className="text-right ml-auto">
            {p.consultar_precio ? (
              <div className="font-serif italic text-[20px] text-tinta-2">Consultar precio</div>
            ) : (
              <>
                <div className="font-serif text-[26px] font-semibold cifra">{formatCLP(p.precio)}</div>
                {p.precio_pack != null && p.unidades_pack && (
                  <div className="text-[13px] text-tierra">
                    {p.unidades_pack} por {formatCLP(p.precio_pack)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {p.descripcion && <p className="text-[15px] text-tinta-2 leading-relaxed">{p.descripcion}</p>}

        {p.colores.length > 0 && (
          <fieldset className="flex flex-col gap-2.5">
            <legend className="text-[12px] tracking-[0.2em] text-tinta-2 uppercase mb-2.5">Elige color</legend>
            <div className="grid grid-cols-2 gap-2">
              {p.colores.map((c) => {
                const activo = c.id === colorId
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={activo}
                    disabled={!c.disponible}
                    onClick={() => elegirColor(c.id)}
                    className={`h-[54px] rounded-xl flex items-center gap-2.5 px-2.5 text-[14px] text-left text-tinta disabled:opacity-45 ${
                      activo ? 'border-[1.5px] border-tinta bg-tarjeta font-medium' : 'border border-linea'
                    }`}
                  >
                    {c.foto && <img src={fotoUrl(c.foto)} alt="" className="w-[34px] h-[34px] shrink-0 object-cover rounded-full" />}
                    <span className="leading-tight">
                      {c.nombre}
                      {!c.disponible && <span className="block text-[11px] text-tinta-2">Agotado</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </div>

      {aviso}

      <div className="fixed inset-x-0 bottom-0 z-20 bg-papel border-t border-linea">
        <div className="max-w-[480px] mx-auto px-4 pt-3.5 pb-[22px] flex gap-2.5 items-center">
          {agotado ? (
            <a
              href={config ? linkWhatsApp(config, `¡Hola Tere! Quería consultar por ${p.nombre}.`) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-14 rounded-full border border-tinta text-tinta flex items-center justify-center text-[14px] font-medium tracking-[0.06em]"
            >
              Agotado · Consultar
            </a>
          ) : (
            <>
              <div className="flex items-center border border-linea rounded-full h-14 shrink-0">
                <button
                  type="button"
                  aria-label="Menos"
                  disabled={cantidad <= 1}
                  onClick={() => setCantidad(cantidad - 1)}
                  className="w-[46px] h-full text-[20px] disabled:opacity-35"
                >
                  −
                </button>
                <span className="w-5 text-center font-medium cifra" aria-live="polite">
                  {cantidad}
                </span>
                <button type="button" aria-label="Más" onClick={() => setCantidad(cantidad + 1)} className="w-[46px] h-full text-[20px]">
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={agregarAlPedido}
                className="flex-1 h-14 rounded-full bg-tinta text-papel flex items-center justify-center text-[14px] font-medium tracking-[0.06em] active:opacity-80"
              >
                {p.consultar_precio ? 'Agregar al pedido' : `Agregar · ${formatCLP(subtotal(p, cantidad))}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
