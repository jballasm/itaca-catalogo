// Modo Tere · inicio (render/07-modo-tere): precios y disponibilidad rápidos, solicitudes y accesos.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { fotoUrl, type ProductoCatalogo } from '../lib/catalogo'
import { formatCLP } from '../lib/format'
import { supabase } from '../lib/supabase'
import { actualizarProducto, useDatosTere } from './datos'
import { activoAlGuardar, leerMonto } from './reglas'
import { Resultado } from './ui'

type Cambio = { precio?: string; disponible?: boolean }

export function Inicio() {
  const { categorias, productos, solicitudes, recargar } = useDatosTere()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [cambios, setCambios] = useState<Record<string, Cambio>>({})
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<{ texto: string | null; error: string | null }>({ texto: null, error: null })

  const catId = params.get('cat') ?? categorias.find((c) => !c.proximamente)?.id ?? categorias[0]?.id
  const lista = productos.filter((p) => p.categoria_producto_id === catId)
  const nuevas = solicitudes.filter((s) => s.estado === 'nueva').length
  const hayCambios = Object.keys(cambios).length > 0

  // Aviso del navegador si cierra o recarga con cambios sin guardar.
  useEffect(() => {
    if (!hayCambios) return
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [hayCambios])

  /** Navegar dentro de Modo Tere preguntando antes si hay cambios sin guardar. */
  function ir(to: string) {
    if (hayCambios && !window.confirm('Tienes cambios sin guardar. ¿Salir igual?')) return
    navigate(to)
  }

  function cambiar(p: ProductoCatalogo, c: Cambio) {
    setResultado({ texto: null, error: null })
    setCambios((prev) => {
      const nuevo = { ...prev[p.id], ...c }
      const precioOriginal = p.consultar_precio ? '' : String(p.precio)
      if (nuevo.precio !== undefined && nuevo.precio.replace(/\D/g, '') === precioOriginal) delete nuevo.precio
      if (nuevo.disponible === p.disponible) delete nuevo.disponible
      const resto = { ...prev }
      if (Object.keys(nuevo).length) resto[p.id] = nuevo
      else delete resto[p.id]
      return resto
    })
  }

  async function guardar() {
    // Validar todo antes de escribir nada.
    const escrituras: { p: ProductoCatalogo; datos: Parameters<typeof actualizarProducto>[1] }[] = []
    for (const [id, c] of Object.entries(cambios)) {
      const p = productos.find((x) => x.id === id)
      if (!p) continue
      const datos: Parameters<typeof actualizarProducto>[1] = {}
      if (c.precio !== undefined) {
        const precio = leerMonto(c.precio)
        if (!precio || precio <= 0) return setResultado({ texto: null, error: `Revisa el precio de ${p.nombre}.` })
        if (p.precio_pack != null && p.unidades_pack && p.precio_pack >= precio * p.unidades_pack) {
          return setResultado({ texto: null, error: `Con ese precio, el pack de ${p.nombre} quedaría más caro que comprar sueltas. Cámbialo en su ficha.` })
        }
        Object.assign(datos, { precio, consultar_precio: false, activo: activoAlGuardar(p, false) })
      }
      if (c.disponible !== undefined) datos.disponible = c.disponible
      escrituras.push({ p, datos })
    }
    setGuardando(true)
    try {
      await Promise.all(escrituras.map(({ p, datos }) => actualizarProducto(p.id, datos)))
      setCambios({})
      await recargar()
      setResultado({ texto: 'Guardado ✓ · también en Ítaca Finanzas', error: null })
    } catch (e) {
      setResultado({ texto: null, error: e instanceof Error ? e.message : 'Algo falló.' })
    } finally {
      setGuardando(false)
    }
  }

  const contar = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of productos) m.set(p.categoria_producto_id, (m.get(p.categoria_producto_id) ?? 0) + 1)
    return m
  }, [productos])

  return (
    <div className="max-w-[480px] mx-auto min-h-dvh flex flex-col">
      <header className="bg-tinta text-papel px-5 py-3.5 flex justify-between items-center gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] tracking-[0.26em] text-[#D9CBB4]">MODO EDITORA</span>
          <span className="font-serif text-[22px] font-semibold">Hola, Tere</span>
        </div>
        <button
          type="button"
          onClick={() => ir('/categorias')}
          className="h-11 px-3.5 rounded-full border border-[#D9CBB4] text-[13px] shrink-0"
        >
          Ver como clienta
        </button>
      </header>

      <div className="flex gap-2.5 items-center px-5 py-2.5 bg-oliva-fondo text-[13px] text-[#3E4A16]">
        <Icon name="check" size={18} />
        Precios sincronizados con Ítaca Finanzas
      </div>

      <div className="px-5 pt-3.5 pb-[110px] flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => ir('/tere/solicitudes')}
          className="min-h-[60px] rounded-xl border border-tierra bg-tarjeta flex items-center gap-3 px-3.5 py-2 text-left"
        >
          <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-medium text-[14px] ${nuevas ? 'bg-tierra text-white' : 'bg-arena text-tinta-2'}`}>
            {nuevas}
          </span>
          <span className="flex-1 flex flex-col">
            <span className="font-medium text-[14px]">Solicitudes de personalización</span>
            <span className="text-[12px] text-tinta-2">{nuevas === 1 ? '1 nueva' : `${nuevas} nuevas`} · {solicitudes.length} en total</span>
          </span>
          <Icon name="siguiente" size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => ir(`/tere/nuevo?cat=${catId ?? ''}`)}
          className="h-12 rounded-xl border-[1.5px] border-dashed border-tierra flex items-center justify-center gap-2 text-[14px] font-medium"
        >
          <Icon name="mas" size={18} strokeWidth={2} /> Nuevo producto con foto
        </button>

        <nav aria-label="Categorías" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] mt-0.5 -mx-5 px-5">
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === catId}
              onClick={() => setParams({ cat: c.id }, { replace: true })}
              className={`h-9 shrink-0 px-3 rounded-full text-[13px] ${
                c.id === catId
                  ? 'bg-tinta text-papel font-medium'
                  : c.proximamente
                    ? 'border border-dashed border-[#B9AC97] text-tinta-2'
                    : 'border border-linea'
              }`}
            >
              {c.nombre} {contar.get(c.id) ? contar.get(c.id) : ''}
            </button>
          ))}
        </nav>

        {lista.length === 0 && (
          <p className="text-[14px] text-tinta-2 text-center py-6">
            Aún no hay productos en esta categoría.
            {categorias.find((c) => c.id === catId)?.proximamente && ' Se muestra como "Próximamente" en el catálogo.'}
          </p>
        )}

        {lista.map((p) => {
          const c = cambios[p.id] ?? {}
          const disponible = c.disponible ?? p.disponible
          const precio = c.precio ?? (p.consultar_precio ? '' : formatCLP(p.precio).replace('$', ''))
          const miniatura = p.colores.find((x) => x.foto)?.foto ?? p.foto_principal
          return (
            <div key={p.id} className={`bg-tarjeta border rounded-xl p-2.5 flex gap-3 items-center ${cambios[p.id] ? 'border-tierra' : 'border-linea'}`}>
              <button type="button" onClick={() => ir(`/tere/p/${p.id}`)} aria-label={`Editar ${p.nombre}`} className="shrink-0">
                <img src={fotoUrl(miniatura)} alt="" className={`w-14 h-14 object-cover rounded-lg bg-arena ${disponible ? '' : 'opacity-55'}`} />
              </button>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <button type="button" onClick={() => ir(`/tere/p/${p.id}`)} className="text-left flex items-center gap-1.5 min-w-0">
                  <span className="font-serif text-[18px] font-semibold tracking-[0.12em] uppercase truncate cifra">{p.nombre}</span>
                  {!p.publicado && <span className="text-[10px] tracking-[0.1em] uppercase bg-arena text-tinta-2 rounded px-1.5 py-0.5 shrink-0">Oculto</span>}
                  <Icon name="siguiente" size={14} className="text-tinta-2 shrink-0" />
                </button>
                <label className="flex items-center gap-1.5 text-[13px] text-tinta-2">
                  $
                  <input
                    type="text"
                    inputMode="numeric"
                    value={precio}
                    placeholder={p.consultar_precio ? 'Consultar' : ''}
                    aria-label={`Precio ${p.nombre}`}
                    onChange={(e) => cambiar(p, { precio: e.target.value })}
                    className="w-[96px] h-9 rounded-lg border border-linea bg-white px-2.5 text-[16px] font-medium text-tinta cifra outline-none focus:border-tierra"
                  />
                  {p.precio_pack != null && <span className="text-[11px]">pack {p.unidades_pack}: {formatCLP(p.precio_pack)}</span>}
                </label>
              </div>
              <label className={`flex flex-col items-center gap-1 text-[11px] min-w-[64px] ${disponible ? 'text-[#3E4A16]' : 'text-[#9A4524]'}`}>
                <input
                  type="checkbox"
                  checked={disponible}
                  onChange={(e) => cambiar(p, { disponible: e.target.checked })}
                  className="w-6 h-6 accent-oliva"
                />
                {disponible ? 'Disponible' : 'Agotado'}
              </label>
            </div>
          )
        })}

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={() => ir('/tere/ajustes')} className="flex-1 h-11 rounded-full border border-linea text-[14px]">
            Ajustes
          </button>
          <button
            type="button"
            onClick={() => {
              if (hayCambios && !window.confirm('Tienes cambios sin guardar. ¿Salir igual?')) return
              void supabase.auth.signOut()
            }}
            className="flex-1 h-11 rounded-full border border-linea text-[14px] text-tinta-2"
          >
            Salir
          </button>
        </div>
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
            {guardando ? 'Guardando…' : hayCambios ? `Guardar cambios (${Object.keys(cambios).length})` : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

