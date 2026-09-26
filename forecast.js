function fMoney(n){
  if(n==null||!isFinite(+n)) return "—";
  const x=+n;
  return (x<0?"-":"")+"$"+Math.abs(x).toLocaleString("en-US",{maximumFractionDigits:0});
}
function logBand(n,mu,sd,t){
  const m=Math.log(1+mu)-sd*sd/2;
  const z=1.2816*sd*Math.sqrt(t);
  return {p10:n*Math.exp(m*t-z), p50:n*Math.exp(m*t), p90:n*Math.exp(m*t+z)};
}
async function drawForecast(){
  const box=document.getElementById("fc-rows");
  const scen=document.getElementById("fc-scen");
  const note=document.getElementById("fc-note");
  if(!box) return;
  let j={};
  try{ j=await (await fetch("rh.json?t="+Date.now())).json(); }catch(e){}
  const nav=+(j.live_nav||814);
  const snap=(j.holdings||[]).find(h=>h.sym==="SNAP"&&h.kind==="equity");
  const snapUsd=snap?+snap.usd:593;
  const wSnap=snapUsd/nav;
  const pending=+((j.accounts&&j.accounts.individual&&j.accounts.individual.pending_deposits)||206);
  const mu=0.02;
  const sd=Math.min(0.55, 0.22 + 0.40*wSnap);
  const horizons=[
    {lab:"30 days", t:30/365},
    {lab:"90 days", t:90/365},
    {lab:"1 year", t:1}
  ];
  box.innerHTML=horizons.map(h=>{
    const b=logBand(nav,mu,sd,h.t);
    return `<div class="sc"><span class="label">${h.lab}</span>
      <span class="v">${fMoney(b.p50)}</span>
      <span class="g">rough ${fMoney(b.p10)} · strong ${fMoney(b.p90)}</span></div>`;
  }).join("");
  const paths=[
    {t:"SNAP −20% in 30d", v:nav-snapUsd*0.20, why:"Joint book is 73% SNAP. A one-month 20% slide is ordinary for this name."},
    {t:"Deposit clears, cash idle", v:nav+pending, why:"$206 pending is not in NAV yet. Idle cash does not fix SNAP concentration."},
    {t:"Deposit → SGOV, SNAP flat", v:nav+pending, why:"Park the $206 in T-bills ~4%. Year-1 extra ~$8. Not a SNAP hedge."},
    {t:"VST 170c expires 0", v:nav-40, why:"Oct 9 call is $31 OTM. Base case is the premium leftover goes to zero."},
    {t:"SNAP +25% in 90d", v:nav+snapUsd*0.25, why:"Reclaims $6.80. LEAP $6 calls start to matter. Still one-name risk."},
    {t:"1y base, SNAP vol", v:logBand(nav,mu,sd,1).p50, why:"Expected ~"+((mu*100).toFixed(0))+"% with ~"+((sd*100).toFixed(0))+"% vol because SNAP dominates."}
  ];
  if(scen) scen.innerHTML=paths.map(p=>`<div class="step"><span class="k wait">F</span><div><div class="t">${p.t} · ${fMoney(p.v)}</div><div class="why">${p.why}</div></div></div>`).join("");
  if(note) note.textContent="Live NAV "+fMoney(nav)+". SNAP weight "+(wSnap*100).toFixed(0)+"%. Bands are a lognormal sketch (8 in 10), not a promise. Overlay $100k fan below is a separate research toy.";
}
drawForecast();
