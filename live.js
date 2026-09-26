function money(n){
  if(n==null||n==="") return "—";
  const x=+n; if(!isFinite(x)) return "—";
  return (x<0?"-":"")+"$"+Math.abs(x).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function qtyf(n){
  if(n==null) return "—";
  const x=+n; if(!isFinite(x)) return "—";
  if(Math.abs(x)>=1) return x.toLocaleString("en-US",{maximumFractionDigits:4});
  return String(x);
}
async function drawLive(){
  const box=document.getElementById("live-book");
  const nav=document.getElementById("live-nav");
  const asof=document.getElementById("live-asof");
  if(!box) return;
  try{
    const j=await (await fetch("rh.json?t="+Date.now())).json();
    if(asof) asof.textContent=j.asof||"";
    if(nav) nav.textContent=money(j.live_nav);
    const rows=(j.holdings||[]).map(h=>{
      const act=(h.action||"").toUpperCase();
      const cls=act.indexOf("DO NOT")>=0?"nobuy":"";
      return `<tr>
        <td class="inst">${h.sym}</td>
        <td>${h.kind||""}</td>
        <td>${h.account||""}</td>
        <td>${qtyf(h.qty)}</td>
        <td>${h.avg!=null?money(h.avg):"—"}</td>
        <td>${h.mark!=null?money(h.mark):"—"}</td>
        <td>${h.usd!=null?money(h.usd):"—"}</td>
        <td class="${cls}">${h.action||""}</td>
      </tr>`;
    }).join("");
    box.innerHTML=`<table>
      <thead><tr><th>Name</th><th>Kind</th><th>Account</th><th>Qty</th><th>Avg</th><th>Mark</th><th>Value</th><th>Call</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }catch(e){
    box.innerHTML=`<div class="empty">rh.json missing</div>`;
  }
}
drawLive();
