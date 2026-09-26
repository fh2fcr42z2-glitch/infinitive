/* ---------- agents + tape ---------- */
const AGENTS = {
  HOUSTON:{role:"CIO / market brief",memo:"Sat 26 Sep. RH: SPY 772.04 QQQ 745.40 SNAP 5.4385. Coinbase: BTC 83,958 ETH 2,687.58. Live NAV ~$814. HOLD SNAP. DO NOT ADD VST. BP $0.15."},
  STEFFI:{role:"Structure / tickets",memo:"Marks: Robinhood stocks, Coinbase BTC/ETH. Fills = RH qty. Overlay is labeled separately."},
  DESMOND:{role:"Risk",memo:"Live book is 73% SNAP. BP $0.15. Pending $206 not spendable."},
  DOOCEY:{role:"Red team",memo:"Kill paper FILL. Kill live SPY/QQQ/ETH. Kill VST add. Kill Look names."}
};
const TAPE = [
  {tag:"MKT",t:"US cash closed · RH equity last = Fri ext · Coinbase crypto live"},
  {tag:"SPY",t:"RH 772.04 · qty 0"},
  {tag:"QQQ",t:"RH 745.40 · qty 0 · wait 724"},
  {tag:"SNAP",t:"RH 5.4385 · 109.03 sh joint · HOLD"},
  {tag:"BTC",t:"Coinbase 83,958 · RH qty 0.00018572"},
  {tag:"ETH",t:"Coinbase 2,687.58 · RH qty 0 · gate 2,900"}
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
  const n=nav(), w=weightsNow();
  const idea=IDEAS.find(i=>i.sym===k);
  const held=book.filter(p=>p.sym===k);
  const wt=k==="CASH"?w.CASH:w[k]||0;
  const pairs=k==="CASH"?"":KEYS.filter(x=>x!==k).map(x=>`${k}|${x} ${rho(k,x).toFixed(2)}`).join(" · ");
  const src=k==="BTC"||k==="ETH"?"Coinbase last":"Robinhood last";
  $("des-h").textContent="DES "+k;
  $("des-body").innerHTML=`
    <div class="des-grid">
      <div class="lv"><div class="label">${src}</div><div class="num">${k==="CASH"?usd(cashBal()):px(k)}</div></div>
      <div class="lv"><div class="label">Weight</div><div class="num">${pct(wt)}</div></div>
      <div class="lv"><div class="label">Value</div><div class="num">${usd(k==="CASH"?cashBal():mv(k))}</div></div>
      <div class="lv"><div class="label">Stop</div><div class="num">${idea?fmtPx(idea.stop):"—"}</div></div>
      <div class="lv"><div class="label">Target</div><div class="num">${idea?fmtPx(idea.target):"—"}</div></div>
      <div class="lv"><div class="label">In book</div><div class="num">${held.length?held.map(p=>p.id+" "+p.qty).join(", "):"flat"}</div></div>
    </div>
    ${idea?`<p class="thesis">${idea.thesis}</p>`:`<p class="thesis">Cash is dry powder.</p>`}
    <div class="rho">${pairs||"No pair beta on cash."}</div>
    <article class="agent"><div class="who">Houston</div><div>${AGENTS.HOUSTON.memo}</div></article>
    <article class="agent"><div class="who">Doocey · kill check</div><div>${AGENTS.DOOCEY.memo}</div></article>
    <p class="fine">Owned quantities live in rh.json. No paper buy.</p>`;
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
  const b=parts[2];
  const help=`Commands\n  DES / PLAN / BOOK / LOOK / HELP\nMarks are RH + Coinbase only.`;
  if(verb==="HELP"||verb==="?"||verb==="H"){ showCmd(help); return; }
  if(verb==="LOOK"||verb==="SRC"){ if(verb==="LOOK") location.href="/look"; return; }
  if(verb==="PLAN"){ document.getElementById("plan-h").scrollIntoView({behavior:"smooth"}); return; }
  if(verb==="BOOK"){ document.getElementById("live-h").scrollIntoView({behavior:"smooth"}); return; }
  if(verb==="DES"){ openDes(a||"SPY"); return; }
  if(["HOUSTON","STEFFI","DESMOND","DOOCEY"].includes(verb)){ showCmd(verb+" · "+AGENTS[verb].memo); return; }
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
    if(j.marks){
      ["SPY","QQQ","BTC","ETH"].forEach(k=>{ if(j.marks[k]) A[k].px=j.marks[k]; });
    }
    $("mark-src").textContent="RH equities + Coinbase crypto · "+(j.asof||"");
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
