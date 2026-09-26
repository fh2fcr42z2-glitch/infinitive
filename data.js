function bn(n){
  n=+n; if(!isFinite(n)) return "—";
  if(Math.abs(n)>=1e12) return "$"+(n/1e12).toFixed(2)+"T";
  if(Math.abs(n)>=1e9) return "$"+(n/1e9).toFixed(1)+"B";
  if(Math.abs(n)>=1e6) return "$"+(n/1e6).toFixed(1)+"M";
  return "$"+Math.round(n).toLocaleString("en-US");
}
async function drawPublicTape(){
  const box=document.getElementById("pub-tape");
  const reads=document.getElementById("pub-reads");
  const src=document.getElementById("pub-src");
  if(!box) return;
  try{
    const j=await (await fetch("public-tape.json?t="+Date.now())).json();
    const s=j.spot||{};
    const ch=j.change_24h||{};
    const fg=j.fear_greed||{};
    const tvl=j.tvl_usd||{};
    const etf=j.etf||{};
    box.innerHTML=`
      <div class="idea"><div class="tick">BTC</div><div class="thesis">${bn(s.BTC&&s.BTC.px)} · 24h ${ch.BTC!=null?(ch.BTC>=0?"+":"")+ch.BTC.toFixed(2)+"%":"—"}<br>Coinbase range ${bn(s.BTC&&s.BTC.low)}–${bn(s.BTC&&s.BTC.high)}</div></div>
      <div class="idea"><div class="tick">ETH</div><div class="thesis">${bn(s.ETH&&s.ETH.px)} · 24h ${ch.ETH!=null?(ch.ETH>=0?"+":"")+ch.ETH.toFixed(2)+"%":"—"}<br>gate $2,900 still off</div></div>
      <div class="idea"><div class="tick">Fear & Greed</div><div class="thesis">${fg.value||"—"} ${fg.label||""}<br>Greed ≠ size-up</div></div>
      <div class="idea"><div class="tick">BTC ETFs</div><div class="thesis">Sep 25 net ${etf.btc_net_2026_09_25_usdm!=null?"+"+etf.btc_net_2026_09_25_usdm+"m":"—"}<br>IBIT ${etf.ibt_ibit} · FBTC ${etf.ibt_fbtc} · Farside</div></div>
      <div class="idea"><div class="tick">ETH TVL</div><div class="thesis">${bn(tvl.Ethereum)}<br>Sol ${bn(tvl.Solana)} · Base ${bn(tvl.Base)}</div></div>
      <div class="idea"><div class="tick">ETH ETFs</div><div class="thesis">latest print ${etf.eth_net_latest_usdm!=null?"+"+etf.eth_net_latest_usdm+"m":"—"}<br>does not clear the $2,900 gate</div></div>`;
    if(reads) reads.innerHTML=(j.reads||[]).map(r=>`<div class="step"><span class="k wait">D</span><div><div class="t">${r}</div></div></div>`).join("");
    if(src) src.textContent=(j.stamp||"")+" · "+(j.asof||"");
  }catch(e){
    box.innerHTML=`<div class="empty">public-tape.json missing</div>`;
  }
}
drawPublicTape();
