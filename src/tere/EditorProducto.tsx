// Modo Tere · editor de producto (y producto nuevo). Fotos de color: pieza + modelo (regla del CLAUDE.md).
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useCatalogo, type ProductoCatalogo } from '../lib/catalogo'
import { formatCLP } from '../lib/format'
import {
  actualizarColor,
  actualizarProducto,
  crearColor,
  crearProducto,
  eliminarColor,
  guardarOrden,
  useDatosTere,
} from './datos'
import { activoAlGuardar, mover, slugify, slugUnico, validarProducto, type FormProducto } from './reglas'
import { Campo, EncabezadoTere, FotoSubible, inputTere, Interruptor, Resultado, Seccion, Texto } from './ui'

interface ColorEdit {
  key: string
  id: string | null
  nombre: string
  disponible: boolean
  foto: string | null
  foto_modelo: string | null
}

const sinPuntos = (n: number) => formatCLP(n).replace('$', '')

function formDesde(p: ProductoCatalogo | null, catId: string): FormProducto {
  return {
    nombre: p?.nombre ?? '',
    categoria_producto_id: p?.categoria_producto_id ?? catId,
    consultar: p?.consultar_precio ?? false,
    precio: p && !p.consultar_precio ? sinPuntos(p.precio) : '',
    conPack: p?.precio_pack != null,
    unidades_pack: p?.unidades_pack ? String(p.unidades_pack) : '2',
    precio_pack: p?.precio_pack ? sinPuntos(p.precio_pack) : '',
    descripcion: p?.descripcion ?? '',
  }
}

const coloresDesde = (p: ProductoCatalogo | null): ColorEdit[] =>
  (p?.colores ?? []).map((c) => ({ key: c.id, id: c.id, nombre: c.nombre, disponible: c.disponible, foto: c.foto, foto_modelo: c.foto_modelo }))

/** La ruta remonta el editor al cambiar de producto (key), así el formulario parte limpio. */
export function EditorProducto() {
  const { id } = useParams()
  return <Editor key={id ?? 'nuevo'} id={id ?? null} />
}

