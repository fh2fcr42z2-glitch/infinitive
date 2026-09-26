/* ---------- agents + tape ---------- */
const AGENTS = {
  HOUSTON:{role:"CIO / market brief",memo:"Sat 26 Sep. RH marks: SPY 772.04 / QQQ 745.40. Coinbase BTC 83,924 / ETH 2,686. RH book has no SPY or QQQ. BTC on RH is dust ($16). Do not paper-fill. Do not live-buy — buying power $0.15."},
  STEFFI:{role:"Structure / tickets",memo:"Fills come from Robinhood quantities, not the paper button. SPY/QQQ flat on RH. BTC 0.00018572. ETH flat. Size to funded cash, not the $100k research overlay."},
  DESMOND:{role:"Risk",memo:"Name cap 15% of the research overlay. Live RH buying power $0.15. Pending deposit $206 is not spendable yet. SNAP/VST/XTKG stay off the Infinitive book."},
  DOOCEY:{role:"Red team",memo:"Kill paper FILL. Kill live SPY/QQQ until the account is funded and the gate prints. Kill ETH until $2,900. Kill Look names. Kill SNAP/VST as desk names."}
};
const TAPE = [
  {tag:"MKT",t:"US cash closed Fri · RH marks · Coinbase crypto view"},
  {tag:"SPY",t:"RH 772.04 · qty 0 · DO NOT live-buy"},
  {tag:"QQQ",t:"RH 745.40 · qty 0 · wait 724"},
  {tag:"BTC",t:"RH 0.00018572 · Coinbase 83,924 · put wall 84k"},
  {tag:"ETH",t:"RH qty 0 · Coinbase 2,686 · gate 2,900"},
  {tag:"RH",t:"account ~$203 · BP $0.15 · no paper fill"}
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
    <p class="fine">No paper buy. Book follows Robinhood quantities in rh.json.</p>`;
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
  const help=`Commands\n  DES [SPY|QQQ|BTC|ETH|CASH]   name card\n  PLAN / BOOK / RISK / QM / TAPE / WHEEL\n  IDEA [SYM]                   idea card\n  FILL                         disabled — RH snapshot only\n  MARK SYM PRICE               update a mark\n  LOOK                         glance rack — not a ticket\n  FLAT                         flatten overlay (confirm twice)\n  HOUSTON / STEFFI / DESMOND / DOOCEY\n  HELP                         this list\nNo live orders from this page. LOOK names are DO NOT BUY.`;
  if(verb==="HELP"||verb==="?"||verb==="H"){ showCmd(help); return; }
  if(verb==="LOOK"||verb==="SRC"){
    fetch("look.json?t="+Date.now()).then(r=>r.json()).then(j=>{
      showCmd((j.stamp||"DO NOT BUY")+"\n"+(j.orders||[]).join("\n"));
    }).catch(()=>showCmd("look.json missing",true));
    if(verb==="LOOK") location.href="/look";
    return;
  }
  if(verb==="PLAN"){ document.getElementById("plan-h").scrollIntoView({behavior:"smooth"}); showCmd(buildPlan().mood+" — "+buildPlan().steps.map(s=>s.t).join(" · ")); return; }
  if(verb==="BOOK"){ document.getElementById("book-h").scrollIntoView({behavior:"smooth"}); showCmd(book.length?book.map(p=>p.id+" "+p.sym+" "+p.qty).join(" · "):"Book is flat."); return; }
  if(verb==="RISK"){ document.getElementById("rules-h").scrollIntoView({behavior:"smooth"}); const w=weightsNow(); showCmd("Name max "+pct(Math.max(...KEYS.map(k=>w[k])))+" / 15% · crypto "+pct(w.BTC+w.ETH)+" / 40%"); return; }
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
    A[a].px=v; render(); showCmd("Marked "+a+" "+fmtPx(v)); return; }
  if(verb==="FILL"||verb==="BUY"){
    showCmd("FILL disabled. Book follows rh.json (Robinhood quantities). No live order from this page.",true);
    return;
  }
  if(verb==="FLAT"||verb==="FLATTEN"){
    if(!book.length){ showCmd("Already flat."); return; }
    if(!runCmd._flat){ runCmd._flat=true; setTimeout(()=>runCmd._flat=false,4000); showCmd("Type FLAT again in 4s to confirm overlay flatten."); return; }
    runCmd._flat=false; flatten(); render(); showCmd("Overlay flattened."); return; }
  if(A[verb]||verb==="CASH"){ openDes(verb); showCmd("Opened DES "+verb); return; }
  showCmd("Unknown: "+line+"  —  type HELP",true);
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
    if(r.ok){
      const j=await r.json();
      if(j.marks){
        if(j.marks.SPY) A.SPY.px=j.marks.SPY;
        if(j.marks.QQQ) A.QQQ.px=j.marks.QQQ;
        if(j.marks.BTC) A.BTC.px=j.marks.BTC;
        if(j.marks.ETH) A.ETH.px=j.marks.ETH;
      }
      if(!window.__rhSeeded && Array.isArray(j.holdings)){
        window.__rhSeeded=true;
        flatten();
        j.holdings.forEach(h=>{
          if(!KEYS.includes(h.sym)) return;
          const usdAmt=+(h.usd||0);
          if(usdAmt>1){
            const idea=IDEAS.find(i=>i.sym===h.sym);
            openPos(h.sym,usdAmt,idea&&idea.stop,idea&&idea.target);
          }
        });
      }
      $("mark-src").textContent="Marks: Robinhood snapshot "+(j.asof||"");
      render(true);
      return;
    }
  }catch(e){}
  try{
    const r=await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
    if(!r.ok) return;
    const j=await r.json();
    if(j.bitcoin&&j.bitcoin.usd) A.BTC.px=j.bitcoin.usd;
    if(j.ethereum&&j.ethereum.usd) A.ETH.px=j.ethereum.usd;
    $("mark-src").textContent="Marks: CoinGecko fallback";
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
clock(); setInterval(clock,30000);
drawTape();
render();
liveMarks();
