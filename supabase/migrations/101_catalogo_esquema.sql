-- Ítaca Catálogo · esquema (plan §6)
-- Pegar completo en Supabase → SQL Editor → Run. Es idempotente: se puede volver a ejecutar.
--
-- SOLO AGREGA. El esquema base es de Ítaca Finanzas (../Itaca-Finanzas/supabase/migrations/).
-- No se borra ni renombra nada, y las tablas privadas de Finanzas no se tocan.
--
-- Decisiones (ver CLAUDE.md):
--   · productos.precio sigue "not null" (Finanzas lo usa para calcular ventas).
--     "Consultar precio" = consultar_precio true (con precio 0 y activo false).
--   · "Próximamente" usa la columna existente categorias_producto.proximamente.
--   · La lectura pública se limita a la dueña del catálogo: quien tiene fila en config.

-- ---------------------------------------------------------------------------
-- Columnas nuevas en tablas de Finanzas
-- ---------------------------------------------------------------------------
alter table public.categorias_producto
  add column if not exists slug         text,
  add column if not exists foto_portada text,
  add column if not exists descripcion  text;

alter table public.productos
  add column if not exists slug             text,
  add column if not exists descripcion      text,
  add column if not exists publicado        boolean not null default true,
  add column if not exists disponible       boolean not null default true,
  add column if not exists orden            int     not null default 0,
  add column if not exists foto_principal   text,
  add column if not exists fotos            text[]  not null default '{}',
  add column if not exists consultar_precio boolean not null default false;

create unique index if not exists categorias_producto_user_slug on public.categorias_producto (user_id, slug);
create unique index if not exists productos_user_slug           on public.productos (user_id, slug);

-- "Náxos" → "naxos", "Cartera 1" → "cartera-1"
create or replace function public.slugify(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(t, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')),
    '[^a-z0-9]+', '-', 'g'))
$$;

update public.categorias_producto set slug = public.slugify(nombre) where slug is null;
update public.productos           set slug = public.slugify(nombre) where slug is null;

-- ---------------------------------------------------------------------------
-- Tablas nuevas
-- ---------------------------------------------------------------------------
create table if not exists public.producto_colores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  producto_id uuid not null references public.productos on delete cascade,
  nombre      text not null,
  foto        text,
  disponible  boolean not null default true,
  orden       int not null default 0
);

create index if not exists producto_colores_producto on public.producto_colores (producto_id, orden);

create table if not exists public.config (
  user_id               uuid primary key default auth.uid() references auth.users on delete cascade,
  whatsapp              text not null check (whatsapp ~ '^56[0-9]{9}$'),
  instagram             text not null default 'itaca.cl' check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  envio_comunas         text[] not null default '{Vitacura,Las Condes,Lo Barnechea,Providencia}',
  envio_precio          int not null default 3500 check (envio_precio >= 0),
  retiro_texto          text not null default 'Retiro en Vitacura (dirección se entrega por interno)',
  starken_texto         text not null default 'Otras comunas por Starken · Tere te confirma el costo',
  personalizacion_costo int not null default 15000 check (personalizacion_costo >= 0),
  personalizacion_dias  int not null default 7 check (personalizacion_dias >= 0)
);

create table if not exists public.solicitudes_personalizacion (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre     text check (char_length(nombre) <= 80),
  idea       text not null check (char_length(idea) between 1 and 1500),
  foto_path  text check (foto_path ~ '^[0-9a-f-]{36}\.(webp|jpg|jpeg|png)$'),
  canal      text not null check (canal in ('whatsapp', 'instagram')),
  estado     text not null default 'nueva' check (estado in ('nueva', 'contactada', 'cerrada'))
);

create index if not exists solicitudes_personalizacion_fecha on public.solicitudes_personalizacion (created_at desc);

-- ---------------------------------------------------------------------------
-- Dueña del catálogo: la usuaria con fila en config (una sola).
-- security definer para que anon pueda usarla en las políticas sin leer config directo.
-- ---------------------------------------------------------------------------
create or replace function public.duena_catalogo()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$ select user_id from public.config order by user_id limit 1 $$;

revoke all on function public.duena_catalogo() from public;
grant execute on function public.duena_catalogo() to anon, authenticated;

-- Freno anti-avalancha: máximo 20 solicitudes cada 10 minutos (en total).
create or replace function public.solicitudes_freno()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.solicitudes_personalizacion
      where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Demasiadas solicitudes. Intenta en unos minutos.';
  end if;
  return new;
end $$;

revoke all on function public.solicitudes_freno() from public;

drop trigger if exists solicitudes_freno on public.solicitudes_personalizacion;
create trigger solicitudes_freno before insert on public.solicitudes_personalizacion
  for each row execute function public.solicitudes_freno();

-- ---------------------------------------------------------------------------
-- Permisos + RLS
-- ---------------------------------------------------------------------------

-- Tablas nuevas de Tere: mismo patrón "propios" que Finanzas.
do $$
declare t text;
begin
  foreach t in array array['producto_colores', 'config'] loop
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "propios" on public.%I', t);
    execute format(
      'create policy "propios" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Lectura pública (anon) solo de lo del catálogo y solo de la dueña.
grant select on public.categorias_producto, public.productos, public.producto_colores, public.config to anon;

drop policy if exists "catalogo publico" on public.categorias_producto;
create policy "catalogo publico" on public.categorias_producto for select to anon
  using (user_id = (select public.duena_catalogo()));

drop policy if exists "catalogo publico" on public.productos;
create policy "catalogo publico" on public.productos for select to anon
  using (user_id = (select public.duena_catalogo()) and publicado);

drop policy if exists "catalogo publico" on public.producto_colores;
create policy "catalogo publico" on public.producto_colores for select to anon
  using (user_id = (select public.duena_catalogo()));

drop policy if exists "catalogo publico" on public.config;
create policy "catalogo publico" on public.config for select to anon
  using (user_id = (select public.duena_catalogo()));

-- Solicitudes: el público solo puede crear (sin leer, editar ni borrar).
-- authenticated también puede crear, por si Tere prueba el formulario con la sesión abierta.
alter table public.solicitudes_personalizacion enable row level security;
revoke all on public.solicitudes_personalizacion from anon, authenticated;
grant insert (nombre, idea, foto_path, canal) on public.solicitudes_personalizacion to anon, authenticated;
grant select, update, delete on public.solicitudes_personalizacion to authenticated;

drop policy if exists "crear solicitud" on public.solicitudes_personalizacion;
create policy "crear solicitud" on public.solicitudes_personalizacion for insert to anon, authenticated
  with check (estado = 'nueva');

drop policy if exists "tere gestiona" on public.solicitudes_personalizacion;
create policy "tere gestiona" on public.solicitudes_personalizacion for all to authenticated
  using ((select auth.uid()) = (select public.duena_catalogo()))
  with check ((select auth.uid()) = (select public.duena_catalogo()));
