
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async(req)=>{try{const b=await req.json(),t=Deno.env.get("MELHOR_ENVIO_TOKEN");if(!t)throw new Error("Token de frete não configurado");
const base=Deno.env.get("MELHOR_ENVIO_BASE_URL")||"https://sandbox.melhorenvio.com.br";
const r=await fetch(`${base}/api/v2/me/shipment/calculate`,{method:"POST",headers:{"Authorization":`Bearer ${t}`,"Accept":"application/json","Content-Type":"application/json","User-Agent":"ELNORA Ecommerce"},body:JSON.stringify(b)});
return new Response(await r.text(),{status:r.status,headers:{"Content-Type":"application/json"}})}catch(e){return Response.json({error:String(e)},{status:500})}});
