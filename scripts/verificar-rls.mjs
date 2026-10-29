// Verifica los permisos del catálogo con la llave pública (anon), igual que una clienta.
// Uso:  node scripts/verificar-rls.mjs              (solo lecturas e intentos que deben fallar)
//       node scripts/verificar-rls.mjs --insertar   (además crea 1 solicitud y 1 foto de prueba)
// Lee VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY de .env.local. No imprime datos.
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }
const NADIE = '00000000-0000-0000-0000-000000000000'
// PNG de 1×1 px
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64')

let fallas = 0
function check(ok, texto) {
  console.log(`${ok ? 'OK   ' : 'FALLA'}  ${texto}`)
  if (!ok) fallas++
}

const rest = (ruta, init = {}) => fetch(`${URL_}/rest/v1/${ruta}`, { ...init, headers: { ...H, ...init.headers } })
const json = async (r) => (r.ok ? r.json() : null)

// --- Debe poder leer ---
const cats = await json(await rest('categorias_producto?select=id'))
check(Array.isArray(cats) && cats.length > 0, `lee categorias_producto (${cats?.length ?? 0})`)
const prods = await json(await rest('productos?select=publicado'))
check(Array.isArray(prods) && prods.length > 0 && prods.every((p) => p.publicado), `lee productos, solo publicados (${prods?.length ?? 0})`)
const colores = await rest('producto_colores?select=id')
check(colores.ok, 'lee producto_colores')
const config = await json(await rest('config?select=instagram'))
check(Array.isArray(config) && config.length === 1, `lee config (${config?.length ?? 0} fila)`)

// --- No debe ver nada privado ---
for (const t of ['movimientos', 'venta_items', 'reglas', 'importaciones', 'categorias_gasto', 'solicitudes_personalizacion']) {
  const r = await rest(`${t}?select=*&limit=1`)
  const filas = r.ok ? await r.json() : []
  check(!r.ok || filas.length === 0, `no lee ${t} (HTTP ${r.status})`)
}

// --- No debe poder escribir (filtro que no calza con nada, por seguridad) ---
const editar = await rest(`productos?id=eq.${NADIE}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ precio: 1 }),
})
check(!editar.ok, `no edita productos (HTTP ${editar.status})`)
const borrar = await rest(`productos?id=eq.${NADIE}`, { method: 'DELETE' })
check(!borrar.ok, `no borra productos (HTTP ${borrar.status})`)
const nuevaConfig = await rest('config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ user_id: NADIE, whatsapp: '56900000000' }),
})
check(!nuevaConfig.ok, `no crea config (HTTP ${nuevaConfig.status})`)

// --- Storage ---
const subir = (bucket, nombre) =>
  fetch(`${URL_}/storage/v1/object/${bucket}/${nombre}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'image/png' },
    body: PNG,
  })
const enCatalogo = await subir('catalogo', 'prueba-rls.png')
check(!enCatalogo.ok, `no sube al bucket catalogo (HTTP ${enCatalogo.status})`)
const nombreMalo = await subir('referencias', 'prueba-rls.png')
check(!nombreMalo.ok, `no sube a referencias sin nombre UUID (HTTP ${nombreMalo.status})`)
const listar = await fetch(`${URL_}/storage/v1/object/list/referencias`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: '' }),
})
const lista = listar.ok ? await listar.json() : []
check(lista.length === 0, `no lista referencias (HTTP ${listar.status})`)

// --- Escrituras permitidas (solo con --insertar: dejan datos de prueba) ---
if (process.argv.includes('--insertar')) {
  const foto = `${randomUUID()}.png`
  const r1 = await subir('referencias', foto)
  check(r1.ok, `sube foto de prueba a referencias/${foto} (HTTP ${r1.status})`)
  const r2 = await rest('solicitudes_personalizacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ idea: 'prueba automática', canal: 'whatsapp', foto_path: r1.ok ? foto : null }),
  })
  check(r2.ok, `crea solicitud de prueba (HTTP ${r2.status})`)
  const r3 = await rest('solicitudes_personalizacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ idea: 'prueba', canal: 'whatsapp', estado: 'cerrada' }),
  })
  check(!r3.ok, `no puede fijar el estado de una solicitud (HTTP ${r3.status})`)
}

console.log(fallas ? `\n${fallas} falla(s)` : '\nTodo en orden')
process.exit(fallas ? 1 : 0)