function Editor({ id }: { id: string | null }) {
  const { categorias, productos, recargar } = useDatosTere()
  const { edicion } = useCatalogo()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const p = id ? (productos.find((x) => x.id === id) ?? null) : null

  const [form, setForm] = useState(() => formDesde(p, params.get('cat') ?? categorias[0]?.id ?? ''))
  const [publicado, setPublicado] = useState(p?.publicado ?? true)
  const [disponible, setDisponible] = useState(p?.disponible ?? true)
  const [fotoPrincipal, setFotoPrincipal] = useState(p?.foto_principal ?? null)
  const [galeria, setGaleria] = useState<string[]>(p?.fotos ?? [])
  const [colores, setColores] = useState<ColorEdit[]>(() => coloresDesde(p))
  const [inicial] = useState(() => JSON.stringify([form, publicado, disponible, fotoPrincipal, galeria, colores]))
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<{ texto: string | null; error: string | null }>({ texto: null, error: null })

  const actual = JSON.stringify([form, publicado, disponible, fotoPrincipal, galeria, colores])
  const [guardadoComo, setGuardadoComo] = useState(inicial)
  const hayCambios = actual !== guardadoComo

  // Un cambio nuevo borra el "Guardado ✓" anterior (si no, parece que ya está guardado).
  useEffect(() => {
    if (hayCambios) setResultado((r) => (r.texto ? { texto: null, error: r.error } : r))
  }, [actual, hayCambios])

  useEffect(() => {
    if (!hayCambios) return
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [hayCambios])

  if (id && !p) {
    return (
      <div className="max-w-[480px] mx-auto">
        <EncabezadoTere titulo="Producto" />
        <p className="p-6 text-center text-tinta-2">Este producto ya no existe.</p>
      </div>
    )
  }

  const slugFotos = p?.slug ?? (slugify(form.nombre) || 'nuevo')
  const set = <K extends keyof FormProducto>(k: K, v: FormProducto[K]) => {
    setResultado({ texto: null, error: null })
    setForm((f) => ({ ...f, [k]: v }))
  }
  const puedeSalir = () => !hayCambios || window.confirm('Tienes cambios sin guardar. ¿Salir igual?')

  // Orden dentro de la categoría (se guarda al tiro, como en Finanzas).
  const listaCat = p ? productos.filter((x) => x.categoria_producto_id === p.categoria_producto_id) : []
  const posicion = p ? listaCat.findIndex((x) => x.id === p.id) : -1
  async function moverProducto(dir: -1 | 1) {
    try {
      await guardarOrden('productos', mover(listaCat, posicion, dir))
      await recargar()
    } catch (e) {
      setResultado({ texto: null, error: e instanceof Error ? e.message : 'No se pudo cambiar el orden.' })
    }
  }

  function cambiarColor(key: string, c: Partial<ColorEdit>) {
    setResultado({ texto: null, error: null })
    setColores((cs) => cs.map((x) => (x.key === key ? { ...x, ...c } : x)))
  }
  function moverColor(i: number, dir: -1 | 1) {
    const orden = mover(colores.map((c) => ({ ...c, id: c.key })), i, dir)
    setColores(orden.map((k) => colores.find((c) => c.key === k)!))
  }

  async function guardar() {
    const otros = productos.filter((x) => x.id !== p?.id)
    const v = validarProducto(form, otros.map((o) => o.nombre), p?.precio ?? null)
    if (typeof v === 'string') return setResultado({ texto: null, error: v })
    if (!fotoPrincipal) return setResultado({ texto: null, error: 'Sube la foto principal (la modelo usando la pieza).' })
    const nombresColor = colores.map((c) => c.nombre.trim().toLowerCase())
    if (nombresColor.some((n) => !n)) return setResultado({ texto: null, error: 'Ponle nombre a todos los colores.' })
    if (new Set(nombresColor).size !== nombresColor.length) return setResultado({ texto: null, error: 'Hay dos colores con el mismo nombre.' })

    const slug = !p || v.nombre !== p.nombre ? slugUnico(v.nombre, otros.map((o) => o.slug).filter((s): s is string => Boolean(s))) : p.slug
    const campos = {
      ...v,
      slug,
      publicado,
      disponible,
      foto_principal: fotoPrincipal,
      fotos: galeria,
      activo: activoAlGuardar(p, v.consultar_precio),
    }
    setGuardando(true)
    try {
      let productoId = p?.id
      if (p) {
        await actualizarProducto(p.id, campos)
      } else {
        const enCat = productos.filter((x) => x.categoria_producto_id === v.categoria_producto_id)
        productoId = await crearProducto({ ...campos, edicion, orden: Math.max(0, ...enCat.map((x) => x.orden)) + 1 })
      }
      // Colores: borrar los quitados, actualizar los que siguen y crear los nuevos, con su orden.
      const siguen = new Set(colores.map((c) => c.id).filter(Boolean))
      await Promise.all((p?.colores ?? []).filter((c) => !siguen.has(c.id)).map((c) => eliminarColor(c.id)))
      await Promise.all(
        colores.map((c, i) => {
          const datos = { nombre: c.nombre.trim(), disponible: c.disponible, foto: c.foto, foto_modelo: c.foto_modelo, orden: i + 1 }
          return c.id ? actualizarColor(c.id, datos) : crearColor(productoId!, datos)
        }),
      )
      await recargar()
      setGuardadoComo(actual)
      setResultado({ texto: 'Guardado ✓', error: null })
      if (!p) navigate(`/tere/p/${productoId}`, { replace: true })
    } catch (e) {
      setResultado({ texto: null, error: e instanceof Error ? e.message : 'Algo falló.' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <EncabezadoTere
        titulo={p ? p.nombre : 'Nuevo producto'}
        volverA={`/tere?cat=${form.categoria_producto_id}`}
        puedeSalir={puedeSalir}
        accion={
          p?.slug && p.publicado ? (
            <Link to={`/p/${p.slug}`} onClick={(e) => !puedeSalir() && e.preventDefault()} className="h-11 px-3 rounded-full border border-[#D9CBB4] text-[12px] flex items-center shrink-0">
              Ver en catálogo
            </Link>
          ) : undefined
        }
      />

      <div className="px-4 pt-4 pb-[120px] flex flex-col gap-3">
        <Seccion titulo="Foto principal y galería">
          <div className="flex gap-3 flex-wrap items-start">
            <FotoSubible ruta={fotoPrincipal} slug={slugFotos} etiqueta="Principal (modelo)" tamano="w-28 h-28" alSubir={setFotoPrincipal} />
            {galeria.map((r) => (
              <FotoSubible
                key={r}
                ruta={r}
                slug={slugFotos}
                etiqueta="Galería"
                alSubir={(nueva) => setGaleria((g) => g.map((x) => (x === r ? nueva : x)))}
                alQuitar={() => setGaleria((g) => g.filter((x) => x !== r))}
              />
            ))}
            <FotoSubible ruta={null} slug={slugFotos} etiqueta="Agregar a galería" alSubir={(nueva) => setGaleria((g) => [...g, nueva])} />
          </div>
          <p className="text-[12px] text-tinta-2">La principal es la que se ve en la grilla. La galería son fotos extra sin color.</p>
        </Seccion>

        <Seccion titulo="Datos">
          <Campo etiqueta="Nombre" ayuda={p ? 'Si lo cambias, también cambia en Ítaca Finanzas.' : undefined}>
            <Texto value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </Campo>
          <Campo etiqueta="Categoría">
            <select value={form.categoria_producto_id} onChange={(e) => set('categoria_producto_id', e.target.value)} className={inputTere}>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Interruptor activo={form.consultar} cambiar={(v) => set('consultar', v)} texto="Consultar precio" detalle="No muestra precio; la clienta te pregunta." />
          {!form.consultar && (
            <>
              <Campo etiqueta="Precio" ayuda="Se sincroniza con Ítaca Finanzas.">
                <Texto inputMode="numeric" value={form.precio} placeholder="45.000" onChange={(e) => set('precio', e.target.value)} />
              </Campo>
              <Interruptor activo={form.conPack} cambiar={(v) => set('conPack', v)} texto="Precio por pack" detalle="Ej.: 2 Aura por $40.990" />
              {form.conPack && (
                <div className="grid grid-cols-2 gap-2">
                  <Campo etiqueta="Unidades">
                    <Texto inputMode="numeric" value={form.unidades_pack} onChange={(e) => set('unidades_pack', e.target.value)} />
                  </Campo>
                  <Campo etiqueta="Precio pack">
                    <Texto inputMode="numeric" value={form.precio_pack} onChange={(e) => set('precio_pack', e.target.value)} />
                  </Campo>
                </div>
              )}
            </>
          )}
          <Campo etiqueta="Descripción (opcional)">
            <textarea
              value={form.descripcion}
              rows={3}
              maxLength={600}
              onChange={(e) => set('descripcion', e.target.value)}
              className="rounded-[10px] border border-linea bg-white px-3 py-2 text-[16px] outline-none focus:border-tierra resize-none"
            />
          </Campo>
        </Seccion>

        <Seccion titulo="En el catálogo">
          <Interruptor activo={publicado} cambiar={setPublicado} texto="Publicado" detalle="Si lo apagas, las clientas no lo ven." />
          <Interruptor activo={disponible} cambiar={setDisponible} texto="Disponible" detalle='Si lo apagas, se muestra "Agotado · Consultar".' />
          {p && listaCat.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[14px] flex-1">
                Posición {posicion + 1} de {listaCat.length}
              </span>
              <button type="button" disabled={posicion === 0} onClick={() => moverProducto(-1)} aria-label="Subir en la lista" className="w-11 h-11 rounded-full border border-linea disabled:opacity-30">
                ↑
              </button>
              <button type="button" disabled={posicion === listaCat.length - 1} onClick={() => moverProducto(1)} aria-label="Bajar en la lista" className="w-11 h-11 rounded-full border border-linea disabled:opacity-30">
                ↓
              </button>
            </div>
          )}
        </Seccion>

        <Seccion titulo="Colores">
          <p className="text-[12px] text-tinta-2 -mt-1.5">
            Cada color lleva <b>la pieza sola</b> y <b>la modelo usándola</b>. Al tocar el color, la clienta ve a la modelo con ese color. El primero
            con foto de modelo es el que aparece elegido.
          </p>
          {colores.map((c, i) => (
            <div key={c.key} className="border border-linea rounded-xl p-3 flex flex-col gap-2.5 bg-papel">
              <div className="flex gap-2 items-center">
                <Texto value={c.nombre} placeholder="Nombre del color" aria-label="Nombre del color" onChange={(e) => cambiarColor(c.key, { nombre: e.target.value })} />
                <button type="button" disabled={i === 0} onClick={() => moverColor(i, -1)} aria-label={`Subir ${c.nombre}`} className="w-11 h-11 shrink-0 rounded-full border border-linea disabled:opacity-30">
                  ↑
                </button>
                <button type="button" disabled={i === colores.length - 1} onClick={() => moverColor(i, 1)} aria-label={`Bajar ${c.nombre}`} className="w-11 h-11 shrink-0 rounded-full border border-linea disabled:opacity-30">
                  ↓
                </button>
              </div>
              <div className="flex gap-3 items-start">
                <FotoSubible ruta={c.foto} slug={slugFotos} etiqueta="Pieza" tamano="w-20 h-20" alSubir={(r) => cambiarColor(c.key, { foto: r })} />
                <FotoSubible ruta={c.foto_modelo} slug={slugFotos} etiqueta="Modelo" tamano="w-20 h-20" alSubir={(r) => cambiarColor(c.key, { foto_modelo: r })} alQuitar={() => cambiarColor(c.key, { foto_modelo: null })} />
                <div className="flex-1 flex flex-col gap-1">
                  <Interruptor activo={c.disponible} cambiar={(v) => cambiarColor(c.key, { disponible: v })} texto="Disponible" />
                  <button
                    type="button"
                    onClick={() => window.confirm(`¿Eliminar el color ${c.nombre || 'sin nombre'}?`) && setColores((cs) => cs.filter((x) => x.key !== c.key))}
                    className="self-start min-h-11 text-[13px] text-terracota-texto underline underline-offset-2"
                  >
                    Eliminar color
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setColores((cs) => [...cs, { key: crypto.randomUUID(), id: null, nombre: '', disponible: true, foto: null, foto_modelo: null }])}
            className="h-11 rounded-xl border-[1.5px] border-dashed border-tierra flex items-center justify-center gap-2 text-[14px]"
          >
            <Icon name="mas" size={16} strokeWidth={2} /> Agregar color
          </button>
        </Seccion>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-papel border-t border-linea">
        <div className="max-w-[480px] mx-auto px-4 pt-2.5 pb-[18px] flex flex-col gap-1.5">
          <Resultado {...resultado} />
          <button
            type="button"
            disabled={guardando || (!hayCambios && Boolean(p))}
            onClick={guardar}
            className="h-[54px] rounded-xl bg-tinta text-papel text-[14px] font-medium tracking-[0.16em] uppercase disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : p ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}
