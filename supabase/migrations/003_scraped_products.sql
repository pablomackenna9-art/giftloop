-- ─────────────────────────────────────────────────────────────────────────────
-- 003_scraped_products.sql
--
-- Tabla para guardar los resultados del sistema de scraping modular.
-- Permite:
--   • Evitar duplicados (índice único por source_url)
--   • Actualizar precios periódicamente (updated_at + cron)
--   • Historial de precios en price_history (JSONB)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tabla principal ───────────────────────────────────────────────────────────
create table if not exists public.scraped_products (
  id               uuid         primary key default gen_random_uuid(),

  -- Identificación
  source_url       text         not null,    -- URL original del producto
  store            text         not null,    -- 'falabella', 'mercadolibre', etc.

  -- Datos del producto
  title            text         not null,
  price            integer,                  -- precio actual en CLP (null = sin precio)
  previous_price   integer,                  -- precio tachado / anterior
  discount         integer,                  -- % descuento (0-100, null si no aplica)
  currency         text         not null default 'CLP',
  image_url        text,
  category         text,
  availability     text         not null default 'unknown',  -- 'in_stock' | 'out_of_stock' | 'unknown'
  short_description text,

  -- Control de tiempo
  scraped_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now(),

  -- Historial de precios: array de { price, date }
  -- Ejemplo: [{"price": 49990, "date": "2026-05-25"}, ...]
  price_history    jsonb        not null default '[]'::jsonb,

  -- Deduplicación: una URL = un registro
  constraint scraped_products_source_url_unique unique (source_url)
);

-- ── Índices para búsqueda rápida ──────────────────────────────────────────────
create index if not exists idx_scraped_products_store      on public.scraped_products (store);
create index if not exists idx_scraped_products_category   on public.scraped_products (category);
create index if not exists idx_scraped_products_updated_at on public.scraped_products (updated_at);

-- ── Función que actualiza updated_at automáticamente ─────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scraped_products_updated_at
  before update on public.scraped_products
  for each row execute function public.set_updated_at();

-- ── RLS: lectura pública, escritura solo para el servidor ────────────────────
alter table public.scraped_products enable row level security;

-- Cualquier usuario autenticado (o anónimo) puede leer
create policy "scraped_products_select"
  on public.scraped_products for select
  using (true);

-- Solo el service_role (servidor backend) puede insertar / actualizar
-- El frontend NO escribe directamente en esta tabla
create policy "scraped_products_insert"
  on public.scraped_products for insert
  with check (auth.role() = 'service_role');

create policy "scraped_products_update"
  on public.scraped_products for update
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- CÓMO USAR ESTA TABLA:
--
-- INSERTAR / ACTUALIZAR (upsert) un producto scrapeado:
--   INSERT INTO scraped_products (source_url, store, title, price, ...)
--   VALUES (...)
--   ON CONFLICT (source_url)
--   DO UPDATE SET
--     price          = EXCLUDED.price,
--     previous_price = EXCLUDED.previous_price,
--     discount       = EXCLUDED.discount,
--     updated_at     = now(),
--     -- Agregar precio al historial (máx 90 entradas)
--     price_history  = (
--       SELECT jsonb_agg(entry)
--       FROM (
--         SELECT entry FROM jsonb_array_elements(scraped_products.price_history) AS entry
--         UNION ALL
--         SELECT jsonb_build_object('price', EXCLUDED.price, 'date', now()::date::text)
--         ORDER BY (entry->>'date') DESC
--         LIMIT 90
--       ) AS combined
--     );
--
-- BUSCAR productos por tienda:
--   SELECT * FROM scraped_products WHERE store = 'falabella' LIMIT 50;
--
-- BUSCAR productos que necesitan actualización (más de 24h sin revisar):
--   SELECT * FROM scraped_products WHERE updated_at < now() - interval '24 hours';
-- ─────────────────────────────────────────────────────────────────────────────
