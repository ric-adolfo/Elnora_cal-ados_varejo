import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async(req)=>{
 try{
  const T=Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN"),U=Deno.env.get("SUPABASE_URL"),S=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!T||!U||!S)return Response.json({error:"Backend incompleto"},{status:503});
  const b=await req.json().catch(()=>({})),pid=String(b?.data?.id||b?.id||"");if(!pid)return Response.json({received:true});
  const r=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pid)}`,{headers:{Authorization:`Bearer ${T}`}});
  if(!r.ok)return Response.json({error:"Falha ao validar pagamento"},{status:502});
  const mp=await r.json(),oid=String(mp.external_reference||"");if(!oid)return Response.json({received:true});
  const sb=createClient(U,S);const {data:o}=await sb.from("orders").select("id,payment_status,stock_committed_at").eq("id",oid).maybeSingle();
  if(!o)return Response.json({received:true});
  if(mp.status==="approved"&&!o.stock_committed_at){
   const {data:items}=await sb.from("order_items").select("variant_id,quantity").eq("order_id",oid);
   for(const i of items||[])await sb.rpc("decrement_variant_stock",{p_variant:i.variant_id,p_qty:i.quantity});
   await sb.from("orders").update({payment_status:"approved",status:"paid",stock_committed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",oid);
  }else if(mp.status!=="approved") await sb.from("orders").update({payment_status:mp.status||"pending",updated_at:new Date().toISOString()}).eq("id",oid);
  return Response.json({received:true});
 }catch(e){console.error(e);return Response.json({error:"Erro no webhook"},{status:500})}
});