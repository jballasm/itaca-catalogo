# Ítaca Catálogo — Plan de construcción

> Documento de partida para **Claude Code**. Abrir la carpeta `itaca/itaca-catalogo` (no la holding) y pedir: *"Lee PLAN_Itaca_Catalogo.md, render/ y ../CLAUDE.md. Empieza por la Fase 0 (§5.1) en modo plan."*

---

## 1. Objetivo

Catálogo web público de **Ítaca · Joyas con historia** (aros, pulseras, carteras tejidas a mano; collares próximamente), pensado para:
- **Link en la bio de Instagram** (@itaca.cl).
- **Mandar por WhatsApp** a clientas.

La clienta mira el catálogo, arma un pedido y lo envía a Tere por **WhatsApp** (mensaje ya escrito) o por **Instagram** (el pedido se copia para pegarlo en el DM). También puede pedir una **pieza personalizada** con foto de referencia.

**Teresita (Tere)** edita precios, disponibilidad, fotos y productos desde el **Modo Tere**, con la **misma cuenta** que usa en Ítaca Finanzas.

Uso principal: **celular**.

---

## 2. Decisiones tomadas (aprobadas por Vicente)

| Tema | Decisión |
|---|---|
| Diseño | **Propuesta 2** (ver `render/`): portada → categorías en cuadrados → categoría con ficha → producto → pedido. |
| Hosting | **GitHub Pages**, repo **público** y **separado**: `itaca-catalogo`. Sin dominio propio. |
| Datos | **El mismo proyecto Supabase de Ítaca Finanzas.** Los precios son una sola fuente: si Tere cambia un precio en cualquiera de las dos apps, cambia en ambas. |
| Pedido | Sin pago en línea. Botón **WhatsApp** (`wa.me` con texto precargado) y botón **Instagram** (copia el pedido al portapapeles y abre el DM de @itaca.cl). |
| Precios en la grilla | **No** se muestran en la grilla de una categoría (solo nombre + foto de modelo). El precio aparece al abrir el producto. |
| Personalización | **Sección aparte** (no dentro del producto). Un mensaje libre con los puntos clave sugeridos + foto de referencia opcional. 7 días de anticipación, costo adicional $15.000 (aplica a todos los modelos). |
| Entrega | Retiro en **Vitacura** (gratis) · Envío a **Vitacura, Las Condes, Lo Barnechea y Providencia** ($3.500) · **Otras comunas por Starken** (costo lo confirma Tere). |
| Carteras | Se publican con nombre provisorio y **"Consultar precio"** hasta que Tere ponga nombres y precios desde Modo Tere. |
| Collares | Categoría visible como **"Próximamente"**, no clickeable. |
| Contacto | WhatsApp de Tere y usuario de Instagram se guardan en la tabla `config` (editable en Modo Tere). **No se escriben en el código.** Valores iniciales en §6. |

---

## 3. Stack

- **Vite + React + TypeScript**, **Tailwind CSS** (tokens §8)
- **Supabase JS** — lectura pública del catálogo, login de Tere, Storage para fotos
- **HashRouter** (GitHub Pages no tiene rutas de servidor)
- **browser-image-compression** — comprimir fotos antes de subirlas (máx. 1600 px, WebP, ~200 KB)
- **GitHub Actions** — deploy a Pages
- Opcional: **vite-plugin-pwa** para instalar Modo Tere en el celular de Tere

Costo: **$0** (Supabase gratis + GitHub Pages).

---

## 4. Skills y herramientas para Claude Code

- **Modo plan** (Shift+Tab) al inicio y antes de cada fase.
- **`/init`** → `CLAUDE.md`; copiar ahí las reglas de §11.
- **Skill / plugin `frontend-design`** si lo tienes instalado; si no, §8 y `render/` bastan.
- **GitHub CLI (`gh`)** — crear repo, activar Pages, revisar Actions.
- **SQL a mano** en Supabase → SQL Editor (igual que en Finanzas). Las migraciones quedan en `supabase/migrations/`.
- **Playwright** (opcional) — capturas a 390 px para comparar contra `render/*.png`.

