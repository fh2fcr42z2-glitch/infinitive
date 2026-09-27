var LIVE_BOOK = null;
function money(n){
  if(n==null||n==="") return "—";
  var x=+n; if(!isFinite(x)) return "—";
  return (x<0?"-":"")+"$"+Math.abs(x).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function qtyf(n){
  if(n==null) return "—";
  var x=+n; if(!isFinite(x)) return "—";
  if(Math.abs(x)>=1) return x.toLocaleString("en-US",{maximumFractionDigits:4});
  return String(x);
}
function livePx(sym){
  var px = window.LIVE_PX || {};
  var k = String(sym||"").split(" ")[0].toUpperCase();
  return px[k] != null ? +px[k] : null;
}
function paintLive(j){
  var box=document.getElementById("live-book");
  var nav=document.getElementById("live-nav");
  var asof=document.getElementById("live-asof");
  if(!box||!j) return;
  var sum=0, anyLive=false;
  var rows=(j.holdings||[]).map(function(h){
    var mark = h.mark;
    var usd = h.usd;
    var lp = livePx(h.sym);
    if(h.kind==="crypto" && lp!=null && h.qty!=null){
      mark = lp;
      usd = lp * Number(h.qty);
      anyLive = true;
    }
    if(usd!=null && isFinite(+usd)) sum += +usd;
    var act=(h.action||"").toUpperCase();
    var cls=act.indexOf("DO NOT")>=0?"nobuy":"";
    return "<tr><td class=\"inst\">"+h.sym+"</td><td>"+(h.kind||"")+"</td><td>"+(h.account||"")+"</td><td>"+qtyf(h.qty)+"</td><td>"+(h.avg!=null?money(h.avg):"—")+"</td><td>"+(mark!=null?money(mark):"—")+"</td><td>"+(usd!=null?money(usd):"—")+"</td><td class=\""+cls+"\">"+(h.action||"")+"</td></tr>";
  }).join("");
  if(nav) nav.textContent=money(sum || j.live_nav);
  if(asof) asof.textContent=(anyLive?"marked live · ":"")+(j.asof||"");
  box.innerHTML="<table><thead><tr><th>Name</th><th>Kind</th><th>Account</th><th>Qty</th><th>Avg</th><th>Mark</th><th>Value</th><th>Call</th></tr></thead><tbody>"+rows+"</tbody></table>";
}
async function drawLive(){
  var box=document.getElementById("live-book");
  if(!box) return;
  try{
    var j=await (await fetch("rh.json?t="+Date.now())).json();
    LIVE_BOOK=j;
    paintLive(j);
  }catch(e){
    if(LIVE_BOOK) paintLive(LIVE_BOOK);
    else box.innerHTML="<div class=\"empty\">rh.json missing</div>";
  }
}
function refreshLiveMarks(){ if(LIVE_BOOK) paintLive(LIVE_BOOK); }
drawLive();
