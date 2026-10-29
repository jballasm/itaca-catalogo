// Datos del catálogo: una sola carga al abrir la app (son pocos productos).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { CategoriaProducto, Config, Producto, ProductoColor } from './types'

export type ProductoCatalogo = Producto & { colores: ProductoColor[] }

type Estado = 'cargando' | 'error' | 'listo'

interface CatalogoCtx {
  estado: Estado
  categorias: CategoriaProducto[]
  productos: ProductoCatalogo[]
  config: Config | null
  /** "Edición 01": la edición más común de los productos. */
  edicion: string
  reintentar: () => void
}

const Ctx = createContext<CatalogoCtx | null>(null)

const porOrden = <T extends { orden: number; nombre: string }>(a: T, b: T) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)

function edicionPrincipal(productos: { edicion: string | null }[]): string {
  const c = new Map<string, number>()
  for (const p of productos) if (p.edicion) c.set(p.edicion, (c.get(p.edicion) ?? 0) + 1)
  return [...c].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Edición 01'
}

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([])
  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [config, setConfig] = useState<Config | null>(null)

  const cargar = useCallback(async () => {
    setEstado('cargando')
    const [cats, prods, conf] = await Promise.all([
      supabase.from('categorias_producto').select('*'),
      // Tere con sesión ve también lo no publicado (policy "propios"): se filtra aquí.
      supabase.from('productos').select('*, colores:producto_colores(*)').eq('publicado', true),
      supabase.from('config').select('*').limit(1),
    ])
    if (cats.error || prods.error || conf.error) {
      setEstado('error')
      return
    }
    setCategorias((cats.data as CategoriaProducto[]).sort(porOrden))
    setProductos(
      (prods.data as ProductoCatalogo[])
        // Resguardo: un producto sin foto (por ejemplo, creado desde Finanzas) no se muestra roto.
        .filter((p) => Boolean(p.foto_principal))
        .sort(porOrden)
        .map((p) => ({ ...p, colores: [...p.colores].sort(porOrden) })),
    )
    setConfig((conf.data as Config[])[0] ?? null)
    setEstado('listo')
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const valor = useMemo(
    () => ({ estado, categorias, productos, config, edicion: edicionPrincipal(productos), reintentar: cargar }),
    [estado, categorias, productos, config, cargar],
  )
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCatalogo(): CatalogoCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCatalogo fuera de CatalogoProvider')
  return c
}

/** URL pública de una foto guardada como ruta dentro del bucket "catalogo". */
export function fotoUrl(ruta: string | null | undefined): string | undefined {
  if (!ruta) return undefined
  return supabase.storage.from('catalogo').getPublicUrl(ruta).data.publicUrl
}

/**
 * Miniaturas del producto (render 04): foto principal, la pieza de cada color y la galería.
 * Las de color llevan colorId: al tocarlas se elige ese color (y se ve la modelo con él).
 */
export function miniaturas(p: ProductoCatalogo): { ruta: string; colorId: string | null }[] {
  const lista = [
    { ruta: p.foto_principal, colorId: null },
    ...p.colores.map((c) => ({ ruta: c.foto, colorId: c.id })),
    ...p.fotos.map((ruta) => ({ ruta, colorId: null })),
  ]
  const vistas = new Set<string>()
  return lista.filter((m): m is { ruta: string; colorId: string | null } => {
    if (!m.ruta || vistas.has(m.ruta)) return false
    vistas.add(m.ruta)
    return true
  })
}

/**
 * Color elegido al abrir el producto (y el que agrega el "+" rápido): el primero disponible
 * que tiene foto con la modelo; si ninguno tiene, el primero disponible.
 */
export function colorPorDefecto(p: ProductoCatalogo): ProductoColor | null {
  const disponibles = p.colores.filter((c) => c.disponible)
  return disponibles.find((c) => c.foto_modelo) ?? disponibles[0] ?? null
}

/** Foto grande al elegir un color: la modelo con ese color; si no hay, la pieza sola. */
export function fotoDeColor(c: ProductoColor): string | null {
  return c.foto_modelo ?? c.foto
}

/** Link de WhatsApp con el texto ya escrito. */
export function linkWhatsApp(config: Config, texto: string): string {
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`
}
