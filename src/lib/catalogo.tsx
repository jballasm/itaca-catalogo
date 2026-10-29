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
      (prods.data as ProductoCatalogo[]).sort(porOrden).map((p) => ({ ...p, colores: [...p.colores].sort(porOrden) })),
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

/** Miniaturas del producto: foto de modelo + foto de cada color + galería (render 04). */
export function miniaturas(p: ProductoCatalogo): string[] {
  const rutas = [p.foto_principal, ...p.colores.map((c) => c.foto), ...p.fotos]
  return [...new Set(rutas.filter((r): r is string => Boolean(r)))]
}

/**
 * Foto de la grilla: la pieza sola (no la modelo). Es la del primer color disponible,
 * que por convención es el que usa la modelo, así al abrir el producto la foto de modelo
 * calza con lo que se tocó. Sin colores: primera foto de galería; si no hay, la principal.
 */
export function fotoGrilla(p: ProductoCatalogo): string | null {
  return colorPorDefecto(p)?.foto ?? p.fotos[0] ?? p.foto_principal
}

/** Primer color disponible: el que usa la modelo, el que queda elegido y el que agrega el "+" rápido. */
export function colorPorDefecto(p: ProductoCatalogo): ProductoColor | null {
  return p.colores.find((c) => c.disponible) ?? null
}

/** Link de WhatsApp con el texto ya escrito. */
export function linkWhatsApp(config: Config, texto: string): string {
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`
}
