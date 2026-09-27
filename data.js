function bn(n){
  n=+n; if(!isFinite(n)) return "\u2014";
  if(Math.abs(n)>=1e12) return "$"+(n/1e12).toFixed(2)+"T";
  if(Math.abs(n)>=1e9) return "$"+(n/1e9).toFixed(1)+"B";
  if(Math.abs(n)>=1e6) return "$"+(n/1e6).toFixed(1)+"M";
  return "$"+Math.round(n).toLocaleString("en-US");
}
function mEth(n){
  if(n==null||!isFinite(+n)) return "\u2014";
  return (+n).toFixed(2)+"m ETH";
}
async function drawPublicTape(){
  var box=document.getElementById("pub-tape");
  var reads=document.getElementById("pub-reads");
  var src=document.getElementById("pub-src");
  if(!box) return;
  try{
    var pack=await Promise.all([
      fetch("public-tape.json?t="+Date.now()).then(function(r){return r.ok?r.json():{};}),
      fetch("/api/eth?t="+Date.now()).then(function(r){return r.ok?r.json():null;})
    ]);
    var j=pack[0]||{};
    var eth=pack[1];
    var s=j.spot||{};
    var ch=j.change_24h||{};
    var fg=j.fear_greed||{};
    var tvl=j.tvl_usd||{};
    var etf=j.etf||{};
    var ethCard=eth
      ? ("supply "+mEth(eth.supply_m)+" \u00b7 burned "+mEth(eth.burned_m)+"<br>staked "+mEth(eth.staked_m)+(eth.staked_pct!=null?" ("+(eth.staked_pct*100).toFixed(1)+"%)":"")+"<br>HOLD \u00b7 DO NOT BUY under $2,900")
      : (bn(s.ETH&&s.ETH.px)+" \u00b7 gate $2,900 still off");
    box.innerHTML=""
      +"<div class=\"idea\"><div class=\"tick\">ETH ultrasound</div><div class=\"thesis\">"+ethCard+"</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">BTC</div><div class=\"thesis\">"+bn(s.BTC&&s.BTC.px)+" \u00b7 24h "+(ch.BTC!=null?(ch.BTC>=0?"+":"")+ch.BTC.toFixed(2)+"%":"\u2014")+"</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">Fear & Greed</div><div class=\"thesis\">"+(fg.value||"\u2014")+" "+(fg.label||"")+"<br>Greed \u2260 size-up</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">BTC ETFs</div><div class=\"thesis\">Sep 25 net "+(etf.btc_net_2026_09_25_usdm!=null?"+"+etf.btc_net_2026_09_25_usdm+"m":"\u2014")+"<br>Farside</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">ETH TVL</div><div class=\"thesis\">"+bn(tvl.Ethereum)+"<br>Sol "+bn(tvl.Solana)+" \u00b7 Base "+bn(tvl.Base)+"</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">ETH ETFs</div><div class=\"thesis\">latest "+(etf.eth_net_latest_usdm!=null?"+"+etf.eth_net_latest_usdm+"m":"\u2014")+"<br>does not clear $2,900</div></div>";
    if(reads) reads.innerHTML=(j.reads||[]).map(function(r){return "<div class=\"step\"><span class=\"k wait\">D</span><div><div class=\"t\">"+r+"</div></div></div>";}).join("");
    if(src) src.textContent=(eth&&eth.source?eth.source+" \u00b7 ":"")+(j.stamp||"")+" \u00b7 "+(j.asof||"");
  }catch(e){
    box.innerHTML="<div class=\"empty\">public tape failed</div>";
  }
}
drawPublicTape();
