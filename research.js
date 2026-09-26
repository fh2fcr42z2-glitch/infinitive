async function drawResearch(){
  const box=document.getElementById("rs-list");
  const tryb=document.getElementById("rs-try");
  if(!box) return;
  try{
    const j=await (await fetch("research.json?t="+Date.now())).json();
    box.innerHTML=(j.names||[]).map(n=>`<div class="step">
      <span class="k ${String(n.call).indexOf("DO NOT")>=0?"sell":"wait"}">${n.sym.slice(0,3)}</span>
      <div><div class="t">${n.sym} · ${n.call} · ${n.usd!=null?"$"+Math.round(n.usd):"opt"}</div>
      <div class="why"><b>Why.</b> ${n.why}<br><b>Wrong.</b> ${n.wrong}<br><b>Alpha.</b> ${n.alpha}</div></div>
    </div>`).join("");
    if(tryb) tryb.innerHTML="<p class=\"fine\">"+(j.concentration||"")+"</p>"+(j.try||[]).map(t=>`<div class=\"step\"><span class=\"k buy\">T</span><div><div class=\"t\">${t}</div></div></div>`).join("")+(j.do_not||[]).map(t=>`<div class=\"step\"><span class=\"k sell\">X</span><div><div class=\"t\">${t}</div></div></div>`).join("");
  }catch(e){ box.innerHTML="<div class=\"empty\">research.json missing</div>"; }
}
drawResearch();
