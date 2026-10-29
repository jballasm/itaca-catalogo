# itaca-catalogo

Catálogo público de Ítaca. Las reglas comunes de la marca están en `../CLAUDE.md` (se leen solas). El plan completo está en `PLAN_Itaca_Catalogo.md` y el diseño aprobado en `render/`.

## Comandos
- `npm run dev` — servidor local (requiere `.env.local`, ver `.env.example`)
- `npm test` — Vitest
- `npm run build` — typecheck + build a `dist/`
- Deploy: push a `main` → GitHub Actions → Pages (`https://jballasm.github.io/itaca-catalogo/`)

## Stack
Igual a Ítaca Finanzas (mismas versiones): Vite + React + TS · Tailwind v4 (tokens en `src/index.css`, idénticos a Finanzas, solo modo claro) · Supabase (mismo proyecto que Finanzas; Auth con PKCE) · HashRouter.

## Estructura
- `src/pages/` — pantallas públicas (`Portada`, …). `src/tere/` — Modo Tere (`#/tere`), con el login copiado de Finanzas.
- `src/components/` — `ui.tsx`, `Icon.tsx`, `Hoja.tsx` copiados de Finanzas.
- `src/lib/` — `supabase.ts`, `format.ts` (`formatCLP`), `types.ts` (tipos de Finanzas extendidos con las columnas del catálogo).
- `public/img/` — fotos de marca estáticas (`hero-mar`, `manos`, `textura`). Las fotos de productos van al bucket `catalogo`, no al repo.
- `supabase/migrations/` — SQL del catálogo (`101_…`, `102_…`) para pegar a mano en el SQL Editor. Solo agrega; el esquema base está en `../Itaca-Finanzas/supabase/migrations/`.
- `scripts/verificar-rls.mjs` — prueba los permisos con la llave anon (`node scripts/verificar-rls.mjs`). Correrlo después de cada migración.
- `scripts/semilla.mjs` — carga la Edición 01: comprime `fotos-catalogo/*.jpg` a WebP (sharp), las sube a `catalogo/productos/<slug>/` y completa productos, colores y portadas. Sin argumentos simula; `--aplicar` escribe. Usa `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`. Se puede volver a correr: no duplica ni pisa colores existentes.
- En la BD las fotos se guardan como **ruta dentro del bucket** (`productos/naxos/naxos-rojo.webp`); el front arma la URL con `getPublicUrl`. Miniaturas del producto = `foto_principal` + foto de cada color + `fotos`.

## Regla de fotos del producto (decidida por Vicente, vale para todos los productos)
- Cada color tiene **dos fotos**: `producto_colores.foto` (la pieza sola: miniatura y botón del color) y `producto_colores.foto_modelo` (la modelo usando ese producto en ese color).
- En el producto, **al tocar un color o su miniatura, la foto grande es la modelo con ese color** (`fotoDeColor`). Si ese color aún no tiene `foto_modelo`, se muestra la pieza sola; **nunca** la modelo con otro color.
- Al abrir el producto queda elegido el primer color disponible **con** foto de modelo (`colorPorDefecto`).
- La grilla de la categoría **no** cambia: muestra `foto_principal` (modelo), como el render 03. (Un intento de mostrar la pieza sola en la grilla se revirtió.)
- Modo Tere (Fase 8) debe permitir subir **ambas** fotos por color.
- Las fotos de modelo por color de la Edición 01 salen del PDF "Catalogo Itaca 01" (extraídas a `fotos-catalogo/`, que no se sube).

## Datos (decisiones de la Fase 3)
- `productos.precio` sigue **not null** porque Finanzas lo usa para calcular ventas. "Consultar precio" = `consultar_precio = true`, con `precio = 0` y `activo = false` (así no aparece en "Registrar venta" de Finanzas). Al ponerle precio: `consultar_precio = false` y `activo = true`.
- "Próximamente" usa la columna existente `categorias_producto.proximamente`. No hay columna `publicada`.
- El público (anon) solo ve lo de la **dueña del catálogo** = `public.duena_catalogo()` (la usuaria con fila en `config`), y solo productos con `publicado = true`. Tere con sesión abierta ve todo por la policy `"propios"`, así que "Ver como clienta" debe filtrar `publicado` en el front.
- La fila de `config` (con el WhatsApp) **no** va en ninguna migración: se inserta a mano en el SQL Editor.
- `solicitudes_personalizacion`: el público solo inserta (`nombre`, `idea`, `foto_path`, `canal`) y **sin** `.select()` después del insert.

