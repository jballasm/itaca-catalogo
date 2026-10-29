// Semilla de la Edición 01 (plan §6.4): sube las fotos de fotos-catalogo/ al bucket "catalogo"
// y completa los productos de la dueña del catálogo.
// Uso:  node scripts/semilla.mjs             (simulación: no escribe nada)
//       node scripts/semilla.mjs --aplicar   (sube fotos y escribe en la base)
//
// Requiere en .env.local: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (nunca se imprime).
// Productos que ya existen (cruce por nombre): solo se tocan foto_principal, fotos y orden.
// Nunca cambia precio, pack, activo ni nombre.
// Colores (cruce por nombre): si falta, se agrega al final; si existe, solo se completa
// foto_modelo cuando está vacía (no pisa lo que Tere haya cambiado).
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const APLICAR = process.argv.includes('--aplicar')
const RAIZ = new URL('../', import.meta.url)
const FOTOS = new URL('fotos-catalogo/', RAIZ)

// --- Datos (tabla §6.4). Los nombres de color son provisorios: Tere los corrige en Modo Tere. ---
const CATEGORIAS = [
  { nombre: 'Aros', portada: ['Sifnos', 'sifnos-plata'] },
  { nombre: 'Pulseras', portada: ['Aura', 'aura'] },
  { nombre: 'Carteras', portada: ['Cartera 1', 'cartera-amarilla'], proximamente: false },
]

const CARTERA = { precio: 0, consultar_precio: true, activo: false, edicion: 'Edición 01' }

// colores: [nombre, foto de la pieza, foto de la modelo con ese color (si existe)].
// Las fotos de modelo por color y los colores Verde lima, Gris, Café (Sifnos) y Negro (Milos)
// salen del PDF "Catalogo Itaca 01" (Edición 01).
const PRODUCTOS = [
  {
    cat: 'Aros', nombre: 'Sifnos', principal: 'sifnos-modelo',
    colores: [
      ['Terracota', 'sifnos-detalle', 'sifnos-terracota-modelo'],
      ['Negro', 'sifnos-negro', 'sifnos-negro-modelo'],
      ['Plateado', 'sifnos-plata'],
      ['Verde lima', 'sifnos-lima', 'sifnos-lima-modelo'],
      ['Gris', 'sifnos-gris', 'sifnos-gris-modelo'],
      ['Café', 'sifnos-cafe', 'sifnos-cafe-modelo'],
    ],
  },
  { cat: 'Aros', nombre: 'Paros', principal: 'paros-modelo', galeria: ['paros-detalle'] },
  {
    cat: 'Aros', nombre: 'Náxos', principal: 'naxos-modelo',
    colores: [
      ['Rojo', 'naxos-rojo'],
      ['Burdeo', 'naxos-burdeo'],
      ['Oliva y mostaza', 'naxos-detalle', 'naxos-oliva-modelo'],
      ['Tonos café', 'naxos-cafe', 'naxos-cafe-modelo'],
    ],
  },
  {
    cat: 'Aros', nombre: 'Milos', principal: 'milos-modelo',
    colores: [
      ['Dorado', 'milos-detalle', 'milos-dorado-modelo'],
      ['Negro', 'milos-negro', 'milos-negro-modelo'],
    ],
  },
  { cat: 'Aros', nombre: 'Corfú', principal: 'corfu-modelo', colores: [['Negro y dorado', 'corfu-detalle', 'corfu-negro-dorado-modelo']] },
  {
    cat: 'Aros', nombre: 'Elia', principal: 'elia-modelo',
    colores: [
      ['Azul', 'elia-detalle', 'elia-azul-modelo'],
      ['Multicolor', 'elia-naranja', 'elia-multicolor-modelo'],
      ['Dorado', 'elia-dorado'],
    ],
  },
  { cat: 'Pulseras', nombre: 'Aura', principal: 'aura' },
  { cat: 'Pulseras', nombre: 'Atenea', principal: 'atenea' },
  { cat: 'Pulseras', nombre: 'Penélope', principal: 'penelope' },
  { cat: 'Carteras', nombre: 'Cartera 1', principal: 'cartera-amarilla', nuevo: CARTERA },
  { cat: 'Carteras', nombre: 'Cartera 2', principal: 'cartera-rosa', nuevo: CARTERA },
  { cat: 'Carteras', nombre: 'Cartera 3', principal: 'cartera-naranja', nuevo: CARTERA },
  { cat: 'Carteras', nombre: 'Cartera 4', principal: 'cartera-gris', nuevo: CARTERA },
]

// --- Utilidades ---
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
/** Igual que public.slugify() en 101_catalogo_esquema.sql */
const slugify = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

