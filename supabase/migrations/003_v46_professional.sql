-- ELNORA V46 — camada profissional, idempotente e compatível com V44
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists provider_payment_id text;
alter table public.orders add column if not exists stock_committed_at timestamptz;

create table if not exists public.product_images(
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 url text not null, alt_text text, position integer not null default 0,
 created_at timestamptz default now()
);
alter table public.product_images enable row level security;

do $$ begin
 create policy "product images read" on public.product_images for select using(true);
exception when duplicate_object then null; end $$;
do $$ begin
 create policy "admin product images" on public.product_images for all using(public.is_admin()) with check(public.is_admin());
exception when duplicate_object then null; end $$;

create or replace function public.decrement_variant_stock(p_variant uuid,p_qty integer)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_qty is null or p_qty<=0 then raise exception 'Quantidade inválida'; end if;
 update public.product_variants set stock=stock-p_qty
 where id=p_variant and active=true and stock>=p_qty;
 if not found then raise exception 'Estoque insuficiente'; end if;
end $$;

-- Catálogo inicial. O administrador deve substituir por produtos/fotos/estoque reais.
insert into public.products(sku,name,slug,description,category,price,image_url)
values
('ELN-TEN-001','Tênis Casual Branco','tenis-casual-branco','Versátil, confortável e perfeito para o dia a dia.','tenis',149.90,'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=700'),
('ELN-TEN-002','Tênis Casual Rosé','tenis-casual-rose','Visual moderno com toque delicado para compor seus looks.','tenis',159.90,'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=700'),
('ELN-SAN-001','Sandália Salto Bloco Nude','sandalia-salto-bloco-nude','Elegância e estabilidade para ocasiões especiais.','sandalias',139.90,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=700'),
('ELN-SAN-002','Sandália Clássica Preta','sandalia-classica-preta','Um clássico indispensável, elegante e fácil de combinar.','sandalias',129.90,'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=700'),
('ELN-SAP-001','Sapatilha Confort Nude','sapatilha-confort-nude','Leveza e conforto para acompanhar sua rotina.','sapatilhas',99.90,'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=700'),
('ELN-MOC-001','Mocassim Elegance','mocassim-elegance','Sofisticação com conforto em um modelo atemporal.','mocassins',149.90,'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=700'),
('ELN-BOT-001','Bota Cano Curto Preta','bota-cano-curto-preta','Personalidade e estilo para produções marcantes.','botas',199.90,'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=700'),
('ELN-SAN-003','Sandália Plataforma Bege','sandalia-plataforma-bege','Altura, conforto e um visual contemporâneo.','sandalias',159.90,'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=700')
on conflict(sku) do update set name=excluded.name,description=excluded.description,category=excluded.category,price=excluded.price,image_url=excluded.image_url;

insert into public.product_variants(product_id,sku,size,color,stock)
select p.id,p.sku||'-'||s.size,s.size,'Padrão',s.stock
from public.products p
cross join (values ('34',2),('35',3),('36',4),('37',4),('38',3),('39',2)) s(size,stock)
where p.sku like 'ELN-%'
on conflict(sku) do nothing;