## Productos y precios se editan solo en Modo Tere (decisión de Vicente, Fase 9)
- El catálogo **no muestra productos sin `foto_principal`** (resguardo en `src/lib/catalogo.tsx`); Modo Tere los marca "Sin foto · no se ve".

### Pendiente en Ítaca Finanzas (no se hace desde aquí; aplicar en una sesión dentro de `Itaca-Finanzas/`)
1. **Catálogo de Finanzas en solo lectura**: quitar "Nuevo producto" y la edición de nombre, precio y pack en `src/pages/Catalogo.tsx`. Mostrar un botón **"Editar en Modo Tere"** → `https://jballasm.github.io/itaca-catalogo/#/tere`.
   - Por qué: un producto creado en Finanzas queda `publicado = true` sin foto ni slug; y si Finanzas le pone precio a una cartera, no apaga `consultar_precio`, así que el catálogo la sigue mostrando como "Consultar precio".
2. **Mantener** en Finanzas: "Registrar venta" (lee los precios compartidos) y el interruptor **"Desactivar (deja de aparecer al vender)"** (`activo`), que es solo de ventas.
3. Finanzas debería **ignorar `consultar_precio = true`** al listar productos para vender (hoy lo cubre `activo = false`).
4. Verificar después: Catálogo de Finanzas muestra precios iguales a Modo Tere, y "Registrar venta" sigue calculando el pack de Aura.

## Pulido (Fase 9)
- **Compartir el link**: `index.html` tiene Open Graph con `public/og.jpg` (1200×630: logo infinito + ÍTACA + "Joyas con historia" sobre papel; el infinito sale de `../Itaca-Finanzas/public/icon-512.png`, que lo tiene en mejor resolución que `logo.png`). Todos los links muestran la misma tarjeta (los `#/…` no llegan a los lectores de vista previa; tarjeta por producto requeriría servidor).
- **Peso**: Modo Tere (`React.lazy`) y `browser-image-compression` (`import()`) se cargan solo cuando se usan; React y Supabase van en archivos aparte (`vite.config.ts`).
- **Contraste**: para texto chico usar `text-tierra-texto` / `text-terracota-texto` (tokens solo del catálogo, AA ≥ 4,5); `tierra` y `terracota` quedan para íconos, bordes y fondos. Sugerido llevarlos también a Finanzas (su Login tiene el mismo caso).
- **Samsung Internet en modo oscuro** puede oscurecer la página aunque declaramos `color-scheme: only light` y `darkreader-lock`. Quien abre desde Instagram (link en la bio) no lo ve.

## Reglas de este proyecto

- El repo es **público**. Nunca subir: `.env*`, la llave `service_role`, cartolas ni datos de clientas. `.gitignore` ya bloquea `.env*`, `fotos-catalogo/`, `*.xlsx`, `*.xls`, `*.csv`, `*.pdf`.
- `../Itaca-Finanzas/` es de **solo lectura** desde aquí. Se usa para copiar configuración y para entender el esquema de Supabase.
- El teléfono y el Instagram viven en la tabla `config`, **no** en el código.
- **No modificar ni borrar** tablas, columnas ni políticas de Ítaca Finanzas. Solo agregar. RLS activo en toda tabla nueva **antes** de cargar datos.
- Antes de cada pantalla, mirar su `render/<nn>.png` y respetarlo. Mobile-first (375 y 390 px).
- No mostrar precios en la grilla de una categoría; sí en el producto.
- Carteras sin precio → "Consultar precio". Collares → "Próximamente".
- Comprimir siempre las fotos antes de subirlas.
- Tests obligatorios: armado del mensaje de WhatsApp, total del pedido (pack Aura, consultar precio, Starken, envío).