---

## 5. Relación con Ítaca Finanzas (importante)

Estructura de carpetas:
```
itaca/                  ← holding (CLAUDE.md común, sin git)
├── Itaca-Finanzas/     ← solo lectura desde aquí
└── itaca-catalogo/     ← este proyecto
```
1. Claude Code **lee directo** `../Itaca-Finanzas/` (habilitado en `.claude/settings.json`). **No copiar migraciones**: leerlas desde `../Itaca-Finanzas/supabase/migrations/`.
2. Las nuevas migraciones del catálogo van en `itaca-catalogo/supabase/migrations/` y **solo agregan**. **Nunca** borran ni renombran nada de Finanzas.
3. Después de cada migración, abrir Ítaca Finanzas y confirmar que **Catálogo** y **Registrar venta** siguen funcionando.
4. Las tablas privadas de Finanzas (`movimientos`, `venta_items`, `reglas`, `importaciones`, `categorias_gasto`) **no** reciben ninguna política pública.

### 5.1 Fase 0 · Replicar desde Finanzas (antes de escribir código nuevo)

Claude Code revisa `../Itaca-Finanzas/` y **replica en este proyecto** lo que sirva, adaptándolo, sin modificar Finanzas. Al terminar, entrega una tabla de **"qué copié, de dónde y qué cambié"**.

| Qué | Dónde buscarlo en Finanzas | Qué hacer en el catálogo |
|---|---|---|
| Versiones de Vite, React, TS, Tailwind y Supabase JS | `package.json` | Usar las **mismas** versiones |
| Configuración de Vite (`base`, plugins, alias) | `vite.config.*` | Copiar; cambiar `base` a `/itaca-catalogo/` |
| Tokens de diseño, fuentes y estilos base | `tailwind.config.*`, `src/index.css` o equivalente | Copiar **idénticos** |
| Cliente de Supabase | `src/lib/supabase.*` o equivalente | Copiar tal cual |
| Variables de entorno | `.env.example` (nunca `.env`) | Crear `.env.example` con los mismos nombres |
| Login de Tere y sesión | Pantalla de ingreso y lógica de auth | Reusar para **Modo Tere** (`#/tere`) |
| Tipos de `productos` y `categorias_producto` | Tipos TS o migraciones | Copiar y **extender** con las columnas nuevas (§6) |
| Formato de moneda CLP y fechas | Helpers/utils | Copiar |
| Componentes base (botón, tarjeta, input, barra) | `src/components/` | Copiar los que calcen con `render/` |
| Deploy a GitHub Pages | `.github/workflows/*.yml` | Copiar; ajustar nombre del repo |
| Ícono / PWA / favicon y logo | `public/`, config de PWA | Copiar logo y favicon |
| Reglas de `.gitignore` | `.gitignore` | Copiar y sumar `fotos-catalogo/` |
| Tests (configuración) | Vitest/Jest config | Copiar la configuración |

**No replicar**: parser de cartolas, motor de reglas, reportes, ni nada de movimientos o gastos.

---

## 6. Base de datos (nuevas migraciones)

### 6.1 Columnas nuevas
```
categorias_producto  (+)
  slug text unique, foto_portada text, publicada bool default true,
  descripcion text
  -- Collares: publicada=false → se muestra "Próximamente"

productos  (+)
  slug text, descripcion text, publicado bool default true,
  disponible bool default true, orden int default 0,
  foto_principal text,            -- foto de modelo (la que va en la grilla)
  fotos text[] default '{}',      -- galería (detalles)
  precio int null                 -- si ya existe, permitir null = "Consultar precio"
```

