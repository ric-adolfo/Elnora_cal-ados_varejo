(() => {
  "use strict";
  const ready = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, {once:true}) : fn();
  ready(() => {
    const toggle=document.getElementById("elnora-chat-toggle"), panel=document.getElementById("elnora-chat-panel"), close=document.getElementById("elnora-chat-close"), form=document.getElementById("elnora-chat-form"), input=document.getElementById("elnora-chat-input"), messages=document.getElementById("elnora-chat-messages");
    if(!toggle||!panel||!form||!input||!messages) return;
    const setOpen = open => { panel.classList.toggle("is-open",open); panel.setAttribute("aria-hidden",String(!open)); if(open) setTimeout(()=>input.focus(),120); };
    toggle.addEventListener("click",()=>setOpen(!panel.classList.contains("is-open")));
    close?.addEventListener("click",()=>setOpen(false));
    document.addEventListener("keydown",e=>{if(e.key==="Escape")setOpen(false)});
    const add=(text,who,extra="")=>{const el=document.createElement("div");el.className=`elnora-msg elnora-msg-${who} ${extra}`.trim();el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el};
    form.addEventListener("submit", async e => {
      e.preventDefault(); const message=input.value.trim(); if(!message)return;
      add(message,"user"); input.value=""; input.disabled=true; const btn=form.querySelector("button"); btn.disabled=true;
      const typing=add("Elnora está consultando o catálogo...","bot","elnora-msg-typing");
      try{
        if(!window.ELNORA_PRO?.ready||!window.ELNORA_PRO?.supabase) throw new Error("Conexão com a loja indisponível.");
        const {data,error}=await window.ELNORA_PRO.supabase.functions.invoke("nora-ai",{body:{message}});
        if(error) throw error;
        if(!data?.success||!data?.answer) throw new Error(data?.error||"A Elnora não conseguiu responder agora.");
        typing.remove(); add(data.answer,"bot");
      }catch(err){console.error("ELNORA CHAT:",err);typing.remove();add("Não consegui responder agora. Você pode tentar novamente ou falar conosco pelo WhatsApp.","bot");}
      finally{input.disabled=false;btn.disabled=false;input.focus()}
    });
  });
})();
