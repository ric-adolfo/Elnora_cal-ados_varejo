
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async(req)=>{
 try{
  const auth=req.headers.get("Authorization")||""; if(!auth) return new Response("Unauthorized",{status:401});
  const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token=auth.replace("Bearer ",""); const {data:{user}}=await sb.auth.getUser(token); if(!user) return new Response("Unauthorized",{status:401});
  const b=await req.json(); if(!Array.isArray(b.items)||!b.items.length) return Response.json({error:"Carrinho vazio"},{status:400});
  let subtotal=0; const safe=[];
  for(const it of b.items){
   const {data:v,error}=await sb.from("product_variants").select("id,sku,size,color,stock,product_id,products(name,price,active)").eq("id",it.variant_id).single();
   if(error||!v||!v.products?.active||v.stock<it.quantity) return Response.json({error:"Produto/estoque indisponível"},{status:409});
   const price=Number(v.products.price); subtotal+=price*it.quantity;
   safe.push({product_id:v.product_id,variant_id:v.id,sku:v.sku,name:v.products.name,variant_label:[v.size,v.color].filter(Boolean).join(" / "),unit_price:price,quantity:it.quantity});
  }
  const shipping=Number(b.shipping||0); const total=subtotal+shipping;
  const {data:o,error:oe}=await sb.from("orders").insert({user_id:user.id,subtotal,shipping,total,shipping_service:b.shipping_service||null}).select().single(); if(oe)throw oe;
  await sb.from("order_items").insert(safe.map(x=>({...x,order_id:o.id})));
  const mpToken=Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN"); if(!mpToken) return Response.json({order:o,mode:"created_without_payment_provider"});
  const preference={items:safe.map(x=>({id:x.sku,title:x.name,quantity:x.quantity,unit_price:x.unit_price,currency_id:"BRL"})),
    external_reference:o.order_number,notification_url:Deno.env.get("PAYMENT_WEBHOOK_URL"),back_urls:b.back_urls,auto_return:"approved"};
  const r=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{"Authorization":`Bearer ${mpToken}`,"Content-Type":"application/json"},body:JSON.stringify(preference)});
  const pay=await r.json(); if(!r.ok) return Response.json({error:"Falha no provedor",details:pay},{status:502});
  await sb.from("orders").update({provider_order_id:String(pay.id)}).eq("id",o.id);
  return Response.json({order:o,payment:pay});
 }catch(e){return Response.json({error:String(e)},{status:500})}
});