### 6.2 Tablas nuevas
```
producto_colores
  id, user_id, producto_id → productos, nombre text, foto text,
  disponible bool default true, orden int

config   (una sola fila por user_id)
  user_id pk, whatsapp text, instagram text,
  envio_comunas text[], envio_precio int, retiro_texto text,
  starken_texto text, personalizacion_costo int, personalizacion_dias int
  Valores iniciales:
    whatsapp = (número real de Tere: se carga directo en Supabase, nunca en el repo)
    instagram = 'itaca.cl'
    envio_comunas = {Vitacura, Las Condes, Lo Barnechea, Providencia}
    envio_precio = 3500
    retiro_texto = 'Retiro en Vitacura (dirección se entrega por interno)'
    starken_texto = 'Otras comunas por Starken · Tere te confirma el costo'
    personalizacion_costo = 15000
    personalizacion_dias = 7

solicitudes_personalizacion
  id uuid, created_at, nombre text null, idea text not null (máx. 1500),
  foto_path text null, canal ('whatsapp'|'instagram'),
  estado ('nueva'|'contactada'|'cerrada') default 'nueva'
```

### 6.3 Seguridad (RLS) — revisar con cuidado
- **Lectura pública (anon)**:
  - `categorias_producto`, `productos` (solo `publicado = true`), `producto_colores`, `config`.
  - Antes de abrirlas, verificar que **no tienen columnas privadas** (costos, notas). Si las tienen, exponer una **vista** `catalogo_publico` solo con columnas públicas y dar `select` a anon sobre la vista, no sobre la tabla.
- **Escritura**: solo Tere (`user_id = auth.uid()`), igual que en Finanzas.
- `solicitudes_personalizacion`: **anon solo puede insertar** (sin leer, editar ni borrar). Tere lee y cambia `estado`.
- **Storage**:
  - Bucket `catalogo` — lectura pública, escritura solo Tere.
  - Bucket `referencias` — lectura pública por URL (nombres UUID impredecibles), **anon solo puede subir** imágenes `image/jpeg|png|webp` de máx. **5 MB**. Tere puede borrar.
- Anti-spam simple en el formulario de personalización: campo trampa oculto (honeypot), límite de 1 envío por minuto por navegador y largo máximo de texto.

### 6.4 Semilla del catálogo (Edición 01)
Fotos en `fotos-catalogo/` (subir a bucket `catalogo`; **no** subir esa carpeta al repo).

| Categoría | Producto | Precio | Foto principal (modelo) | Colores / galería |
|---|---|---|---|---|
| Aros | **Sifnos** | 60.000 | `sifnos-modelo.jpg` | terracota `sifnos-detalle`, negro `sifnos-negro`, plateado `sifnos-plata` |
| Aros | **Paros** | 30.000 | `paros-modelo.jpg` | `paros-detalle` |
| Aros | **Náxos** | 45.000 | `naxos-modelo.jpg` | rojo `naxos-rojo`, burdeo `naxos-burdeo`, oliva y mostaza `naxos-detalle`, tonos café `naxos-cafe` |
| Aros | **Milos** | 40.000 | `milos-modelo.jpg` | dorado `milos-detalle` |
| Aros | **Corfú** | 30.000 | `corfu-modelo.jpg` | negro y dorado `corfu-detalle` |
| Aros | **Elia** | 35.000 | `elia-modelo.jpg` | azul `elia-detalle`, multicolor `elia-naranja`, dorado `elia-dorado` |
| Pulseras | **Aura** | 23.990 (pack 2: 40.990) | `aura.jpg` | — |
| Pulseras | **Atenea** | 28.000 | `atenea.jpg` | — |
| Pulseras | **Penélope** | 28.000 | `penelope.jpg` | — |
| Carteras | Cartera 1–4 (provisorio) | **null** (Consultar precio) | `cartera-amarilla`, `cartera-rosa`, `cartera-naranja`, `cartera-gris` | Tere pone nombres y precios |
| Collares | — | — | — | `publicada = false` |

