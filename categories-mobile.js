(() => {
  "use strict";
  const init=()=>{
    const toggle=document.getElementById("products-menu-toggle");
    const bar=document.getElementById("categories-bar");
    if(!toggle||!bar) return;
    const close=()=>{ bar.classList.remove("mobile-open"); toggle.setAttribute("aria-expanded","false"); };
    toggle.addEventListener("click",()=>{
      const open=bar.classList.toggle("mobile-open");
      toggle.setAttribute("aria-expanded",String(open));
    });
    bar.addEventListener("click",e=>{
      if(e.target.closest(".category-btn") && matchMedia("(max-width:700px)").matches) close();
    });
    document.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); });
    addEventListener("resize",()=>{ if(innerWidth>700) close(); });
  };
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init,{once:true}):init();
})();