let NEWS={items:[],filter:"all"};
function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&","<":"<",">":">","\"":"""}[c]));}
function drawNews(){
  const items=(NEWS.items||[]).filter(x=>NEWS.filter==="all"||x.src===NEWS.filter);
  const box=document.getElementById("nlist");
  const n=document.getElementById("ncount");
  if(n) n.textContent=items.length+" headlines";
  if(!box) return;
  box.innerHTML=items.map(x=>`<a class="step" href="${esc(x.url)}" target="_blank" rel="noopener">
    <span class="k wait">${esc((x.src||"?").slice(0,3).toUpperCase())}</span>
    <div><div class="t">${esc(x.title)}</div>
    <div class="why">${esc(x.src)} · ${esc(x.date||"")} · ${esc(x.sum||"")}</div></div>
  </a>`).join("")||"<div class=\"empty\">No headlines in this filter.</div>";
}
async function loadNews(){
  try{
    const j=await (await fetch("news.json?t="+Date.now())).json();
    NEWS.items=j.items||[];
    const stamp=document.getElementById("stamp");
    const asof=document.getElementById("asof");
    if(stamp) stamp.textContent=j.stamp||stamp.textContent;
    if(asof) asof.textContent=j.asof||"";
    const fil=document.getElementById("nfilter");
    const srcs=["all",...Array.from(new Set((j.feeds||[]).map(f=>f.id)))];
    if(fil){
      fil.innerHTML=srcs.map(s=>`<button data-f="${esc(s)}" aria-pressed="${s==="all"}">${s}</button>`).join("");
      fil.querySelectorAll("button").forEach(b=>b.onclick=()=>{
        NEWS.filter=b.dataset.f; fil.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); drawNews();
      });
    }
    drawNews();
  }catch(e){
    const box=document.getElementById("nlist");
    if(box) box.innerHTML="<div class=\"empty\">news.json missing</div>";
  }
}
loadNews();
