(() => {
  "use strict";

  const ready = fn => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, {once:true})
    : fn();

  ready(() => {
    const fixedTop = document.getElementById("elnora-fixed-top");
    const back = document.getElementById("elnora-back-to-top");
    const account = document.getElementById("account-panel");
    const accountBtn = document.getElementById("account-btn");

    const syncHeight = () => {
      if (!fixedTop) return;
      const hidden = document.body.classList.contains("elnora-account-open");
      const h = hidden ? 0 : Math.ceil(fixedTop.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--elnora-fixed-top-height", h + "px");
    };

    const accountIsOpen = () => !!account?.classList.contains("show");
    const syncAccount = () => {
      document.body.classList.toggle("elnora-account-open", accountIsOpen());
      syncHeight();
    };

    accountBtn?.addEventListener("click", () => {
      document.body.classList.add("elnora-account-open");
      syncHeight();
    }, true);

    document.addEventListener("click", e => {
      if (e.target.closest('[data-mobile-target="account-btn"]')) {
        document.body.classList.add("elnora-account-open");
        syncHeight();
      }
      setTimeout(syncAccount, 0);
    }, true);

    if (account && window.MutationObserver) {
      new MutationObserver(syncAccount).observe(account, {attributes:true, attributeFilter:["class"]});
    }

    const syncBack = () => back?.classList.toggle("show", scrollY > 300);
    back?.addEventListener("click", () => scrollTo({top:0, behavior:"smooth"}));
    addEventListener("scroll", syncBack, {passive:true});
    addEventListener("resize", syncHeight, {passive:true});
    addEventListener("load", syncHeight, {once:true});

    if (fixedTop && window.ResizeObserver) new ResizeObserver(syncHeight).observe(fixedTop);

    syncHeight();
    syncBack();
    syncAccount();
  });
})();
