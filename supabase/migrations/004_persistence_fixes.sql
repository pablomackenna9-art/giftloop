alter table public.wishes add column if not exists kind text not null default 'product';
alter table public.wishes add column if not exists list_id text;
alter table public.wishes add column if not exists list_name text;
alter table public.xmas_wishes add column if not exists product_id text;

-- La función completa corre en una transacción y respeta las políticas del usuario.
create or replace function public.replace_xmas_wishes(p_child_id uuid, p_wishes jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  perform 1 from public.children where id = p_child_id and user_id = auth.uid() for update;
  if not found then raise exception 'No tienes acceso a este perfil'; end if;
  delete from public.xmas_wishes where child_id = p_child_id;
  insert into public.xmas_wishes
    (id, child_id, product_id, name, price, image, store, category,
     is_favorite, is_free, free_text, adult_status, reserved_by)
  select w.id, p_child_id, w.product_id, w.name, coalesce(w.price, 0), w.image,
    w.store, w.category, w.is_favorite, w.is_free, w.free_text, w.adult_status, w.reserved_by
  from jsonb_to_recordset(p_wishes) as w(
    id uuid, product_id text, name text, price int, image text, store text,
    category text, is_favorite bool, is_free bool, free_text text,
    adult_status text, reserved_by text
  );
end;
$$;

-- Los roles de tiendas y administración se asignan en app_metadata desde el servidor.
create table if not exists public.purchase_requests (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  child_id uuid not null references public.children(id) on delete cascade,
  store_id text not null,
  payload jsonb not null,
  check (payload->>'id' = id),
  check (payload->>'childId' = child_id::text),
  check (payload->>'storeId' = store_id)
);
alter table public.purchase_requests enable row level security;
revoke all on public.purchase_requests from anon, authenticated;
grant select, insert on public.purchase_requests to authenticated;
grant update (payload) on public.purchase_requests to authenticated;
create policy "Participants read requests" on public.purchase_requests for select to authenticated
using (user_id = auth.uid() or auth.jwt()->'app_metadata'->>'role' = 'admin'
  or store_id = auth.jwt()->'app_metadata'->>'store_id');
create policy "Adults create own requests" on public.purchase_requests for insert to authenticated
with check (user_id = auth.uid() and exists (
  select 1 from public.children c where c.id = child_id and c.user_id = auth.uid()
));
create policy "Participants update requests" on public.purchase_requests for update to authenticated
using (user_id = auth.uid() or auth.jwt()->'app_metadata'->>'role' = 'admin'
  or store_id = auth.jwt()->'app_metadata'->>'store_id')
with check (user_id = auth.uid() or auth.jwt()->'app_metadata'->>'role' = 'admin'
  or store_id = auth.jwt()->'app_metadata'->>'store_id');

create or replace function public.save_purchase_request(p_request jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.purchase_requests set payload = p_request
  where id = p_request->>'id';
  if not found then
    insert into public.purchase_requests (id, child_id, store_id, payload)
    values (p_request->>'id', (p_request->>'childId')::uuid, p_request->>'storeId', p_request);
  end if;
end;
$$;
revoke all on function public.save_purchase_request(jsonb) from public;
grant execute on function public.save_purchase_request(jsonb) to authenticated;

create or replace function public.save_purchase_requests(p_requests jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare request jsonb;
begin
  for request in select value from jsonb_array_elements(p_requests) loop
    perform public.save_purchase_request(request);
  end loop;
end;
$$;
revoke all on function public.save_purchase_requests(jsonb) from public;
grant execute on function public.save_purchase_requests(jsonb) to authenticated;
revoke all on function public.replace_xmas_wishes(uuid, jsonb) from public;
grant execute on function public.replace_xmas_wishes(uuid, jsonb) to authenticated;

-- Conserva los campos elegidos aun cuando el registro requiera confirmar correo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, name, avatar, bio)
  values (
    new.id,
    lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))),
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/initials/svg?seed=' || new.id), ''
  );
  return new;
end;
$$;
