/* GA4 só é carregado após consentimento explícito para métricas. */
(function(){
 let loaded=false;
 function load(){
   if(loaded)return;
   const id=(window.ELNORA_CONFIG||{}).GA4_MEASUREMENT_ID;
   if(!id)return;
   loaded=true;
   const s=document.createElement("script");s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;document.head.appendChild(s);
   window.dataLayer=window.dataLayer||[];
   window.gtag=function(){dataLayer.push(arguments)};
   gtag("js",new Date());gtag("config",id,{send_page_view:true});
   window.elnoraTrack=(name,params={})=>gtag("event",name,params);
   window.elnoraTrackPurchase=(order)=>gtag("event","purchase",order);
 }
 window.ELNORA_ANALYTICS={load};
})();
