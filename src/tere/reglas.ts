// Lógica pura de Modo Tere (tests/tere.test.ts).

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Igual que public.slugify() en supabase/migrations/101_catalogo_esquema.sql y scripts/semilla.mjs. */
export function slugify(s: string): string {
  return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Slug libre: "delos", y si ya existe "delos-2", "delos-3"… (`existentes`: los de los otros productos). */
export function slugUnico(nombre: string, existentes: string[]): string {
  const base = slugify(nombre) || 'producto'
  const usados = new Set(existentes)
  if (!usados.has(base)) return base
  let n = 2
  while (usados.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export interface FormProducto {
  nombre: string
  categoria_producto_id: string
  consultar: boolean
  precio: string
  conPack: boolean
  unidades_pack: string
  precio_pack: string
  descripcion: string
}

export interface ProductoValido {
  nombre: string
  categoria_producto_id: string
  precio: number
  consultar_precio: boolean
  precio_pack: number | null
  unidades_pack: number | null
  descripcion: string | null
}

const entero = (s: string) => Number(s.replace(/\D/g, '') || 'NaN')

/**
 * Valida el formulario. Mismas reglas de precio y pack que Finanzas (src/catalogo/reglas.ts).
 * Con "Consultar precio" se conserva el precio que tenía (Finanzas lo necesita no nulo), o 0 si es nuevo.
 */
export function validarProducto(f: FormProducto, nombresOtros: string[], precioAnterior: number | null): ProductoValido | string {
  const nombre = f.nombre.trim().replace(/\s+/g, ' ')
  if (!nombre) return 'Ponle un nombre al producto.'
  if (nombresOtros.some((n) => norm(n) === norm(nombre))) return `Ya existe un producto llamado ${nombre}.`
  if (!f.categoria_producto_id) return 'Elige una categoría.'
  const descripcion = f.descripcion.trim() || null

  if (f.consultar) {
    return { nombre, categoria_producto_id: f.categoria_producto_id, precio: precioAnterior ?? 0, consultar_precio: true, precio_pack: null, unidades_pack: null, descripcion }
  }

  const precio = entero(f.precio)
  if (!Number.isFinite(precio) || precio <= 0) return 'Ingresa el precio o marca "Consultar precio".'
  let precio_pack: number | null = null
  let unidades_pack: number | null = null
  if (f.conPack) {
    unidades_pack = entero(f.unidades_pack)
    precio_pack = entero(f.precio_pack)
    if (!Number.isFinite(unidades_pack) || unidades_pack < 2) return 'El pack tiene que ser de 2 o más unidades.'
    if (!Number.isFinite(precio_pack) || precio_pack <= 0) return 'Ingresa el precio del pack.'
    if (precio_pack >= precio * unidades_pack) return 'El pack debería costar menos que comprar las unidades por separado.'
  }
  return { nombre, categoria_producto_id: f.categoria_producto_id, precio, consultar_precio: false, precio_pack, unidades_pack, descripcion }
}

/**
 * `activo` es de Finanzas (aparece en "Registrar venta"). Regla del CLAUDE.md:
 * nuevo → activo si tiene precio; si sale de "Consultar precio" → activo; si no, no se toca.
 */
export function activoAlGuardar(antes: { consultar_precio: boolean; activo: boolean } | null, consultarAhora: boolean): boolean {
  if (!antes) return !consultarAhora
  if (antes.consultar_precio && !consultarAhora) return true
  return antes.activo
}

/** "+56 9 1234 5678", "9 1234 5678" o "56912345678" → "56912345678". */
export function normalizarWhatsapp(s: string): { valor: string } | { error: string } {
  let d = s.replace(/\D/g, '')
  if (d.length === 9) d = `56${d}`
  if (!/^56\d{9}$/.test(d)) return { error: 'El WhatsApp debe ser un celular chileno, por ejemplo +56 9 1234 5678.' }
  return { valor: d }
}

/** "@itaca.cl", "instagram.com/itaca.cl/" o "itaca.cl" → "itaca.cl". */
export function normalizarInstagram(s: string): { valor: string } | { error: string } {
  const v = s
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
  if (!/^[A-Za-z0-9._]{1,30}$/.test(v)) return { error: 'Escribe solo el usuario de Instagram, por ejemplo itaca.cl.' }
  return { valor: v }
}

/** "Vitacura, Las Condes,\nProvidencia" → ["Vitacura", "Las Condes", "Providencia"] (sin repetidas ni vacías). */
export function parsearComunas(s: string): string[] {
  const vistas = new Set<string>()
  return s
    .split(/[,\n]/)
    .map((c) => c.trim().replace(/\s+/g, ' '))
    .filter((c) => c && !vistas.has(norm(c)) && vistas.add(norm(c)))
}

/** Mueve el elemento `i` una posición (−1 arriba, +1 abajo) y devuelve el nuevo orden de ids (de Finanzas). */
export function mover<T extends { id: string }>(lista: T[], i: number, dir: -1 | 1): string[] {
  const j = i + dir
  const ids = lista.map((x) => x.id)
  if (j < 0 || j >= ids.length) return ids
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
  return ids
}

/** Monto entero desde lo que escribe Tere ("45.000", "$45000") o null si está vacío o no es válido. */
export function leerMonto(s: string): number | null {
  const n = entero(s)
  return Number.isFinite(n) ? n : null
}
