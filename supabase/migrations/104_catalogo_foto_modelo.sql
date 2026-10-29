-- Ítaca Catálogo · foto de la modelo por color
-- En el producto, al tocar un color la foto grande muestra a la modelo con ese color.
-- Si un color no tiene foto_modelo, se muestra la foto de la pieza (producto_colores.foto).
-- Solo agrega. Idempotente.

alter table public.producto_colores
  add column if not exists foto_modelo text;

-- scripts/semilla.mjs completa foto_modelo de colores existentes.
grant update on public.producto_colores to service_role;
