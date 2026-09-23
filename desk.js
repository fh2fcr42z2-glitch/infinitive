/* ---------- agents + tape ---------- */
const AGENTS = {
  HOUSTON:{role:"CIO / market brief",memo:"Sep 22 close. Equities finished firm after the September dip; SPY 773 / QQQ 748. Crypto mid-range: BTC 86.4k, ETH 2,764. Build the core 15/15/12 sleeve. Do not chase QQQ — wait $724. ETH is a starter only."},
  STEFFI:{role:"Structure / tickets",memo:"Tickets stay paper. Size to NAV, not conviction. SPY 15% stop 735. BTC 12% stop 79.5k. ETH 8% stop 2,520. QQQ is a limit, not a market. Two-key flatten. No live submit until IBKR is observe-only."},
  DESMOND:{role:"Risk",memo:"Name cap 15%. Crypto cap 40%. Desk stop −15% then 7 days flat. Pair betas in the book: SPY|QQQ 0.92, BTC|ETH 0.82. A 20% BTC drop at 12% weight costs ~2.4% NAV before the stop. Keep cash ≥50% until both equity sleeves are filled."},
  DOOCEY:{role:"Red team",memo:"Kill QQQ chase: four up days into the high. Kill ETH size-up until $2,900 reclaim. Kill any name above 15%. Kill live routing. If NAV prints −15%, flatten without a meeting."}
};
const TAPE = [
  {tag:"MKT",t:"US cash close 15:00 CT · crypto 24/7"},
  {tag:"SPY",t:"773.38 · near session high after Sep pullback"},
  {tag:"QQQ",t:"747.46 · 52-week high 748.65 · wait 724"},
  {tag:"BTC",t:"86,378 · mid-80s range holds"},
  {tag:"ETH",t:"2,764 · starter only below 2,900"},
  {tag:"RULE",t:"max name 15% · crypto 40% · desk stop −15%"}
];
function drawTape(){
  $("tape").innerHTML=TAPE.map(x=>`<span><span class="tag">${x.tag}</span> <b>${x.t}</b></span>`).join("");
}
function drawQm(){
  const n=nav(), w=weightsNow();
  const cells=[...KEYS,"CASH"].map(k=>{
    const wt=k==="CASH"?w.CASH:w[k];
    const tgt=k==="CASH"?1-KEYS.reduce((s,x)=>s+TARGET[x],0):TARGET[k];
    const last=k==="CASH"?usd(cashBal()):px(k);
    const stopDist=(()=>{
      if(k==="CASH") return "dry powder";
      const idea=IDEAS.find(i=>i.sym===k);
      if(!idea) return "tgt "+pct(tgt,0);
      const d=(A[k].px-idea.stop)/A[k].px;
      return "stop "+pct(d)+" · tgt "+pct(tgt,0);
    })();
    return `<div class="qcell" data-des="${k}">
      <div class="qn"><span class="sw" style="background:var(${A[k].col})"></span>${k==="CASH"?"CASH":k}</div>
      <div class="qp">${last}</div>
      <div class="qw">${pct(wt)} now · ${stopDist}</div>
    </div>`;
  }).join("");
  $("qm").innerHTML=cells;
  $("qm").querySelectorAll("[data-des]").forEach(el=>el.onclick=()=>openDes(el.dataset.des));
}
function openDes(sym){
  const k=(sym||"SPY").toUpperCase();
  if(k!=="CASH" && !A[k]) { toast("Unknown name"); return; }
  const n=nav(), w=weightsNow();
  const idea=IDEAS.find(i=>i.sym===k);
  const held=book.filter(p=>p.sym===k);
  const wt=k==="CASH"?w.CASH:w[k]||0;
  const pairs=k==="CASH"?"":KEYS.filter(x=>x!==k).map(x=>`${k}|${x} ${rho(k,x).toFixed(2)}`).join(" · ");
  $("des-h").textContent="DES "+k;
  $("des-body").innerHTML=`
    <div class="des-grid">
      <div class="lv"><div class="label">Last</div><div class="num">${k==="CASH"?usd(cashBal()):px(k)}</div></div>
      <div class="lv"><div class="label">Weight</div><div class="num">${pct(wt)} / ${pct(k==="CASH"?1-KEYS.reduce((s,x)=>s+TARGET[x],0):TARGET[k]||0,0)} tgt</div></div>
      <div class="lv"><div class="label">Value</div><div class="num">${usd(k==="CASH"?cashBal():mv(k))}</div></div>
      <div class="lv"><div class="label">Stop</div><div class="num">${idea?fmtPx(idea.stop):"—"}</div></div>
      <div class="lv"><div class="label">Target</div><div class="num">${idea?fmtPx(idea.target):"—"}</div></div>
      <div class="lv"><div class="label">In book</div><div class="num">${held.length?held.map(p=>p.id+" "+p.qty).join(", "):"flat"}</div></div>
    </div>
    ${idea?`<p class="thesis">${idea.thesis}</p>`:`<p class="thesis">Cash is dry powder. Deploy only against the plan.</p>`}
    <div class="rho">${pairs||"No pair beta on cash."}</div>
    <article class="agent"><div class="who">Houston</div><div>${AGENTS.HOUSTON.memo}</div></article>
    <article class="agent"><div class="who">Doocey · kill check</div><div>${AGENTS.DOOCEY.memo}</div></article>
    ${k!=="CASH"&&idea?`<button class="btn primary" id="des-fill">Paper buy ${pct(idea.size,0)}</button>`:""}`;
  $("drawer").hidden=false;
  const fill=$("des-fill");
  if(fill) fill.onclick=()=>{openPos(k,idea.size*n,idea.stop,idea.target);render();closeDes();};
}
function closeDes(){ $("drawer").hidden=true; }
$("des-x").onclick=closeDes;
$("drawer").addEventListener("click",e=>{ if(e.target.id==="drawer") closeDes(); });
function showCmd(msg,err){
  const el=$("cmd-out"); el.hidden=!msg; el.textContent=msg||""; el.className="cmd-out"+(err?" err":"");
}
function runCmd(raw){
  const line=(raw||"").trim();
  if(!line) return;
  const parts=line.split(/\s+/);
  const verb=parts[0].toUpperCase();
  const a=(parts[1]||"").toUpperCase();
  const b=parts[2];
  const help=`Commands\n  DES [SPY|QQQ|BTC|ETH|CASH]   name card\n  PLAN / BOOK / RISK / QM / TAPE / WHEEL\n  IDEA [SYM]                   idea card\n  FILL SYM [15|15000]          paper buy % NAV or USD\n  MARK SYM PRICE               update a mark\n  FLAT                         flatten (confirm twice)\n  HOUSTON / STEFFI / DESMOND / DOOCEY\n  HELP                         this list\nNothing live-routes. Paper only.`;
  if(verb==="HELP"||verb==="?"||verb==="H"){ showCmd(help); return; }
  if(verb==="PLAN"){ document.getElementById("plan-h").scrollIntoView({behavior:"smooth"}); showCmd(buildPlan().mood+" — "+buildPlan().steps.map(s=>s.t).join(" · ")); return; }
  if(verb==="BOOK"){ document.getElementById("book-h").scrollIntoView({behavior:"smooth"}); showCmd(book.length?book.map(p=>p.id+" "+p.sym+" "+p.qty).join(" · "):"Book is flat."); return; }
  if(verb==="RISK"){ document.getElementById("rules-h").scrollIntoView({behavior:"smooth"}); const w=weightsNow(); showCmd("Name max "+pct(Math.max(...KEYS.map(k=>w[k])))+" / 15% · crypto "+pct(w.BTC+w.ETH)+" / 40% · room to stop "+pct(RULES.deskStop-Math.max(0,(START-nav())/START))); return; }
  if(verb==="QM"||verb==="WHEEL"||verb==="TARGET"){ view=verb==="TARGET"?"tgt":"now"; drawWheel(); $("qm").scrollIntoView({behavior:"smooth"}); showCmd(verb==="TARGET"?"Showing target wheel.":"Quote strip + current wheel."); return; }
  if(verb==="TAPE"){ $("tape").scrollIntoView({behavior:"smooth"}); showCmd(TAPE.map(x=>x.tag+"  "+x.t).join("\n")); return; }
  if(verb==="IDEA"){
    const i=IDEAS.find(x=>x.sym===(a||x.sym));
    if(!i){ showCmd("No idea for "+(a||"—"),true); return; }
    document.getElementById("ideas-h").scrollIntoView({behavior:"smooth"});
    showCmd(i.sym+" "+i.status+" · entry "+fmtPx(i.entry)+" stop "+fmtPx(i.stop)+" tgt "+fmtPx(i.target)+"\n"+i.thesis);
    return;
  }
  if(verb==="DES"){ openDes(a||"SPY"); showCmd("Opened DES "+(a||"SPY")); return; }
  if(["HOUSTON","STEFFI","DESMOND","DOOCEY"].includes(verb)){ showCmd(verb+" · "+AGENTS[verb].role+"\n"+AGENTS[verb].memo); return; }
  if(verb==="MARK"){
    if(!A[a]||a==="CASH"){ showCmd("MARK SYM PRICE",true); return; }
    const v=+b; if(!(v>0)){ showCmd("Need a price",true); return; }
    A[a].px=v; render(); showCmd("Marked "+a+" "+fmtPx(v)); return;
  }
  if(verb==="FILL"){
    if(!KEYS.includes(a)){ showCmd("FILL SPY|QQQ|BTC|ETH [pct or usd]",true); return; }
    let amt;
    if(!b) amt=(TARGET[a]||0.1)*nav();
    else { const v=+b; if(!(v>0)){ showCmd("Bad size",true); return; } amt=v<=1?v*nav():v<=100?v/100*nav():v; }
    const idea=IDEAS.find(i=>i.sym===a);
    openPos(a,amt,idea&&idea.stop,idea&&idea.target); render(); showCmd("Paper filled "+a+" "+usd(amt)); return;
  }
  if(verb==="FLAT"||verb==="FLATTEN"){
    if(!book.length){ showCmd("Already flat."); return; }
    if(!runCmd._flat){ runCmd._flat=true; setTimeout(()=>runCmd._flat=false,4000); showCmd("Type FLAT again in 4s to confirm."); return; }
    runCmd._flat=false; flatten(); render(); showCmd("Book flattened."); return;
  }
  if(A[verb]||verb==="CASH"){ openDes(verb); showCmd("Opened DES "+verb); return; }
  showCmd("Unknown: "+line+"  —  type HELP",true);
}
$("cmdline").addEventListener("submit",e=>{ e.preventDefault(); runCmd($("cmd").value); $("cmd").select(); });
$("cmd-open").onclick=()=>{ $("cmd").focus(); $("cmd").select(); };
document.addEventListener("keydown",e=>{
  if(e.key==="`" && e.target.tagName!=="INPUT"){ e.preventDefault(); $("cmd").focus(); $("cmd").select(); }
  if(e.key==="Escape"){ closeDes(); $("cmd").blur(); }
});
async function liveCrypto(){
  try{
    const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    if(!r.ok) return;
    const j=await r.json();
    if(j.bitcoin&&j.bitcoin.usd) A.BTC.px=j.bitcoin.usd;
    if(j.ethereum&&j.ethereum.usd) A.ETH.px=j.ethereum.usd;
    $("mark-src").textContent="Marks: CoinGecko crypto · equity close Sep 22";
    render(true);
  }catch(e){}
}
function render(keepMarks){ save(); drawKpis(); drawQm(); drawWheel(); drawPlan(); drawIdeas(); drawBook(); if(!keepMarks) drawMarks(); }
$("v-now").onclick=()=>{view="now";drawWheel();};
$("v-tgt").onclick=()=>{view="tgt";drawWheel();};
$("hz").oninput=()=>drawWheel();
$("ifilter").querySelectorAll("button").forEach(b=>b.onclick=()=>{filter=b.dataset.f;drawIdeas();});
let armed=false;
$("flatten").onclick=e=>{ if(!book.length){toast("Book is already flat");return;} if(!armed){armed=true;e.target.textContent="Press again to flatten";setTimeout(()=>{armed=false;e.target.textContent="Flatten book"},3000);return;} armed=false;e.target.textContent="Flatten book";flatten();render(); };
matchMedia("(prefers-color-scheme: dark)").addEventListener&&matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>render(true));
new MutationObserver(()=>render(true)).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
clock(); setInterval(clock,30000);
drawTape();
render();
liveCrypto();
