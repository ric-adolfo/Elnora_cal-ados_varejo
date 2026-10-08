(function(){
"use strict";
const cfg=window.ELNORA_CONFIG||{},siteUrl=String(cfg.SITE_URL||location.origin).replace(/\/$/,"");
window.ELNORA_PRO={ready:false};
if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY||!window.supabase){console.info("ELNORA PRO: configure Supabase.");return}
const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);
window.ELNORA_PRO={
 ready:true,supabase:sb,
 async signUp(email,password,profile){
  const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:`${siteUrl}/index.html`}});
  if(error)throw error;
  if(data.user){
   const {error:pe}=await sb.from("profiles").upsert({id:data.user.id,full_name:profile.full_name||"",phone:profile.phone||"",cpf:profile.cpf||null,birth_date:profile.birth_date||null,consent_privacy_at:new Date().toISOString()});
   if(pe)console.warn("Perfil será sincronizado após confirmação.",pe);
   if(profile.cep&&profile.street&&profile.number){
    await sb.from("addresses").insert({user_id:data.user.id,cep:profile.cep,street:profile.street,number:profile.number,complement:profile.complement||null,neighborhood:profile.neighborhood||"",city:profile.city||"",state:profile.state||"SP",is_default:true});
   }
  } return data;
 },
 async signIn(email,password){const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;return data},
 async signOut(){return sb.auth.signOut()},
 async resetPassword(email){const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:`${siteUrl}/reset-password.html`});if(error)throw error;return true},
 async catalog(){const {data,error}=await sb.from("products").select("id,sku,name,slug,description,category,price,image_url,product_variants(id,sku,size,color,stock,active)").eq("active",true).order("name");if(error)throw error;return data||[]},
 async myProfile(){const {data:{user}}=await sb.auth.getUser();if(!user)return null;const [{data:p},{data:a}]=await Promise.all([sb.from("profiles").select("*").eq("id",user.id).maybeSingle(),sb.from("addresses").select("*").eq("user_id",user.id).eq("is_default",true).maybeSingle()]);return {user,profile:p,address:a}},
 async myOrders(){const {data:{user}}=await sb.auth.getUser();if(!user)return[];const {data,error}=await sb.from("orders").select("id,order_number,status,payment_status,total,shipping,discount,tracking_code,created_at,order_items(name,variant_label,quantity,unit_price)").eq("user_id",user.id).order("created_at",{ascending:false});if(error)throw error;return data||[]},
 async createOrder(payload){const {data,error}=await sb.functions.invoke("create-order",{body:payload});if(error)throw error;return data},
 async quoteShipping(payload){const {data,error}=await sb.functions.invoke("shipping-quote",{body:payload});if(error)throw error;return data},
 async createPayment(payload){const {data,error}=await sb.functions.invoke("create-payment",{body:payload});if(error)throw error;return data},
 async askElnora(message){const {data,error}=await sb.functions.invoke("nora-ai",{body:{message}});if(error)throw error;return data},
  async paymentStatus(paymentId){const {data,error}=await sb.functions.invoke("payment-status",{body:{payment_id:paymentId}});if(error)throw error;return data}
};
})();