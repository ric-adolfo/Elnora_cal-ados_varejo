document.addEventListener("DOMContentLoaded",()=>{
 const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 async function orders(){
  const box=document.getElementById("cc-orders-list"),count=document.getElementById("cc-orders-count");if(!box||!window.ELNORA_PRO?.ready)return;
  try{const rows=await window.ELNORA_PRO.myOrders();if(count)count.textContent=rows.length;if(!rows.length)return;
   box.className="cc-orders-real";box.innerHTML=rows.map(o=>`<article class="cc-order-card"><div><strong>${o.order_number||"Pedido"}</strong><span>${new Date(o.created_at).toLocaleDateString("pt-BR")}</span></div><div><span>Status: <b>${o.payment_status||o.status}</b></span><strong>${money(o.total)}</strong></div>${o.tracking_code?`<small>Rastreio: ${o.tracking_code}</small>`:""}</article>`).join("");
  }catch(e){console.warn("Histórico de pedidos indisponível",e)}
 }
 document.querySelector('[data-go="orders"]')?.addEventListener("click",orders);
 document.getElementById("account-btn")?.addEventListener("click",()=>setTimeout(orders,250));
 document.querySelector(".search-input")?.addEventListener("change",e=>window.elnoraTrack?.("search",{search_term:e.target.value||""}));
});