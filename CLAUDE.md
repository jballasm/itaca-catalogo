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
- `supabase/migrations/` — SQL del catálogo para pegar a mano en el SQL Editor. Solo agrega; el esquema base está en `../Itaca-Finanzas/supabase/migrations/`.

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
