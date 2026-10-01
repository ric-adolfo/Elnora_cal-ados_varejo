(() => {
  "use strict";
  const ready = (fn) => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, {once:true}) : fn();

  ready(() => {
    const wrap = document.querySelector(".mobile-actions-wrap");
    const toggle = document.getElementById("mobile-actions-toggle");
    const menu = document.getElementById("mobile-actions-menu");
    if (!wrap || !toggle || !menu) return;

    const closeMenu = () => {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded","false");
    };
    const openMenu = () => {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded","true");
    };

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.hidden ? openMenu() : closeMenu();
    });

    menu.addEventListener("click", (e) => {
      const btn=e.target.closest("button");
      if(!btn) return;

      const targetId=btn.dataset.mobileTarget;
      if(targetId){
        document.getElementById(targetId)?.click();
        closeMenu();
        return;
      }
      if(btn.hasAttribute("data-mobile-cart")){
        document.querySelector(".header-actions .cart-icon")?.click();
        closeMenu();
      }
    });

    document.addEventListener("click", (e) => {
      if(!wrap.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if(e.key==="Escape") closeMenu();
    });

    // Espelha o contador original do carrinho no menu compacto.
    const originalBadge=document.querySelector(".header-actions .cart-icon .cart-count, .header-actions .cart-icon .cart-badge");
    const mobileBadge=menu.querySelector(".mobile-cart-count");
    const sync=()=>{
      if(originalBadge && mobileBadge) mobileBadge.textContent=(originalBadge.textContent||"0").trim();
    };
    sync();
    if(originalBadge && window.MutationObserver){
      new MutationObserver(sync).observe(originalBadge,{childList:true,subtree:true,characterData:true});
    }
  });
})();