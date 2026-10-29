-- Ítaca Catálogo · buckets de fotos (plan §6.3)
-- Pegar después de 101_catalogo_esquema.sql y de crear la fila de config. Idempotente.
--
-- catalogo     fotos de productos y categorías. Lectura pública por URL; solo Tere sube y borra.
-- referencias  fotos de referencia de las clientas (personalización). El público solo puede
--              subir imágenes con nombre UUID (impredecible); Tere las ve y las borra.
-- Ningún bucket se puede listar desde el público (no hay política select para anon).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('catalogo',    'catalogo',    true, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('referencias', 'referencias', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- catalogo: Tere hace todo
drop policy if exists "catalogo: tere lee"     on storage.objects;
drop policy if exists "catalogo: tere sube"    on storage.objects;
drop policy if exists "catalogo: tere cambia"  on storage.objects;
drop policy if exists "catalogo: tere borra"   on storage.objects;

create policy "catalogo: tere lee" on storage.objects for select to authenticated
  using (bucket_id = 'catalogo' and (select auth.uid()) = (select public.duena_catalogo()));
create policy "catalogo: tere sube" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogo' and (select auth.uid()) = (select public.duena_catalogo()));
create policy "catalogo: tere cambia" on storage.objects for update to authenticated
  using (bucket_id = 'catalogo' and (select auth.uid()) = (select public.duena_catalogo()))
  with check (bucket_id = 'catalogo' and (select auth.uid()) = (select public.duena_catalogo()));
create policy "catalogo: tere borra" on storage.objects for delete to authenticated
  using (bucket_id = 'catalogo' and (select auth.uid()) = (select public.duena_catalogo()));

-- referencias: el público solo sube; Tere lee y borra
drop policy if exists "referencias: publico sube" on storage.objects;
drop policy if exists "referencias: tere lee"     on storage.objects;
drop policy if exists "referencias: tere borra"   on storage.objects;

create policy "referencias: publico sube" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'referencias' and name ~ '^[0-9a-f-]{36}\.(webp|jpg|jpeg|png)$');
create policy "referencias: tere lee" on storage.objects for select to authenticated
  using (bucket_id = 'referencias' and (select auth.uid()) = (select public.duena_catalogo()));
create policy "referencias: tere borra" on storage.objects for delete to authenticated
  using (bucket_id = 'referencias' and (select auth.uid()) = (select public.duena_catalogo()));