- **Si un producto ya existe en Finanzas, actualizarlo; no duplicarlo.** Hacer el cruce por nombre.
- Los nombres de color son provisorios; Tere los corrige en Modo Tere.
- Fotos de portada de categoría: Aros `sifnos-plata` (o `sifnos-detalle`), Pulseras `aura`, Carteras `cartera-amarilla`.
- Fotos de marca: `hero-mar.jpg` (portada), `manos.jpg` (banner y personalización), `textura.jpg`.

---

## 7. Lógica clave

**Mensaje de WhatsApp** — `https://wa.me/<config.whatsapp>?text=<encodeURIComponent(mensaje)>`
```
¡Hola Tere! Quiero hacer un pedido desde el catálogo de Ítaca:
· Náxos (Rojo) x1 — $45.000
· Aura pack 2 (Burdeo + Dorado) — $40.990
Entrega: Envío a domicilio ($3.500)
Total: $89.490
Nombre: Camila
```
- Productos "Consultar precio": aparecen como `· Cartera 2 — consultar precio` y no suman al total.
- Starken: `Entrega: Otra comuna (Starken) — costo por confirmar`, no suma al total.

**Instagram** — copiar el mismo mensaje con `navigator.clipboard.writeText`, mostrar el aviso "Pedido copiado, pégalo en el chat" y abrir `https://ig.me/m/<config.instagram>`.

**Pack Aura** — si hay 2 Aura en el pedido, aplicar el precio pack (40.990). Implementarlo genérico con `precio_pack` y `unidades_pack` (ya existen en Finanzas).

**Personalización** — al enviar:
1. Si hay foto, comprimirla y subirla a `referencias/<uuid>.webp`.
2. Insertar en `solicitudes_personalizacion`.
3. Abrir WhatsApp o Instagram con:
```
¡Hola Tere! Quiero una pieza personalizada:
<idea>
Foto de referencia: <url pública>
```
Debajo del campo de texto, la sugerencia: *Incluye qué pieza, colores, tamaño o estilo y para cuándo la necesitas.*

**Pedido** — guardar el carrito en `localStorage`, envuelto en try/catch, para que no se pierda al recargar.

---

## 8. Diseño (idéntico a Ítaca Finanzas + `render/`)

```
--papel #F4EEE4   --arena #E9DFD0   --tarjeta #FBF8F3   --tinta #3A3127
--tinta-2 #6B5F51 --linea #DCD1C0   --tierra #8B6A45    --oliva #5E6C2A
```
- **Títulos y nombres de producto**: Cormorant Garamond 500/600, MAYÚSCULAS con `letter-spacing: .14–.24em`.
- **Interfaz**: Jost 400/500. Etiquetas en mayúsculas pequeñas, `letter-spacing: .2em`.
- **Logo**: `logo.png` (infinito de línea fina, fondo transparente).
- Esquinas: 6 px en tarjetas de categoría y producto, 12 px en controles, 22 px en la ficha que sube, botones principales en píldora.
- Texto sobre fotos: siempre con degradado oscuro abajo para que se lea.
- Botones de al menos 44 px de alto. Probar en 375 y 390 px de ancho.
- Solo modo claro (como el catálogo impreso).

---

## 9. Pantallas (ver `render/`)

