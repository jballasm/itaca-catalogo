// Fotos de referencia de las clientas (personalización): comprimir y subir al bucket "referencias".
import { supabase } from './supabase'

const TIPOS = /^image\/(jpeg|png|webp|heic|heif)$/i
const MAX_ORIGINAL = 25 * 1024 * 1024 // fotos de celular grandes: se comprimen antes de subir

export class ErrorFoto extends Error {}

/** La librería de compresión (~50 KB) se descarga recién cuando alguien elige una foto. */
async function comprimir(file: File, maxSizeMB: number, initialQuality: number): Promise<Blob> {
  const { default: imageCompression } = await import('browser-image-compression')
  return imageCompression(file, { maxWidthOrHeight: 1600, maxSizeMB, fileType: 'image/jpeg', initialQuality, useWebWorker: true })
}

/** Que sea una imagen de tamaño razonable. Algunos selectores de Android la entregan sin tipo: se acepta por la extensión. */
function revisarArchivo(file: File) {
  const esImagen = TIPOS.test(file.type) || (!file.type && /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))
  if (!esImagen || file.size > MAX_ORIGINAL) throw new ErrorFoto('Esa foto no se pudo usar, prueba con otra.')
}

/**
 * Comprime a JPEG (máx. 1600 px, ~400 KB). JPEG y no WebP: Safari no genera WebP de forma confiable.
 * El bucket acepta como máximo 5 MB; aquí queda muy por debajo.
 */
export async function prepararReferencia(file: File): Promise<Blob> {
  revisarArchivo(file)
  try {
    return await comprimir(file, 0.4, 0.82)
  } catch {
    throw new ErrorFoto('Esa foto no se pudo usar, prueba con otra.')
  }
}

/** Sube a referencias/<uuid>.jpg (nombre impredecible, plan §6.3) y devuelve la ruta y la URL pública. */
export async function subirReferencia(foto: Blob): Promise<{ path: string; url: string }> {
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('referencias').upload(path, foto, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new ErrorFoto('No pudimos subir la foto, revisa tu conexión.')
  return { path, url: supabase.storage.from('referencias').getPublicUrl(path).data.publicUrl }
}

// --- Fotos del catálogo que sube Tere (Modo Tere) ---

/** JPEG máx. 1600 px (~500 KB). Mismo motivo que las referencias: Safari no genera WebP confiable. */
export async function prepararFotoCatalogo(file: File): Promise<Blob> {
  revisarArchivo(file)
  try {
    return await comprimir(file, 0.5, 0.85)
  } catch {
    throw new ErrorFoto('Esa foto no se pudo usar, prueba con otra.')
  }
}

/**
 * Sube a catalogo/productos/<slug>/<uuid>.jpg y devuelve la ruta (lo que se guarda en la base).
 * Nombre nuevo cada vez: así el celular no muestra la foto vieja guardada en caché.
 */
export async function subirFotoCatalogo(foto: Blob, slug: string): Promise<string> {
  const path = `productos/${slug || 'sin-nombre'}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('catalogo').upload(path, foto, { contentType: 'image/jpeg', upsert: false })
  if (error) throw new ErrorFoto('No pudimos subir la foto, revisa tu conexión.')
  return path
}
