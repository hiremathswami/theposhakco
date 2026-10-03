create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('TPC' || to_char(now(),'YYMMDD') || '-' || upper(substr(md5(random()::text),1,5))),
  user_id uuid,
  email text not null,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  delivery_method text not null default 'standard',
  payment_method text not null,
  payment_status text not null default 'pending',
  payment_reference text,
  status text not null default 'placed',
  subtotal integer not null,
  discount integer not null default 0,
  shipping integer not null default 0,
  total integer not null,
  coupon_code text,
  tracking_number text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders read" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "admin orders read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin orders update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  slug text not null,
  title text not null,
  image text not null default '',
  size text not null,
  color text not null,
  unit_price integer not null,
  quantity integer not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items read" on public.order_items for select to authenticated using (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

grant select, insert, update, delete on public.coupons to authenticated;
create policy "admin coupons" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
grant select, insert, update, delete on public.products to authenticated;
create policy "admin products read all" on public.products for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index orders_created_idx on public.orders(created_at desc);