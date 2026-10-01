import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const C={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const J=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:C});
 if(req.method!=="POST")return J({error:"Método não permitido"},405);
 try{
  const U=Deno.env.get("SUPABASE_URL"),A=Deno.env.get("SUPABASE_ANON_KEY"),S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!U||!A||!S)return J({error:"Supabase incompleto"},503);
  const userSb=createClient(U,A,{global:{headers:{Authorization:req.headers.get("Authorization")||""}}});
  const {data:{user}}=await userSb.auth.getUser(); if(!user)return J({error:"Faça login para finalizar o pedido."},401);
  const sb=createClient(U,S),b=await req.json(),raw=Array.isArray(b.items)?b.items:[];
  if(!raw.length)return J({error:"Carrinho vazio"},400);
  let subtotal=0; const items:any[]=[];
  for(const x of raw){
   const qty=Math.max(1,Math.min(20,Number(x.quantity)||1));
   const {data:v}=await sb.from("product_variants").select("id,sku,size,color,stock,active,product_id,products(id,sku,name,price,active)").eq("id",x.variant_id).maybeSingle();
   const p:any=v?.products;if(!v||!p||!v.active||!p.active)return J({error:"Produto ou tamanho indisponível."},409);
   if(Number(v.stock)<qty)return J({error:`Estoque insuficiente para ${p.name} tamanho ${v.size}.`},409);
   const price=Number(p.price);subtotal+=price*qty;
   items.push({product_id:p.id,variant_id:v.id,sku:v.sku,name:p.name,variant_label:`Tamanho ${v.size}`,unit_price:price,quantity:qty});
  }
  let discount=0,couponCode="";
  if(b.coupon_code){
   couponCode=String(b.coupon_code).trim().toUpperCase();
   const {data:c}=await sb.from("coupons").select("*").eq("code",couponCode).eq("active",true).maybeSingle();
   const now=Date.now();
   if(c&&(!c.starts_at||+new Date(c.starts_at)<=now)&&(!c.ends_at||+new Date(c.ends_at)>=now)&&subtotal>=Number(c.min_order||0)&&(!c.usage_limit||Number(c.used_count)<Number(c.usage_limit))){
    discount=c.kind==="percent"?subtotal*Number(c.value)/100:Number(c.value);discount=Math.min(discount,subtotal);
   }else couponCode="";
  }
  // Delivery fee is validated against server-side business formula using distance produced by the route calculator.
  let shipping=0;
  if(b.fulfillment==="delivery"){
   const km=Number(b.one_way_km),max=Number(Deno.env.get("MAX_DELIVERY_ONE_WAY_KM")||"10");
   const consumption=Number(Deno.env.get("VEHICLE_KM_PER_LITER")||"13.5"),fuel=Number(Deno.env.get("FUEL_PRICE_PER_LITER")||"6.50");
   if(!Number.isFinite(km)||km<0||km>max)return J({error:"Entrega fora da área permitida."},400);
   shipping=Math.round(((km*2/consumption)*fuel)*100)/100;
  }
  const total=Math.round((subtotal-discount+shipping)*100)/100;
  const {data:profile}=await sb.from("profiles").select("full_name,phone").eq("id",user.id).maybeSingle();
  const {data:o,error:oe}=await sb.from("orders").insert({user_id:user.id,subtotal,shipping,discount,total,
    coupon_code:couponCode||null,customer_name:profile?.full_name||"",customer_email:user.email||"",customer_phone:profile?.phone||"",
    shipping_address:b.shipping_address||null,shipping_service:b.fulfillment||"delivery",payment_method:b.payment_method||"PIX",
    status:"pending_payment",payment_status:"pending"}).select("*").single();
  if(oe)throw oe;
  await sb.from("order_items").insert(items.map(x=>({...x,order_id:o.id})));
  if(String(b.payment_method||"PIX").toUpperCase()!=="PIX")return J({order:o});
  const token=Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");if(!token)return J({order:o,error:"Mercado Pago não conectado."},503);
  const mpR=await fetch("https://api.mercadopago.com/v1/payments",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json","X-Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({
    transaction_amount:total,description:`Pedido ${o.order_number}`,payment_method_id:"pix",external_reference:o.id,
    payer:{email:user.email,identification:b.payer_cpf?{type:"CPF",number:String(b.payer_cpf).replace(/\D/g,"")}:undefined}
  })});
  const mp=await mpR.json();if(!mpR.ok)return J({order:o,error:"Pedido criado, mas não foi possível gerar o Pix.",details:mp?.message||null},502);
  const tx=mp?.point_of_interaction?.transaction_data||{};
  await sb.from("orders").update({provider_payment_id:String(mp.id)}).eq("id",o.id);
  return J({order:o,payment_id:mp.id,status:mp.status,amount:mp.transaction_amount,qr_code:tx.qr_code||null,qr_code_base64:tx.qr_code_base64||null,ticket_url:tx.ticket_url||null});
 }catch(e){console.error(e);return J({error:"Erro interno ao criar pedido."},500)}
});