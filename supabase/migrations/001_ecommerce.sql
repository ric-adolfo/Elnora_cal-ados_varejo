
create extension if not exists pgcrypto;

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, cpf text, birth_date date,
  role text not null default 'customer' check(role in ('customer','admin')),
  consent_privacy_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.addresses(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  label text default 'Principal', cep text, street text, number text, complement text, neighborhood text, city text, state text,
  is_default boolean default false, created_at timestamptz default now()
);
create table if not exists public.products(
  id uuid primary key default gen_random_uuid(), sku text unique not null, name text not null, slug text unique not null,
  description text, category text, price numeric(12,2) not null check(price>=0), active boolean default true,
  image_url text, weight_kg numeric(8,3) default .5, width_cm numeric(8,2) default 20,
  height_cm numeric(8,2) default 12, length_cm numeric(8,2) default 30, created_at timestamptz default now()
);
create table if not exists public.product_variants(
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  sku text unique not null, size text, color text, stock integer not null default 0 check(stock>=0), active boolean default true
);
create table if not exists public.favorites(
  user_id uuid references auth.users(id) on delete cascade, product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(), primary key(user_id,product_id)
);
create table if not exists public.orders(
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id),
  order_number text unique not null default ('ELN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  status text not null default 'pending', payment_status text not null default 'pending',
  subtotal numeric(12,2) not null default 0, shipping numeric(12,2) not null default 0, discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0, shipping_service text, tracking_code text,
  payment_provider text default 'mercadopago', provider_order_id text, created_at timestamptz default now()
);
create table if not exists public.order_items(
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id), variant_id uuid references public.product_variants(id),
  sku text not null, name text not null, variant_label text, unit_price numeric(12,2) not null, quantity integer not null check(quantity>0)
);
create table if not exists public.consent_logs(
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  consent_type text not null, accepted boolean not null, policy_version text not null, created_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.consent_logs enable row level security;

revoke all on public.profiles,public.addresses,public.favorites,public.orders,public.order_items,public.consent_logs from anon;
grant select on public.products,public.product_variants to anon,authenticated;
grant select,insert,update on public.profiles,public.addresses,public.favorites to authenticated;
grant select on public.orders,public.order_items to authenticated;
grant insert on public.consent_logs to authenticated;

create policy "public active products" on public.products for select to anon,authenticated using(active=true or public.is_admin());
create policy "public active variants" on public.product_variants for select to anon,authenticated using(active=true or public.is_admin());
create policy "own profile select" on public.profiles for select to authenticated using(auth.uid()=id or public.is_admin());
create policy "own profile insert" on public.profiles for insert to authenticated with check(auth.uid()=id);
create policy "own profile update" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
create policy "own addresses select" on public.addresses for select to authenticated using(auth.uid()=user_id or public.is_admin());
create policy "own addresses insert" on public.addresses for insert to authenticated with check(auth.uid()=user_id);
create policy "own addresses update" on public.addresses for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "own favorites select" on public.favorites for select to authenticated using(auth.uid()=user_id);
create policy "own favorites insert" on public.favorites for insert to authenticated with check(auth.uid()=user_id);
create policy "own favorites delete" on public.favorites for delete to authenticated using(auth.uid()=user_id);
create policy "own orders select" on public.orders for select to authenticated using(auth.uid()=user_id or public.is_admin());
create policy "own order items select" on public.order_items for select to authenticated
 using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_admin())));
create policy "own consent insert" on public.consent_logs for insert to authenticated with check(auth.uid()=user_id);