function leerEnv() {
  const ruta = new URL('.env.local', RAIZ)
  if (!existsSync(ruta)) throw new Error('Falta .env.local')
  return Object.fromEntries(
    readFileSync(ruta, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  )
}

function ok({ data, error }, que) {
  if (error) throw new Error(`${que}: ${error.message}`)
  return data
}

// --- Inicio ---
const env = leerEnv()
if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en .env.local')
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log(APLICAR ? '== APLICANDO ==\n' : '== SIMULACIÓN (nada se escribe; usa --aplicar) ==\n')

const config = ok(await sb.from('config').select('user_id'), 'leer config')
if (config.length !== 1) throw new Error(`config debe tener 1 fila y tiene ${config.length}`)
const uid = config[0].user_id

const cats = ok(await sb.from('categorias_producto').select('id, nombre, slug').eq('user_id', uid), 'leer categorías')
const prods = ok(await sb.from('productos').select('id, nombre, slug, categoria_producto_id').eq('user_id', uid), 'leer productos')
const catPorNombre = new Map(cats.map((c) => [norm(c.nombre), c]))
const prodPorNombre = new Map(prods.map((p) => [norm(p.nombre), p]))

// --- Fotos ---
const resumen = { fotos: 0, kbAntes: 0, kbDespues: 0, actualizados: 0, creados: 0, colores: 0, modelos: 0, categorias: 0 }
const subidas = new Map() // archivo → ruta en el bucket

async function subir(archivo, slugProducto) {
  if (subidas.has(archivo)) return subidas.get(archivo)
  const origen = ['jpg', 'jpeg', 'png'].map((ext) => new URL(`${archivo}.${ext}`, FOTOS)).find((u) => existsSync(u))
  if (!origen) throw new Error(`No existe fotos-catalogo/${archivo}.jpg (ni .png)`)
  const original = readFileSync(origen)
  const webp = await sharp(original)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  const ruta = `productos/${slugProducto}/${archivo}.webp`
  if (APLICAR) {
    ok(await sb.storage.from('catalogo').upload(ruta, webp, { contentType: 'image/webp', upsert: true }), `subir ${ruta}`)
  }
  resumen.fotos++
  resumen.kbAntes += original.length / 1024
  resumen.kbDespues += webp.length / 1024
  subidas.set(archivo, ruta)
  return ruta
}

// --- Productos ---
const orden = new Map()
for (const d of PRODUCTOS) {
  const cat = catPorNombre.get(norm(d.cat))
  if (!cat) throw new Error(`No existe la categoría ${d.cat}`)
  const n = (orden.get(d.cat) ?? 0) + 1
  orden.set(d.cat, n)

  const existente = prodPorNombre.get(norm(d.nombre))
  const slug = existente?.slug ?? slugify(d.nombre)
  const foto_principal = await subir(d.principal, slug)
  const fotos = []
  for (const g of d.galeria ?? []) fotos.push(await subir(g, slug))
  const colores = []
  for (const [nombre, archivo, modelo] of d.colores ?? []) {
    colores.push({ nombre, foto: await subir(archivo, slug), foto_modelo: modelo ? await subir(modelo, slug) : null })
  }

  let id = existente?.id
  if (existente) {
    if (existente.categoria_producto_id !== cat.id) console.log(`  ! ${d.nombre} está en otra categoría; no se mueve`)
    console.log(`~ ${d.nombre}: foto, ${fotos.length} de galería, orden ${n}`)
    if (APLICAR) ok(await sb.from('productos').update({ foto_principal, fotos, orden: n }).eq('id', id), `actualizar ${d.nombre}`)
    resumen.actualizados++
  } else {
    if (!d.nuevo) throw new Error(`${d.nombre} no existe en la base y no es un producto nuevo; revisar el nombre`)
    console.log(`+ ${d.nombre}: nuevo, "Consultar precio", orden ${n}`)
    if (APLICAR) {
      const fila = ok(
        await sb
          .from('productos')
          .insert({ user_id: uid, categoria_producto_id: cat.id, nombre: d.nombre, slug, foto_principal, fotos, orden: n, ...d.nuevo })
          .select('id')
          .single(),
        `crear ${d.nombre}`,
      )
      id = fila.id
    }
    resumen.creados++
  }

  if (colores.length) {
    const existentes = id
      ? ok(await sb.from('producto_colores').select('id, nombre, foto_modelo, orden').eq('producto_id', id), 'leer colores')
      : []
    const porNombre = new Map(existentes.map((c) => [norm(c.nombre), c]))
    let ultimoOrden = Math.max(0, ...existentes.map((c) => c.orden))
    for (const c of colores) {
      const ya = porNombre.get(norm(c.nombre))
      if (!ya) {
        ultimoOrden++
        console.log(`  + color ${c.nombre}${c.foto_modelo ? ' (con modelo)' : ''}`)
        if (APLICAR) {
          ok(
            await sb.from('producto_colores').insert({ user_id: uid, producto_id: id, nombre: c.nombre, foto: c.foto, foto_modelo: c.foto_modelo, orden: ultimoOrden }),
            `color ${c.nombre} de ${d.nombre}`,
          )
        }
        resumen.colores++
      } else if (c.foto_modelo && !ya.foto_modelo) {
        console.log(`  ~ ${c.nombre}: foto de modelo`)
        if (APLICAR) ok(await sb.from('producto_colores').update({ foto_modelo: c.foto_modelo }).eq('id', ya.id), `modelo de ${c.nombre}`)
        resumen.modelos++
      }
    }
  }
}

// --- Categorías ---
for (const c of CATEGORIAS) {
  const cat = catPorNombre.get(norm(c.nombre))
  const foto_portada = subidas.get(c.portada[1])
  const cambios = { foto_portada, ...(c.proximamente === undefined ? {} : { proximamente: c.proximamente }) }
  console.log(`~ categoría ${c.nombre}: portada ${c.portada[1]}${c.proximamente === false ? ', deja de ser "Próximamente"' : ''}`)
  if (APLICAR) ok(await sb.from('categorias_producto').update(cambios).eq('id', cat.id), `categoría ${c.nombre}`)
  resumen.categorias++
}

console.log(
  `\nFotos: ${resumen.fotos} (${Math.round(resumen.kbAntes)} KB en JPG → ${Math.round(resumen.kbDespues)} KB en WebP)` +
    `\nProductos: ${resumen.actualizados} actualizados, ${resumen.creados} nuevos · Colores nuevos: ${resumen.colores}` +
    ` · Fotos de modelo completadas: ${resumen.modelos} · Categorías: ${resumen.categorias}` +
    (APLICAR ? '\nListo.' : '\nSimulación terminada. Para escribir: node scripts/semilla.mjs --aplicar'),
)
