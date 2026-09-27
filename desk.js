const AGENTS = {
  HOUSTON:{role:"CIO / market brief",memo:"Sun 27 Sep. Live crypto marks pulse from Coinbase public spot. Qty still the last RH+CB snapshot. HOLD book. DO NOT ADD."},
  STEFFI:{role:"Structure / tickets",memo:"Qty from snapshot. Marks on BTC ETH DRV AERO ENA PUMP XPL SOL pulse every 15s. No fill from chat."},
  DESMOND:{role:"Risk",memo:"SNAP + DRV still most of NAV. CB cash is powder. RH BP $0.15. No 5x."},
  DOOCEY:{role:"Red team",memo:"Kill adds. Kill headline trades. Kill any bot that orders from RSS."}
};
const TAPE = [
  {tag:"MKT",t:"Sunday · US cash shut · Coinbase marks live"},
  {tag:"SNAP",t:"RH last 5.4385 · 109 sh · HOLD"},
  {tag:"DRV",t:"Coinbase pulse · HOLD no add"},
  {tag:"BTC",t:"Coinbase pulse · dust + 0.00045"},
  {tag:"ETH",t:"Coinbase pulse · gate 2,900"},
  {tag:"NEWS",t:"/news hourly · headlines ≠ tickets"}
];
function el(id){ return document.getElementById(id); }
function drawTape(){
  var t=el("tape"); if(!t) return;
  t.innerHTML=TAPE.map(x=>"<span><span class=\"tag\">"+x.tag+"</span> <b>"+x.t+"</b></span>").join("");
}
function drawQm(){
  var box=el("qm"); if(!box) return;
  var w=weightsNow();
  var cells=[...KEYS,"CASH"].map(k=>{
    var wt=k==="CASH"?w.CASH:w[k];
    var last=k==="CASH"?usd(cashBal()):px(k);
    var src=k==="BTC"||k==="ETH"?"Coinbase":k==="CASH"?"RH cash":"RH";
    return "<div class=\"qcell\" data-des=\""+k+"\"><div class=\"qn\"><span class=\"sw\" style=\"background:var("+A[k].col+")\"></span>"+(k==="CASH"?"CASH":k)+"</div><div class=\"qp\">"+last+"</div><div class=\"qw\">"+src+" · "+pct(wt)+" now</div></div>";
  }).join("");
  box.innerHTML=cells;
  box.querySelectorAll("[data-des]").forEach(function(node){ node.onclick=function(){ openDes(node.dataset.des); }; });
}
function openDes(sym){
  var k=(sym||"SPY").toUpperCase();
  if(k!=="CASH" && !A[k]) { toast("Unknown name"); return; }
  var w=weightsNow();
  var idea=IDEAS.find(function(i){ return i.sym===k; });
  var held=book.filter(function(p){ return p.sym===k; });
  var wt=k==="CASH"?w.CASH:w[k]||0;
  var src=k==="BTC"||k==="ETH"?"Coinbase live":"Robinhood last";
  el("des-h").textContent="DES "+k;
  el("des-body").innerHTML="<div class=\"des-grid\"><div class=\"lv\"><div class=\"label\">"+src+"</div><div class=\"num\">"+(k==="CASH"?usd(cashBal()):px(k))+"</div></div><div class=\"lv\"><div class=\"label\">Weight</div><div class=\"num\">"+pct(wt)+"</div></div></div>"+(idea?"<p class=\"thesis\">"+idea.thesis+"</p>":"<p class=\"thesis\">Cash is dry powder.</p>")+"<article class=\"agent\"><div class=\"who\">Houston</div><div>"+AGENTS.HOUSTON.memo+"</div></article><article class=\"agent\"><div class=\"who\">Doocey</div><div>"+AGENTS.DOOCEY.memo+"</div></article>";
  el("drawer").hidden=false;
}
function closeDes(){ var d=el("drawer"); if(d) d.hidden=true; }
var dx=el("des-x"); if(dx) dx.onclick=closeDes;
var dr=el("drawer"); if(dr) dr.addEventListener("click",function(e){ if(e.target.id==="drawer") closeDes(); });
function showCmd(msg,err){
  var node=el("cmd-out"); if(!node) return;
  node.hidden=!msg; node.textContent=msg||""; node.className="cmd-out"+(err?" err":"");
}
function runCmd(raw){
  var line=(raw||"").trim(); if(!line) return;
  var parts=line.split(/\s+/);
  var verb=parts[0].toUpperCase();
  var a=(parts[1]||"").toUpperCase();
  if(verb==="HELP"||verb==="?"||verb==="H"){ showCmd("DES PLAN BOOK LOOK NEWS HELP"); return; }
  if(verb==="NEWS"){ location.href="/news"; return; }
  if(verb==="LOOK"){ location.href="/look"; return; }
  if(verb==="PLAN" && el("plan-h")){ el("plan-h").scrollIntoView({behavior:"smooth"}); return; }
  if(verb==="BOOK" && el("live-h")){ el("live-h").scrollIntoView({behavior:"smooth"}); return; }
  if(verb==="DES"){ openDes(a||"SPY"); return; }
  if(["HOUSTON","STEFFI","DESMOND","DOOCEY"].indexOf(verb)>=0){ showCmd(verb+" · "+AGENTS[verb].memo); return; }
  if(verb==="FILL"||verb==="BUY"){ showCmd("No live order from this page.",true); return; }
  if(A[verb]||verb==="CASH"){ openDes(verb); return; }
  showCmd("Unknown. Type HELP",true);
}
var form=el("cmdline");
if(form) form.addEventListener("submit",function(e){ e.preventDefault(); runCmd(el("cmd").value); el("cmd").select(); });
var co=el("cmd-open"); if(co) co.onclick=function(){ el("cmd").focus(); };
document.addEventListener("keydown",function(e){
  if(e.key==="`" && e.target.tagName!=="INPUT"){ e.preventDefault(); if(el("cmd")) el("cmd").focus(); }
  if(e.key==="Escape") closeDes();
});
async function liveMarks(){
  try{
    var r=await fetch("rh.json?t="+Date.now());
    if(!r.ok) return;
    var j=await r.json();
    if(j.marks){
      ["SPY","QQQ"].forEach(function(k){ if(j.marks[k] && A[k]) A[k].px=j.marks[k]; });
      if(!(window.LIVE_PX && window.LIVE_PX.BTC) && j.marks.BTC) A.BTC.px=j.marks.BTC;
      if(!(window.LIVE_PX && window.LIVE_PX.ETH) && j.marks.ETH) A.ETH.px=j.marks.ETH;
    }
    render(true);
  }catch(e){}
}
function render(keepMarks){ save(); drawKpis(); drawQm(); drawWheel(); drawPlan(); drawIdeas(); drawBook(); if(!keepMarks) drawMarks(); }
var vn=el("v-now"); if(vn) vn.onclick=function(){view="now";drawWheel();};
var vt=el("v-tgt"); if(vt) vt.onclick=function(){view="tgt";drawWheel();};
var hz=el("hz"); if(hz) hz.oninput=function(){drawWheel();};
var iff=el("ifilter"); if(iff) iff.querySelectorAll("button").forEach(function(b){ b.onclick=function(){filter=b.dataset.f;drawIdeas();}; });
var fl=el("flatten");
if(fl) fl.onclick=function(e){
  if(!book.length){toast("Book is already flat");return;}
  if(!fl._armed){fl._armed=true;e.target.textContent="Press again to flatten";setTimeout(function(){fl._armed=false;e.target.textContent="Flatten overlay";},3000);return;}
  flatten(); render();
};
clock(); setInterval(clock,30000);
drawTape();
render();
liveMarks();
