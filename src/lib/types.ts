// Tipos de las tablas de Supabase.
// Base: ../Itaca-Finanzas/supabase/migrations/001_schema.sql (dueño del esquema).
// Columnas y tablas marcadas "catálogo" existen recién tras las migraciones de
// supabase/migrations/ de este proyecto (plan §6).

export interface CategoriaProducto {
  id: string
  user_id: string
  nombre: string
  orden: number
  proximamente: boolean
  // catálogo
  slug: string | null
  foto_portada: string | null
  publicada: boolean
  descripcion: string | null
}

export interface Producto {
  id: string
  user_id: string
  categoria_producto_id: string
  nombre: string
  /** null = "Consultar precio" (catálogo; en Finanzas hoy es not null). */
  precio: number | null
  precio_pack: number | null
  unidades_pack: number | null
  edicion: string | null
  activo: boolean
  // catálogo
  slug: string | null
  descripcion: string | null
  publicado: boolean
  disponible: boolean
  orden: number
  /** Foto de modelo: la que va en la grilla. */
  foto_principal: string | null
  /** Galería de detalles. */
  fotos: string[]
}

// --- Tablas nuevas del catálogo ---

export interface ProductoColor {
  id: string
  user_id: string
  producto_id: string
  nombre: string
  foto: string | null
  disponible: boolean
  orden: number
}

export interface Config {
  user_id: string
  whatsapp: string
  instagram: string
  envio_comunas: string[]
  envio_precio: number
  retiro_texto: string
  starken_texto: string
  personalizacion_costo: number
  personalizacion_dias: number
}

export type CanalContacto = 'whatsapp' | 'instagram'
export type EstadoSolicitud = 'nueva' | 'contactada' | 'cerrada'

export interface SolicitudPersonalizacion {
  id: string
  created_at: string
  nombre: string | null
  idea: string
  foto_path: string | null
  canal: CanalContacto
  estado: EstadoSolicitud
}
