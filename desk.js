const AGENTS = {
  HOUSTON:{role:"CIO / market brief",memo:"Sat 26 Sep 11:50 CT. Combined NAV ~$1,519 = RH $814 + CB $705. SNAP 39% DRV 23%. Coinbase BTC 83,958 ETH 2,687.58. Bitget wash still in the news tape. HOLD book. DO NOT ADD. Read /news before any idea."},
  STEFFI:{role:"Structure / tickets",memo:"Marks: RH stocks, Coinbase crypto + balances. Tickets only after you type them. Overlay is not the book. NEWS and LOOK cannot fill."},
  DESMOND:{role:"Risk",memo:"Two names are 62% of live NAV. CB cash $130 is the only powder. RH BP $0.15. Pending $206 not spendable. No 5x. No headline trade."},
  DOOCEY:{role:"Red team",memo:"Kill live SPY/QQQ/ETH adds. Kill VST add. Kill PUMP/ENA/XPL adds. Kill Look names. Kill XMR 5x. Kill any bot that orders from RSS."}
};
const TAPE = [
  {tag:"MKT",t:"US cash closed · RH Fri ext · Coinbase live · /news up"},
  {tag:"SNAP",t:"RH 5.4385 · 109 sh · HOLD"},
  {tag:"DRV",t:"CB $344 · 49% of Coinbase · HOLD no add"},
  {tag:"BTC",t:"CB 83,958 · qty 0.00045 + RH dust"},
  {tag:"ETH",t:"CB 2,687.58 · qty 0.037 · gate 2,900"},
  {tag:"NEWS",t:"Bitget / ETF bid / Kalshi · headlines ≠ tickets"}
];
function drawTape(){
  $("tape").innerHTML=TAPE.map(x=>`<span><span class="tag">${x.tag}</span> <b>${x.t}</b></span>`).join("");
}
function drawQm(){
  const w=weightsNow();
  const cells=[...KEYS,"CASH"].map(k=>{
    const wt=k==="CASH"?w.CASH:w[k];
    const last=k==="CASH"?usd(cashBal()):px(k);
    const src=k==="BTC"||k==="ETH"?"Coinbase":k==="CASH"?"RH cash":"RH";
    return `<div class="qcell" data-des="${k}">
      <div class="qn"><span class="sw" style="background:var(${A[k].col})"></span>${k==="CASH"?"CASH":k}</div>
      <div class="qp">${last}</div>
      <div class="qw">${src} · ${pct(wt)} now</div>
    </div>`;
  }).join("");
  $("qm").innerHTML=cells;
  $("qm").querySelectorAll("[data-des]").forEach(el=>el.onclick=()=>openDes(el.dataset.des));
}
function openDes(sym){
  const k=(sym||"SPY").toUpperCase();
  if(k!=="CASH" && !A[k]) { toast("Unknown name"); return; }
  const w=weightsNow();
  const idea=IDEAS.find(i=>i.sym===k);
  const held=book.filter(p=>p.sym===k);
  const wt=k==="CASH"?w.CASH:w[k]||0;
  const src=k==="BTC"||k==="ETH"?"Coinbase last":"Robinhood last";
  $("des-h").textContent="DES "+k;
  $("des-body").innerHTML=`
    <div class="des-grid">
      <div class="lv"><div class="label">${src}</div><div class="num">${k==="CASH"?usd(cashBal()):px(k)}</div></div>
      <div class="lv"><div class="label">Weight</div><div class="num">${pct(wt)}</div></div>
      <div class="lv"><div class="label">Value</div><div class="num">${usd(k==="CASH"?cashBal():mv(k))}</div></div>
      <div class="lv"><div class="label">Stop</div><div class="num">${idea?fmtPx(idea.stop):"—"}</div></div>
    </div>
    ${idea?`<p class="thesis">${idea.thesis}</p>`:`<p class="thesis">Cash is dry powder.</p>`}
    <article class="agent"><div class="who">Houston</div><div>${AGENTS.HOUSTON.memo}</div></article>
    <article class="agent"><div class="who">Steffi</div><div>${AGENTS.STEFFI.memo}</div></article>
    <article class="agent"><div class="who">Desmond</div><div>${AGENTS.DESMOND.memo}</div></article>
    <article class="agent"><div class="who">Doocey · kill check</div><div>${AGENTS.DOOCEY.memo}</div></article>
    <p class="fine">Owned = rh.json. News = /news. No paper buy.</p>`;
  $("drawer").hidden=false;
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
  if(verb==="HELP"||verb==="?"||verb==="H"){ showCmd("DES PLAN BOOK LOOK NEWS HELP\nHOUSTON STEFFI DESMOND DOOCEY"); return; }
  if(verb==="NEWS"){ location.href="/news"; return; }
  if(verb==="LOOK"||verb==="SRC"){ if(verb==="LOOK") location.href="/look"; return; }
  if(verb==="PLAN"){ document.getElementById("plan-h").scrollIntoView({behavior:"smooth"}); return; }
  if(verb==="BOOK"){ document.getElementById("live-h").scrollIntoView({behavior:"smooth"}); return; }
  if(verb==="DES"){ openDes(a||"SPY"); return; }
  if(["HOUSTON","STEFFI","DESMOND","DOOCEY"].includes(verb)){ showCmd(verb+" · "+AGENTS[verb].role+"\n"+AGENTS[verb].memo); return; }
  if(verb==="FILL"||verb==="BUY"){ showCmd("No live order from this page.",true); return; }
  if(verb==="FLAT"||verb==="FLATTEN"){
    if(!runCmd._flat){ runCmd._flat=true; setTimeout(()=>runCmd._flat=false,4000); showCmd("Type FLAT again to clear overlay."); return; }
    flatten(); render(); return;
  }
  if(A[verb]||verb==="CASH"){ openDes(verb); return; }
  showCmd("Unknown. Type HELP",true);
}
$("cmdline").addEventListener("submit",e=>{ e.preventDefault(); runCmd($("cmd").value); $("cmd").select(); });
$("cmd-open").onclick=()=>{ $("cmd").focus(); $("cmd").select(); };
document.addEventListener("keydown",e=>{
  if(e.key==="`" && e.target.tagName!=="INPUT"){ e.preventDefault(); $("cmd").focus(); $("cmd").select(); }
  if(e.key==="Escape"){ closeDes(); $("cmd").blur(); }
});
async function liveMarks(){
  try{
    const r=await fetch("rh.json?t="+Date.now());
    if(!r.ok) return;
    const j=await r.json();
    if(j.marks) ["SPY","QQQ","BTC","ETH"].forEach(k=>{ if(j.marks[k]) A[k].px=j.marks[k]; });
    $("mark-src").textContent="RH + Coinbase · "+(j.asof||"");
    render(true);
  }catch(e){}
}
function render(keepMarks){ save(); drawKpis(); drawQm(); drawWheel(); drawPlan(); drawIdeas(); drawBook(); if(!keepMarks) drawMarks(); }
$("v-now").onclick=()=>{view="now";drawWheel();};
$("v-tgt").onclick=()=>{view="tgt";drawWheel();};
$("hz").oninput=()=>drawWheel();
$("ifilter").querySelectorAll("button").forEach(b=>b.onclick=()=>{filter=b.dataset.f;drawIdeas();});
let armed=false;
$("flatten").onclick=e=>{ if(!book.length){toast("Book is already flat");return;} if(!armed){armed=true;e.target.textContent="Press again to flatten";setTimeout(()=>{armed=false;e.target.textContent="Flatten overlay"},3000);return;} armed=false;e.target.textContent="Flatten overlay";flatten();render(); };
clock(); setInterval(clock,30000);
drawTape();
render();
liveMarks();
