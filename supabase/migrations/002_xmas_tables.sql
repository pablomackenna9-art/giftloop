-- ─── CHRISTMAS TABLES ─────────────────────────────────────────────────────────

-- Children profiles (one per user per child)
create table if not exists public.children (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  age           int  not null,
  country       text not null default 'CL',
  santa_name    text not null default 'Viejo Pascuero',
  parent_message text,
  interests     text[] default '{}',
  exclusions    text[] default '{}',
  max_gift_price int  not null default 30000,
  adult_budget  int  not null default 50000,
  setup_done    bool not null default false,
  letter_sent   bool not null default false,
  letter_sent_at timestamptz,
  created_at    timestamptz default now()
);
alter table public.children enable row level security;
create policy "Users manage own children" on public.children
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Christmas wishes (child's wish list items)
create table if not exists public.xmas_wishes (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children(id) on delete cascade,
  name         text not null,
  price        int  not null default 0,
  image        text,
  store        text,
  category     text,
  is_favorite  bool not null default false,
  is_free      bool not null default false,
  free_text    text,
  adult_status text not null default 'none',  -- 'none'|'selected'|'reserved'|'bought'
  reserved_by  text,
  created_at   timestamptz default now()
);
alter table public.xmas_wishes enable row level security;
create policy "Users manage xmas wishes of own children" on public.xmas_wishes
  for all using (
    exists (select 1 from public.children c where c.id = child_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.children c where c.id = child_id and c.user_id = auth.uid())
  );

-- Xmas stores (tiendas participantes en GiftLoop Navidad)
create table if not exists public.xmas_stores (
  id           text primary key,  -- e.g. 'store-juguetemax'
  name         text not null,
  logo_emoji   text not null default '🏪',
  description  text,
  categories   text[] default '{}',
  contact_name text,
  contact_email text,
  created_at   timestamptz default now()
);
alter table public.xmas_stores enable row level security;
create policy "Xmas stores are public" on public.xmas_stores for select using (true);

-- Xmas products (productos del catálogo navideño)
create table if not exists public.xmas_products (
  id          text primary key,
  store_id    text not null references public.xmas_stores(id) on delete cascade,
  name        text not null,
  description text,
  price       int  not null,
  images      text[] default '{}',
  category    text,
  stock       int  not null default 0,
  status      text not null default 'draft',   -- 'draft'|'published'
  min_age     int  not null default 0,
  created_at  timestamptz default now()
);
alter table public.xmas_products enable row level security;
create policy "Xmas products are public" on public.xmas_products for select using (true);

-- Xmas campaigns (campañas patrocinadas)
create table if not exists public.xmas_campaigns (
  id         text primary key,
  name       text not null,
  store_id   text references public.xmas_stores(id),
  status     text not null default 'draft',   -- 'draft'|'scheduled'|'active'|'ended'
  locations  text[] default '{}',             -- ['adult_panel_featured','adult_explore',...]
  products   text[] default '{}',             -- array of xmas_product ids
  start_date timestamptz,
  end_date   timestamptz,
  created_at timestamptz default now()
);
alter table public.xmas_campaigns enable row level security;
create policy "Xmas campaigns are public" on public.xmas_campaigns for select using (true);

-- ─── SEED DEMO DATA ────────────────────────────────────────────────────────────

insert into public.xmas_stores (id, name, logo_emoji, description, categories, contact_name, contact_email)
values
  ('store-juguetemax', 'JugueteMax', '🧸',
   'Especialistas en juguetes educativos y creativos para todas las edades.',
   array['Educativo','Construcción','Aire libre','Arte','Peluches'],
   'María González', 'ventas@juguetemax.cl'),
  ('store-lego', 'LEGO Store Chile', '🧱',
   'Sets oficiales LEGO. Construcción, creatividad y diversión sin límites.',
   array['City','Technic','Creator','Star Wars','Architecture'],
   'Carlos Díaz', 'chile@lego.com'),
  ('store-explora', 'Exploradores', '🔬',
   'Ciencia, naturaleza y aventura para mentes curiosas.',
   array['Ciencia','Naturaleza','Electrónica','Deportes','Aventura'],
   'Ana Reyes', 'hola@exploradores.cl')
on conflict (id) do nothing;

insert into public.xmas_products (id, store_id, name, description, price, images, category, stock, status, min_age)
values
  ('jm-001', 'store-juguetemax', 'Kit Arte Creativo Deluxe',
   'Set completo de pinturas, pinceles y lienzo para pequeños artistas.',
   24990, array['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop'],
   'Arte', 15, 'published', 4),
  ('jm-002', 'store-juguetemax', 'Pelota Fútbol Profesional',
   'Pelota oficial talla 5, ideal para jugar en el patio o la calle.',
   19990, array['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop'],
   'Aire libre', 20, 'published', 5),
  ('jm-003', 'store-juguetemax', 'Dinosaurio Interactivo T-Rex',
   'Dinosaurio con sonidos y movimientos reales. ¡Ruge de verdad!',
   34990, array['https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=400&h=400&fit=crop'],
   'Peluches', 8, 'published', 3),
  ('jm-004', 'store-juguetemax', 'Casa de Muñecas Moderna',
   'Casa de 3 pisos con muebles y accesorios incluidos.',
   59990, array['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'],
   'Educativo', 5, 'published', 4),
  ('lg-001', 'store-lego', 'LEGO City Estación de Bomberos',
   'Construye la estación de bomberos con 5 minifiguras y camión incluido.',
   49990, array['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop'],
   'City', 12, 'published', 6),
  ('lg-002', 'store-lego', 'LEGO Technic Monster Truck',
   'Vehículo todoterreno con suspensión real y motor funcional.',
   39990, array['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop'],
   'Technic', 18, 'published', 10),
  ('lg-003', 'store-lego', 'LEGO Creator Casa en el Árbol',
   '3 en 1: casa en el árbol, choza junto al río o torre del zoo.',
   29990, array['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop'],
   'Creator', 25, 'published', 8),
  ('ex-001', 'store-explora', 'Telescopio Infantil 60x',
   'Telescopio refractor para observar la luna y las estrellas.',
   44990, array['https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop'],
   'Ciencia', 10, 'published', 8),
  ('ex-002', 'store-explora', 'Kit Laboratorio Científico',
   '50 experimentos de química y física para hacer en casa.',
   27990, array['https://images.unsplash.com/photo-1532094349884-543559be6804?w=400&h=400&fit=crop'],
   'Ciencia', 20, 'published', 6),
  ('ex-003', 'store-explora', 'Dron Infantil con Cámara',
   'Dron estabilizado con cámara HD. Fácil de volar para niños.',
   54990, array['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop'],
   'Electrónica', 6, 'published', 10)
on conflict (id) do nothing;

insert into public.xmas_campaigns (id, name, store_id, status, locations, products)
values
  ('camp-001', 'JugueteMax Navidad 2026', 'store-juguetemax',
   'active',
   array['adult_panel_featured', 'adult_explore'],
   array['jm-001', 'jm-002', 'jm-003', 'jm-004']),
  ('camp-002', 'LEGO Especial Navidad', 'store-lego',
   'active',
   array['adult_explore'],
   array['lg-001', 'lg-002', 'lg-003'])
on conflict (id) do nothing;
