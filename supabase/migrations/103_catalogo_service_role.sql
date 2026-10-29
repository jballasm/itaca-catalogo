-- Ítaca Catálogo · permisos para scripts locales (plan §10, fase 4)
-- El proyecto no expone tablas automáticamente, ni siquiera a service_role.
-- scripts/semilla.mjs (llave service_role, solo en .env.local) necesita estos permisos mínimos.
-- Solo tablas del catálogo; ninguna tabla privada de Finanzas. Idempotente.

grant select, update         on public.categorias_producto to service_role;
grant select, insert, update on public.productos           to service_role;
grant select, insert         on public.producto_colores    to service_role;
grant select                 on public.config              to service_role;
