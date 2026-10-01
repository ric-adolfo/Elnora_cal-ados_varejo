import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async(req)=>{
 try{
  const b=await req.json(), km=Number(b.one_way_km), max=Number(Deno.env.get("MAX_DELIVERY_ONE_WAY_KM")||"10");
  if(!Number.isFinite(km)||km<0) return Response.json({error:"Distância inválida"},{status:400});
  if(km>max) return Response.json({eligible:false,one_way_km:km,max_one_way_km:max});
  const consumption=Number(Deno.env.get("VEHICLE_KM_PER_LITER")||"0");
  const fuel=Number(Deno.env.get("FUEL_PRICE_PER_LITER")||"0");
  if(!(consumption>0)||!(fuel>0)) return Response.json({error:"Configure consumo e combustível"},{status:503});
  const round=km*2, liters=round/consumption, fee=Math.round(liters*fuel*100)/100;
  return Response.json({eligible:true,one_way_km:km,round_trip_km:round,liters_estimated:liters,delivery_fee:fee});
 }catch(e){return Response.json({error:String(e)},{status:500})}
});