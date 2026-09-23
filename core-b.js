/* ---------- actions ---------- */
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast._);toast._=setTimeout(()=>t.classList.remove("show"),2200);}
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
  const list=IDEAS.filter(i=>filter==="all"||i.status===filter);
  const lab={rec:"Recommended",idea:"Idea",watch:"Watching"};
  $("ideas").innerHTML=list.map(i=>{
    const risk=Math.abs(i.entry-i.stop), rew=Math.abs(i.target-i.entry), rr=rew/risk;
    const riskNav=i.size*(risk/i.entry);
    const held=book.some(p=>p.sym===i.sym);
    const canFill = i.status!=="watch" || A[i.sym].px<=i.entry;
    return `<article class="idea">
      <div class="idea-top"><span class="tick"><span class="sw" style="background:var(${A[i.sym].col})"></span>${i.sym}<span class="muted" style="font:500 12px var(--body)">${i.side}</span></span><span class="pill ${i.status}">${lab[i.status]}</span></div>
      <div class="levels">
        <div class="lv"><div class="label">${i.status==="watch"?"Limit":"Entry"}</div><div class="num">${fmtPx(i.entry)}</div></div>
        <div class="lv"><div class="label">Stop</div><div class="num down">${fmtPx(i.stop)}</div></div>
        <div class="lv"><div class="label">Target</div><div class="num up">${fmtPx(i.target)}</div></div>
      </div>
      <div class="rr"><span class="num">${rr.toFixed(1)} : 1</span><div class="rrbar" aria-hidden="true"><span class="r" style="flex:1"></span><span class="w" style="flex:${rr.toFixed(2)}"></span></div><span>reward : risk</span></div>
      <p class="thesis">${i.thesis}</p>
      <div class="idea-foot">
        <span class="fine">Size ${pct(i.size,0)} NAV · risks ${pct(riskNav,2)}</span>
        <span class="conv" title="Conviction ${i.conv} of 5">${[1,2,3,4,5].map(n=>`<i class="${n<=i.conv?"on":""}"></i>`).join("")}</span>
      </div>
      <button class="btn ${i.status==="rec"&&!held?"primary":""}" data-idea="${i.id}" ${held||!canFill?"disabled":""}>${held?"In book":!canFill?"Waiting for "+fmtPx(i.entry):"Paper buy "+pct(i.size,0)}</button>
    </article>`;
  }).join("") || `<div class="empty">No ideas in this view.</div>`;
  $("ideas").querySelectorAll("[data-idea]").forEach(b=>b.onclick=()=>{const i=IDEAS.find(x=>x.id===b.dataset.idea);openPos(i.sym,i.size*nav(),i.stop,i.target);render();});
  $("ifilter").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===filter));
}
function drawBook(){
  if(!book.length){$("book").innerHTML=`<div class="empty">No open positions. Press <b>Paper fill</b> on a Next move or <b>Paper buy</b> on an idea to start.</div>`;return;}
  $("book").innerHTML=`<table><thead><tr><th>Id</th><th>Inst</th><th>Qty</th><th>Entry</th><th>Last</th><th>Stop</th><th>Value</th><th>P&L</th><th></th></tr></thead><tbody>${
    book.map(p=>{const pl=p.qty*(A[p.sym].px-p.entry), r=pl/(p.qty*p.entry);
      return `<tr><td>${p.id}</td><td class="inst">${p.sym}</td><td>${p.qty}</td><td>${fmtPx(p.entry)}</td><td>${px(p.sym)}</td><td>${p.stop?fmtPx(p.stop):"—"}</td><td>${usd(p.qty*A[p.sym].px)}</td><td class="${pl>=0?"up":"down"}">${sgn(pl)} <span style="opacity:.7">(${(r*100).toFixed(1)}%)</span></td><td><button class="btn ghost" data-close="${p.id}">Close</button></td></tr>`}).join("")
  }</tbody></table>`;
  $("book").querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{closePos(b.dataset.close);render();});
}
function drawMarks(){
  $("marks").innerHTML=`<span class="label">Marks</span>`+KEYS.map(k=>`<label class="mk" for="mk-${k}">${k}<input id="mk-${k}" type="number" step="any" value="${A[k].px}"></label>`).join("");
  KEYS.forEach(k=>$("mk-"+k).onchange=e=>{const v=+e.target.value;if(v>0){A[k].px=v;render(true);}});
}
function drawKpis(){
  const n=nav(), w=weightsNow(), open=KEYS.reduce((s,k)=>s+book.filter(p=>p.sym===k).reduce((a,p)=>a+p.qty*(A[k].px-p.entry),0),0);
  $("k-nav").textContent=usd(n);
  const tot=n-START; $("k-nav-s").innerHTML=`<span class="${tot>=0?"up":"down"}">${sgn(tot)}</span> since start`;
  $("k-pnl").textContent=sgn(open); $("k-pnl").className="v "+(open>0?"up":open<0?"down":"");
  $("k-pnl-s").textContent=(open/n*100).toFixed(2)+"% on NAV · realized "+sgn(realized);
  const inv=1-w.CASH; $("k-inv").textContent=pct(inv,0); $("k-inv-m").style.width=Math.min(100,inv*100)+"%";
  $("k-cr").textContent=pct(w.BTC+w.ETH,0);
  const dd=Math.max(0,(START-n)/START); $("k-dd").textContent=pct(RULES.deskStop-dd);
  $("k-dd").className="v "+(RULES.deskStop-dd<.05?"down":"");
  const maxName=Math.max(...KEYS.map(k=>w[k])), top=KEYS.find(k=>w[k]===maxName);
  const rules=[
    {n:"Largest single name",v:maxName,cap:RULES.maxName,txt:(maxName>0?top:"—")+" "+pct(maxName)+" / 15%"},
    {n:"Crypto sleeve",v:w.BTC+w.ETH,cap:RULES.maxCrypto,txt:pct(w.BTC+w.ETH)+" / 40%"},
    {n:"Drawdown vs desk stop",v:dd,cap:RULES.deskStop,txt:pct(dd)+" / 15%"}
  ];
  $("rules").innerHTML=rules.map(r=>{const f=r.v/r.cap; const c=f>1.01?"bad":f>.8?"warn":"";
    return `<div class="rule"><div class="top2"><span style="font-weight:600">${r.n}</span><span class="num">${r.txt}</span></div><div class="meter"><i class="${c}" style="width:${Math.min(100,f*100)}%"></i></div></div>`;}).join("")+
    `<div class="rule"><div class="top2"><span style="font-weight:600">Execution</span><span class="num">Manual</span></div><span class="fine">Agents never submit live orders. You press the button.</span></div>`;
}
function clock(){
  const now=new Date(); const ct=new Date(now.toLocaleString("en-US",{timeZone:"America/Chicago"}));
  const d=ct.getDay(), m=ct.getHours()*60+ct.getMinutes(); const open=d>0&&d<6&&m>=510&&m<900;
  const t=ct.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  $("mkt").innerHTML=`<span class="dot ${open?"on":"off"}"></span>US market ${open?"open":"closed"} · ${t} CT · crypto 24/7`;
}
