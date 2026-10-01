
create extension if not exists pgcrypto;
create sequence if not exists public.order_seq start 1;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', phone text, cpf text, birth_date date,
 role text not null default 'customer' check(role in('customer','admin')),
 consent_privacy_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.addresses(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 label text default 'Principal', cep text not null, street text not null, number text not null, complement text,
 neighborhood text not null, city text not null, state text not null, is_default boolean default false, created_at timestamptz default now()
);
create table if not exists public.products(
 id uuid primary key default gen_random_uuid(), sku text unique not null, name text not null, slug text unique not null,
 description text, category text, price numeric(12,2) not null check(price>=0), compare_at_price numeric(12,2),
 image_url text, active boolean default true, weight_kg numeric(8,3) default .5,
 width_cm numeric(8,2) default 20,height_cm numeric(8,2) default 12,length_cm numeric(8,2) default 30, created_at timestamptz default now()
);
create table if not exists public.product_variants(
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 sku text unique not null,size text,color text,stock integer not null default 0 check(stock>=0),active boolean default true
);
create table if not exists public.favorites(
 user_id uuid references auth.users(id) on delete cascade,product_id uuid references public.products(id) on delete cascade,
 created_at timestamptz default now(),primary key(user_id,product_id)
);
create table if not exists public.carts(
 id uuid primary key default gen_random_uuid(),user_id uuid unique references auth.users(id) on delete cascade,updated_at timestamptz default now()
);
create table if not exists public.cart_items(
 cart_id uuid references public.carts(id) on delete cascade,variant_id uuid references public.product_variants(id),
 quantity integer not null check(quantity>0),primary key(cart_id,variant_id)
);
create table if not exists public.coupons(
 id uuid primary key default gen_random_uuid(),code text unique not null,kind text not null check(kind in('percent','fixed')),
 value numeric(12,2) not null,min_order numeric(12,2) default 0,starts_at timestamptz,ends_at timestamptz,
 usage_limit integer,used_count integer default 0,active boolean default true
);
create table if not exists public.orders(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),
 order_number text unique not null default ('ELN-'||lpad(nextval('public.order_seq')::text,6,'0')),
 status text not null default 'pending_payment',payment_status text not null default 'pending',
 subtotal numeric(12,2) not null,shipping numeric(12,2) not null default 0,discount numeric(12,2) not null default 0,total numeric(12,2) not null,
 shipping_service text,shipping_deadline text,tracking_code text,payment_provider text default 'mercadopago',
 provider_order_id text,created_at timestamptz default now(),updated_at timestamptz default now()
);
create table if not exists public.order_items(
 id uuid primary key default gen_random_uuid(),order_id uuid references public.orders(id) on delete cascade,
 product_id uuid references public.products(id),variant_id uuid references public.product_variants(id),
 sku text not null,name text not null,variant_label text,unit_price numeric(12,2) not null,quantity integer not null check(quantity>0)
);
create table if not exists public.consent_logs(
 id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete set null,
 consent_type text not null,accepted boolean not null,policy_version text not null,created_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin')
$$;

alter table public.profiles enable row level security; alter table public.addresses enable row level security;
alter table public.products enable row level security; alter table public.product_variants enable row level security;
alter table public.favorites enable row level security; alter table public.carts enable row level security;
alter table public.cart_items enable row level security; alter table public.coupons enable row level security;
alter table public.orders enable row level security; alter table public.order_items enable row level security;
alter table public.consent_logs enable row level security;

create policy "catalog read" on public.products for select using(active or public.is_admin());
create policy "variant read" on public.product_variants for select using(active or public.is_admin());
create policy "own profile" on public.profiles for select using(id=auth.uid() or public.is_admin());
create policy "own profile insert" on public.profiles for insert with check(id=auth.uid());
create policy "own profile update" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy "own address" on public.addresses for all using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
create policy "own favorite" on public.favorites for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own cart" on public.carts for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own cart items" on public.cart_items for all using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()))
 with check(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy "own orders" on public.orders for select using(user_id=auth.uid() or public.is_admin());
create policy "own order items" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and(o.user_id=auth.uid() or public.is_admin())));
create policy "consent insert" on public.consent_logs for insert with check(user_id=auth.uid());
create policy "admin products" on public.products for all using(public.is_admin()) with check(public.is_admin());
create policy "admin variants" on public.product_variants for all using(public.is_admin()) with check(public.is_admin());
create policy "admin coupons" on public.coupons for all using(public.is_admin()) with check(public.is_admin());