| # | Archivo | Pantalla | Notas |
|---|---|---|---|
| 1 | `01-portada` | **Portada** | Logo, ÍTACA, "Joyas con historia · Edición 01", foto del mar. Tocar o deslizar hacia arriba → Categorías. |
| 2 | `02-categorias` | **Categorías** | Banner "De mano en mano". Cuadrados con foto: Aros, Pulseras, Carteras, Collares (Próximamente). Bloque **Personalización**. Barra del pedido abajo (si hay productos). Botón @itaca.cl. |
| 3 | `03-categoria` | **Dentro de una categoría** | Foto de portada con título y degradado. Ficha que sube con botones para **cambiar de categoría** y "Personaliza". Grilla de 2 columnas con **fotos de modelo, sin precio**. "+" agrega rápido (color por defecto). |
| 4 | `04-producto` | **Producto** | Foto grande, miniaturas, nombre, precio (o "Consultar precio"), colores con foto, cantidad, "Agregar · $X". Si `disponible=false`: "Agotado · Consultar". |
| 5 | `05-personalizacion` | **Personalización** | Texto de la marca, campo de idea con los puntos clave sugeridos, foto de referencia, 7 días y $15.000, botones WhatsApp e Instagram. |
| 6 | `06-pedido` | **Tu pedido** | Productos con cantidad, nombre (opcional), **entrega** (3 opciones de §2), total, botones WhatsApp e Instagram. |
| 7 | `07-modo-tere` | **Modo Tere** (`#/tere`) | Login (misma cuenta que Finanzas). Solicitudes de personalización (con foto, estado). Nuevo producto con foto. Pestañas por categoría. Editar precio, disponible/agotado, publicado, colores, fotos y orden. Ajustes: WhatsApp, Instagram, envíos, personalización. "Ver como clienta". |

Navegación: atrás siempre visible. Compartir un producto: `#/p/<slug>`.

---

## 10. Fases

1. **Preparación**: `git init` en `itaca-catalogo`; crear el repo público `itaca-catalogo` con `gh`; agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (las mismas de Finanzas) como secretos del repo.
2. **Fase 0 · Replicar desde Finanzas (§5.1)** y dejar el deploy a Pages funcionando con la portada.
3. **Base de datos**: migraciones de §6 (columnas, tablas, RLS, buckets). Verificar que Finanzas sigue funcionando.
4. **Semilla**: subir fotos y cargar el catálogo (§6.4) con un script local. La `service_role` va solo en `.env.local`, que está en `.gitignore`. Alternativa: cargarlo después desde Modo Tere.
5. **Catálogo público**: Portada, Categorías, Categoría, Producto.
6. **Pedido**: carrito, entrega, total, WhatsApp e Instagram. Tests del armado del mensaje y del total (pack Aura, consultar precio, Starken).
7. **Personalización**: formulario, subida de foto, solicitud y mensaje.
8. **Modo Tere**: login, edición, fotos, solicitudes, ajustes.
9. **Pulido**: capturas comparadas con `render/`, accesibilidad, metadatos para compartir (Open Graph con foto y "Ítaca · Joyas con historia").
10. **Entrega**: probar en el celular de Tere, poner el link en la bio de Instagram y enviárselo a 2–3 clientas de prueba.

---

## 11. Reglas para Claude Code (copiar en CLAUDE.md)

- El repo es **público**. Nunca subir: `.env*`, la llave `service_role`, cartolas ni datos de clientas. Agregar `fotos-catalogo/` y `.env*` a `.gitignore`.
- El teléfono y el Instagram viven en la tabla `config`, **no** en el código.
- **No modificar ni borrar** tablas, columnas ni políticas de Ítaca Finanzas. Solo agregar.
- RLS activo en toda tabla nueva **antes** de cargar datos.
- Español de Chile; montos en CLP sin decimales (`$45.000`).
- Mobile-first (390 px). Comparar cada pantalla con `render/<nn>.png`.
- Comprimir siempre las fotos antes de subirlas.

---

## 12. Pendientes que Tere ajusta en Modo Tere

- Nombres y precios de las **carteras**.
- Cómo se cobra **Starken** (texto en `config.starken_texto`).
- Nombres definitivos de los **colores**.
- Lanzamiento de **collares**: cambiar `publicada = true` y agregar productos.

## 13. Fuera de alcance (por ahora)

- Pago en línea.
- Stock por unidad. Por ahora solo disponible o agotado.
- Registrar automáticamente en Finanzas las ventas que llegan por el catálogo. Tere las sigue registrando con la cartola o como efectivo.
