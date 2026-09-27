/* ---------- actions ---------- */
function toast(m){const t=$("toast"); if(!t) return; t.textContent=m;t.classList.add("show");clearTimeout(toast._);toast._=setTimeout(()=>t.classList.remove("show"),2200);}
function openPos(sym,usdAmt,stop,target){
  const cash=cashBal(); usdAmt=Math.min(usdAmt,cash); if(usdAmt<1){toast("Not enough cash");return;}
  const q=+(usdAmt/A[sym].px).toFixed(A[sym].dp);
  if(q<=0){toast("Size too small");return;}
  const idea=IDEAS.find(i=>i.sym===sym);
  book.push({id:"P"+(seq++),sym,qty:q,entry:A[sym].px,stop:stop!=null?stop:(idea&&idea.stop),target:target!=null?target:(idea&&idea.target)});
  toast("Bought "+q+" "+sym+" at "+px(sym));
}
function sellUsd(sym,amt){
  let left=amt/A[sym].px;
  for(const p of book.filter(p=>p.sym===sym)){
    const q=Math.min(p.qty,left); realized+=q*(A[sym].px-p.entry); p.qty=+(p.qty-q).toFixed(A[sym].dp); left-=q; if(left<=1e-9)break;
  }
  book=book.filter(p=>p.qty>0); toast("Sold "+usd(amt)+" of "+sym);
}
function closePos(id,frac){
  if(frac==null) frac=1;
  const p=book.find(x=>x.id===id); if(!p)return;
  const q=+(p.qty*frac).toFixed(A[p.sym].dp);
  realized+=q*(A[p.sym].px-p.entry); p.qty=+(p.qty-q).toFixed(A[p.sym].dp);
  if(frac<1){p.stop=p.entry;} book=book.filter(x=>x.qty>0);
  toast(frac<1?"Trimmed "+p.sym+", stop to entry":"Closed "+p.sym);
}
function runAct(a){
  if(!a)return;
  if(a.type==="buy") openPos(a.sym,a.usd);
  if(a.type==="sell") sellUsd(a.sym,a.usd);
  if(a.type==="close") closePos(a.id);
  if(a.type==="trim") closePos(a.id,.5);
  if(a.type==="flatten") flatten();
  render();
}
function flatten(){ book.forEach(p=>realized+=p.qty*(A[p.sym].px-p.entry)); book=[]; toast("Book flattened"); }
function drawIdeas(){
  const box=$("ideas"); if(!box) return;
  const list=IDEAS.filter(i=>filter==="all"||i.status===filter);
  const lab={rec:"Recommended",idea:"Idea",watch:"Watching"};
  box.innerHTML=list.map(i=>{
    const risk=Math.abs(i.entry-i.stop), rew=Math.abs(i.target-i.entry), rr=rew/risk;
    const riskNav=i.size*(risk/i.entry);
    const held=book.some(p=>p.sym===i.sym);
    const canFill = i.status!=="watch" || A[i.sym].px<=i.entry;
    return `<article class="idea">
      <div class="idea-top"><span class="tick"><span class="sw" style="background:var(${A[i.sym].col})"></span>${i.sym}</span><span class="pill ${i.status}">${lab[i.status]}</span></div>
      <p class="thesis">${i.thesis}</p>
      <button class="btn" data-idea="${i.id}" ${held||!canFill?"disabled":""}>${held?"In book":"Paper buy"}</button>
    </article>`;
  }).join("") || `<div class="empty">No ideas in this view.</div>`;
  box.querySelectorAll("[data-idea]").forEach(b=>b.onclick=()=>{const i=IDEAS.find(x=>x.id===b.dataset.idea);openPos(i.sym,i.size*nav(),i.stop,i.target);render();});
}
function drawBook(){
  const box=$("book"); if(!box) return;
  if(!book.length){box.innerHTML=`<div class="empty">No overlay positions.</div>`;return;}
  box.innerHTML=`<table><tbody>${book.map(p=>`<tr><td>${p.sym}</td><td>${usd(p.qty*A[p.sym].px)}</td></tr>`).join("")}</tbody></table>`;
}
function drawMarks(){
  const box=$("marks"); if(!box) return;
  box.innerHTML=KEYS.map(k=>`<label class="mk">${k}<input id="mk-${k}" type="number" step="any" value="${A[k].px}"></label>`).join("");
  KEYS.forEach(k=>{ const el=$("mk-"+k); if(el) el.onchange=e=>{const v=+e.target.value;if(v>0){A[k].px=v;render(true);}}; });
}
function drawKpis(){
  if(!$("k-nav")) return;
  const n=nav(), w=weightsNow(), open=KEYS.reduce((s,k)=>s+book.filter(p=>p.sym===k).reduce((a,p)=>a+p.qty*(A[k].px-p.entry),0),0);
  $("k-nav").textContent=usd(n);
  $("k-pnl").textContent=sgn(open);
  const inv=1-w.CASH; if($("k-inv")) $("k-inv").textContent=pct(inv,0);
  if($("k-inv-m")) $("k-inv-m").style.width=Math.min(100,inv*100)+"%";
  if($("k-cr")) $("k-cr").textContent=pct(w.BTC+w.ETH,0);
  const dd=Math.max(0,(START-n)/START); if($("k-dd")) $("k-dd").textContent=pct(RULES.deskStop-dd);
  if($("rules")) $("rules").innerHTML="";
}
function clock(){
  const el=$("mkt"); if(!el) return;
  const now=new Date(); const ct=new Date(now.toLocaleString("en-US",{timeZone:"America/Chicago"}));
  const d=ct.getDay(), m=ct.getHours()*60+ct.getMinutes(); const open=d>0&&d<6&&m>=510&&m<900;
  const t=ct.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  el.innerHTML=`<span class="dot ${open?"on":"off"}"></span>US market ${open?"open":"closed"} · ${t} CT`;
}
