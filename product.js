document.addEventListener("DOMContentLoaded", async ()=>{
 const root=document.getElementById("product-detail");
 const params=new URLSearchParams(location.search), slug=params.get("slug"), sku=params.get("sku");
 const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 const escape=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 try{
  if(!window.ELNORA_PRO?.ready) throw new Error("Catálogo temporariamente indisponível.");
  const catalog=await window.ELNORA_PRO.catalog();
  const p=catalog.find(x=>(slug&&x.slug===slug)||(sku&&x.sku===sku));
  if(!p) throw new Error("Produto não encontrado.");
  document.title=`${p.name} | ELNORA Calçados & Varejo`;
  document.querySelector('meta[name="description"]').content=(p.description||`Compre ${p.name} na ELNORA Calçados & Varejo.`).slice(0,155);
  const variants=(p.product_variants||[]).filter(v=>v.active!==false);
  const available=variants.filter(v=>Number(v.stock)>0);
  root.innerHTML=`
   <section class="product-gallery">
    <div class="product-main-image"><img src="${escape(p.image_url||"")}" alt="${escape(p.name)}"></div>
    <p class="product-photo-note">Cadastre no painel fotos frontal, lateral, traseira e detalhes para completar a galeria.</p>
   </section>
   <section class="product-info">
    <p class="product-sku">SKU ${escape(p.sku)}</p>
    <h1>${escape(p.name)}</h1>
    <p class="product-detail-price">${money(p.price)}</p>
    <p class="product-detail-pix">Consulte as condições de pagamento no checkout.</p>
    <p class="product-description">${escape(p.description||"")}</p>
    <div class="product-option"><label for="detail-size">Escolha o tamanho</label>
      <select id="detail-size"><option value="">Selecione</option>${variants.map(v=>`<option value="${escape(v.id)}" data-stock="${Number(v.stock)}" ${Number(v.stock)<=0?"disabled":""}>${escape(v.size)}${v.color?` · ${escape(v.color)}`:""} — ${Number(v.stock)>0?`${v.stock} disponível(is)`:"Esgotado"}</option>`).join("")}</select>
    </div>
    <div class="size-guide"><strong>Guia de medidas</strong><p>Confira a medida do fabricante do produto antes da compra. As medidas específicas devem ser cadastradas junto ao produto real.</p></div>
    <button id="detail-buy" class="detail-buy" ${available.length?"":"disabled"}>${available.length?"Escolher tamanho e comprar":"Produto esgotado"}</button>
    <div class="product-care"><strong>Informações do produto</strong><p>Material, acabamento, origem e instruções de conservação devem ser preenchidos com os dados reais do fornecedor.</p></div>
   </section>`;
  window.elnoraTrack?.("view_item",{currency:"BRL",value:Number(p.price),items:[{item_id:p.sku,item_name:p.name,price:Number(p.price)}]});
  document.getElementById("detail-buy")?.addEventListener("click",()=>{
    const sel=document.getElementById("detail-size");
    if(!sel.value){alert("Selecione o tamanho.");sel.focus();return}
    sessionStorage.setItem("elnora_product_selection",JSON.stringify({sku:p.sku,variantId:sel.value,size:sel.selectedOptions[0].textContent,quantity:1}));
    location.href=`index.html?add=${encodeURIComponent(p.sku)}&variant=${encodeURIComponent(sel.value)}`;
  });
 }catch(e){root.innerHTML=`<div class="product-detail-error"><h1>Não foi possível abrir o produto</h1><p>${escape(e.message)}</p><a href="index.html">Voltar para a loja</a></div>`}
});