// Datos de Modo Tere: todo lo de Tere (también lo no publicado) y las escrituras.
// Los permisos los da RLS: policy "propios" (Finanzas) y las de 101/102 para solicitudes y fotos.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCatalogo, type ProductoCatalogo } from '../lib/catalogo'
import { supabase } from '../lib/supabase'
import type { CategoriaProducto, Config, EstadoSolicitud, Producto, ProductoColor, SolicitudPersonalizacion } from '../lib/types'

type Estado = 'cargando' | 'error' | 'listo'

interface DatosTere {
  estado: Estado
  categorias: CategoriaProducto[]
  productos: ProductoCatalogo[]
  config: Config | null
  solicitudes: SolicitudPersonalizacion[]
  recargar: () => Promise<void>
}

const Ctx = createContext<DatosTere | null>(null)
const porOrden = <T extends { orden: number; nombre: string }>(a: T, b: T) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)

/** Mensaje en español para errores de Supabase. */
export function mensajeError(e: { code?: string; message?: string } | null | undefined): string {
  if (!e) return 'Algo falló. Intenta otra vez.'
  if (e.code === '23505') return 'Ya existe un producto con ese nombre.'
  if (/fetch|network/i.test(e.message ?? '')) return 'Sin conexión. Revisa tu internet e intenta otra vez.'
  if (e.code === '42501' || /permission|row-level/i.test(e.message ?? '')) return 'No tienes permiso para hacer este cambio.'
  return 'Algo falló. Intenta otra vez.'
}

function ok<T>({ data, error }: { data: T; error: { code?: string; message?: string } | null }): T {
  if (error) throw new Error(mensajeError(error))
  return data
}

export function DatosTereProvider({ children }: { children: ReactNode }) {
  const catalogo = useCatalogo()
  const [estado, setEstado] = useState<Estado>('cargando')
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([])
  const [productos, setProductos] = useState<ProductoCatalogo[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [solicitudes, setSolicitudes] = useState<SolicitudPersonalizacion[]>([])
  const refrescarCatalogo = catalogo.reintentar

  const recargar = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id
    const [cats, prods, conf, sols] = await Promise.all([
      supabase.from('categorias_producto').select('*').eq('user_id', uid ?? ''),
      supabase.from('productos').select('*, colores:producto_colores(*)').eq('user_id', uid ?? ''),
      supabase.from('config').select('*').eq('user_id', uid ?? ''),
      supabase.from('solicitudes_personalizacion').select('*').order('created_at', { ascending: false }),
    ])
    if (cats.error || prods.error || conf.error || sols.error) {
      setEstado('error')
      return
    }
    setCategorias((cats.data as CategoriaProducto[]).sort(porOrden))
    setProductos((prods.data as ProductoCatalogo[]).sort(porOrden).map((p) => ({ ...p, colores: [...p.colores].sort(porOrden) })))
    setConfig((conf.data as Config[])[0] ?? null)
    setSolicitudes(sols.data as SolicitudPersonalizacion[])
    setEstado('listo')
    // Para que "Ver como clienta" muestre lo recién guardado.
    void refrescarCatalogo()
  }, [refrescarCatalogo])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const valor = useMemo(
    () => ({ estado, categorias, productos, config, solicitudes, recargar }),
    [estado, categorias, productos, config, solicitudes, recargar],
  )
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useDatosTere(): DatosTere {
  const c = useContext(Ctx)
  if (!c) throw new Error('useDatosTere fuera de DatosTereProvider')
  return c
}

// --- Escrituras (cada una lanza Error con mensaje en español) ---

export type CambiosProducto = Partial<
  Pick<
    Producto,
    | 'nombre' | 'slug' | 'categoria_producto_id' | 'precio' | 'precio_pack' | 'unidades_pack' | 'consultar_precio'
    | 'activo' | 'descripcion' | 'publicado' | 'disponible' | 'orden' | 'foto_principal' | 'fotos' | 'edicion'
  >
>

export async function actualizarProducto(id: string, cambios: CambiosProducto): Promise<void> {
  ok(await supabase.from('productos').update(cambios).eq('id', id))
}

/** Crea un producto (user_id lo pone la base con auth.uid()) y devuelve su id. */
export async function crearProducto(campos: CambiosProducto & Pick<Producto, 'nombre' | 'categoria_producto_id' | 'precio'>): Promise<string> {
  const fila = ok(await supabase.from('productos').insert(campos).select('id').single())
  if (!fila) throw new Error('No se pudo crear el producto. Intenta otra vez.')
  return fila.id
}

export type CambiosColor = Partial<Pick<ProductoColor, 'nombre' | 'foto' | 'foto_modelo' | 'disponible' | 'orden'>>

export async function crearColor(producto_id: string, campos: CambiosColor & Pick<ProductoColor, 'nombre'>): Promise<void> {
  ok(await supabase.from('producto_colores').insert({ producto_id, ...campos }))
}

export async function actualizarColor(id: string, cambios: CambiosColor): Promise<void> {
  ok(await supabase.from('producto_colores').update(cambios).eq('id', id))
}

export async function eliminarColor(id: string): Promise<void> {
  ok(await supabase.from('producto_colores').delete().eq('id', id))
}

/** Guarda un orden nuevo (lista de ids) en productos o colores. */
export async function guardarOrden(tabla: 'productos' | 'producto_colores', ids: string[]): Promise<void> {
  await Promise.all(ids.map(async (id, i) => ok(await supabase.from(tabla).update({ orden: i + 1 }).eq('id', id))))
}

export async function actualizarCategoria(id: string, cambios: Partial<Pick<CategoriaProducto, 'proximamente' | 'foto_portada'>>): Promise<void> {
  ok(await supabase.from('categorias_producto').update(cambios).eq('id', id))
}

export async function actualizarConfig(user_id: string, cambios: Partial<Omit<Config, 'user_id'>>): Promise<void> {
  ok(await supabase.from('config').update(cambios).eq('user_id', user_id))
}

export async function cambiarEstadoSolicitud(id: string, estado: EstadoSolicitud): Promise<void> {
  ok(await supabase.from('solicitudes_personalizacion').update({ estado }).eq('id', id))
}

/** Borra la solicitud y su foto de referencia. */
export async function eliminarSolicitud(s: SolicitudPersonalizacion): Promise<void> {
  ok(await supabase.from('solicitudes_personalizacion').delete().eq('id', s.id))
  if (s.foto_path) await supabase.storage.from('referencias').remove([s.foto_path])
}

export function fotoReferenciaUrl(path: string): string {
  return supabase.storage.from('referencias').getPublicUrl(path).data.publicUrl
}
