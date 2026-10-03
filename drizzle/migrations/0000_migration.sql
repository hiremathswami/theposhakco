create type public.app_role as enum ('admin','moderator','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text, created_at timestamptz not null default now());
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile upd" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile ins" on public.profiles for insert to authenticated with check (id = auth.uid());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null, subtitle text, description text not null default '',
  fabric text, care text,
  category text not null, gender text not null default 'unisex', collections text[] not null default '{}',
  price int not null, compare_at_price int,
  images text[] not null default '{}',
  colors jsonb not null default '[]', sizes text[] not null default '{S,M,L,XL,XXL}',
  stock int not null default 50, rating numeric(2,1) not null default 4.7, review_count int not null default 0,
  is_new boolean not null default false, is_bestseller boolean not null default false, is_featured boolean not null default false,
  status text not null default 'active', sort_order int not null default 0,
  created_at timestamptz not null default now());
grant select on public.products to anon, authenticated; grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public active products" on public.products for select to anon, authenticated using (status = 'active');
create policy "admin manage products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.wishlists (user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id, product_id));
grant select, insert, delete on public.wishlists to authenticated; grant all on public.wishlists to service_role;
alter table public.wishlists enable row level security;
create policy "own wishlist" on public.wishlists for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.cart_items (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, size text not null, color text not null, quantity int not null default 1, saved_for_later boolean not null default false, created_at timestamptz not null default now(), unique(user_id, product_id, size, color));
grant select, insert, update, delete on public.cart_items to authenticated; grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "own cart" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.newsletter_subscribers (id uuid primary key default gen_random_uuid(), email text unique not null, created_at timestamptz not null default now());
grant insert on public.newsletter_subscribers to anon, authenticated; grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "anyone subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (char_length(email) between 5 and 255);

create table public.coupons (code text primary key, kind text not null default 'percent', value int not null, min_order int not null default 0, active boolean not null default true);
grant select on public.coupons to anon, authenticated; grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "active coupons" on public.coupons for select to anon, authenticated using (active);
insert into public.coupons values ('POSHAK10','percent',10,0,true),('WELCOME200','fixed',200,1499,true);

insert into public.products (slug,title,subtitle,description,fabric,care,category,gender,collections,price,compare_at_price,images,colors,stock,rating,review_count,is_new,is_bestseller,is_featured,sort_order) values
('the-lovers-tee','The Lovers Tee','Oversized Graphic Tee','An oversized graphic tee inspired by classical tarot art and modern street culture. Heavy screen print, dropped shoulders, relaxed fit.','240 GSM 100% combed cotton','Machine wash cold, inside out. Do not iron on print.','graphic','unisex','{new-drop,oversized,graphic-tees}',1199,1499,'{p-lovers,c-graphic}','[{"name":"Black","hex":"#1a1a1a"},{"name":"Maroon","hex":"#7a1f24"},{"name":"Sand","hex":"#d8c9b0"}]',42,4.8,120,true,true,true,1),
('elephant-emblem-tee','Elephant Emblem Tee','Oversized Tee','Clean white oversized tee with our geometric elephant emblem embroidered on the chest. An everyday staple.','220 GSM 100% cotton','Machine wash cold.','minimal','unisex','{new-drop,oversized}',999,null,'{p-elephant,story}','[{"name":"White","hex":"#f4f2ec"},{"name":"Blue","hex":"#2b4fa8"},{"name":"Black","hex":"#1a1a1a"}]',60,4.7,88,true,false,true,2),
('vision-tee','Vision Tee','Oversized Graphic Tee','Engraved angels and the all-seeing eye in deep indigo ink. Art you can wear.','240 GSM 100% combed cotton','Machine wash cold, inside out.','graphic','unisex','{new-drop,oversized,graphic-tees}',1199,null,'{p-vision,c-graphic}','[{"name":"White","hex":"#f4f2ec"},{"name":"Indigo","hex":"#24356e"}]',8,4.9,64,true,true,true,3),
('signature-tee','Signature Tee','Minimal Oversized Tee','Our signature minimal tee with a subtle chest wordmark. Built different, worn better.','220 GSM 100% cotton','Machine wash cold.','minimal','men','{new-drop,oversized}',999,null,'{p-signature,c-men}','[{"name":"Black","hex":"#1a1a1a"},{"name":"Forest","hex":"#1f3d2f"},{"name":"Sand","hex":"#d8c9b0"}]',70,4.6,51,true,false,true,4),
('roots-tee','Roots Tee','Oversized Tee','Forest green oversized tee with a small cream elephant on the chest. Rooted in culture.','220 GSM 100% cotton','Machine wash cold.','minimal','unisex','{oversized}',999,1199,'{p-roots,c-women}','[{"name":"Forest","hex":"#1f3d2f"},{"name":"Black","hex":"#1a1a1a"}]',35,4.7,40,false,true,false,5),
('heritage-back-print','Heritage Back Print','Oversized Graphic Tee','A royal Indian elephant rendered in fine ink across the back. A tribute to heritage.','240 GSM 100% combed cotton','Machine wash cold, inside out.','graphic','unisex','{oversized,graphic-tees}',1299,1599,'{p-heritage,c-oversized}','[{"name":"Sand","hex":"#d8c9b0"},{"name":"Maroon","hex":"#7a1f24"},{"name":"Black","hex":"#1a1a1a"}]',22,4.9,97,false,true,true,6),
('lovers-tee-women','The Lovers Tee — Women''s Fit','Relaxed Graphic Tee','Our best-selling tarot print in a relaxed women''s cut.','240 GSM 100% combed cotton','Machine wash cold, inside out.','graphic','women','{graphic-tees}',1199,null,'{p-lovers,c-women}','[{"name":"Black","hex":"#1a1a1a"}]',0,4.8,33,false,false,false,7),
('emblem-tee-women','Emblem Tee — Women''s Fit','Relaxed Tee','The elephant emblem tee, cut relaxed for her.','220 GSM 100% cotton','Machine wash cold.','minimal','women','{oversized}',949,null,'{p-elephant,story}','[{"name":"White","hex":"#f4f2ec"}]',30,4.6,21,false,false,false,8),
('forest-signature-tee','Forest Signature Tee','Minimal Oversized Tee','Signature tee in deep forest green.','220 GSM 100% cotton','Machine wash cold.','minimal','women','{oversized}',999,null,'{p-roots,c-women}','[{"name":"Forest","hex":"#1f3d2f"}]',25,4.5,12,false,false,false,9),
('vision-tee-black','Vision Tee — Night','Oversized Graphic Tee','The Vision artwork, reimagined on black.','240 GSM 100% combed cotton','Machine wash cold, inside out.','graphic','men','{graphic-tees}',1249,1499,'{c-graphic,p-vision}','[{"name":"Black","hex":"#1a1a1a"}]',18,4.7,29,false,false,false,10),
('heritage-sand-men','Heritage Tee — Men','Oversized Graphic Tee','Back-print elephant on sand, cut for men.','240 GSM 100% combed cotton','Machine wash cold.','graphic','men','{oversized,graphic-tees}',1299,null,'{c-oversized,p-heritage}','[{"name":"Sand","hex":"#d8c9b0"}]',14,4.8,19,false,false,false,11),
('everyday-black-tee','Everyday Black Tee','Essential Oversized Tee','The essential black oversized tee. No noise, all fit.','220 GSM 100% cotton','Machine wash cold.','minimal','men','{oversized}',899,null,'{c-men,p-signature}','[{"name":"Black","hex":"#1a1a1a"}]',90,4.6,140,false,true,false,12);