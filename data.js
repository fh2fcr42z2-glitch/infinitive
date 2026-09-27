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
function kInt(n){
  if(n==null||!isFinite(+n)) return "\u2014";
  if(n>=1e6) return (n/1e6).toFixed(2)+"m";
  if(n>=1e3) return Math.round(n/1e3)+"k";
  return String(Math.round(n));
}
function usdPx(n){
  n=+n; if(!isFinite(n)) return "\u2014";
  return "$"+Math.round(n).toLocaleString("en-US");
}
async function drawPublicTape(){
  var box=document.getElementById("pub-tape");
  var reads=document.getElementById("pub-reads");
  var src=document.getElementById("pub-src");
  if(!box) return;
  try{
    var pack=await Promise.all([
      fetch("public-tape.json?t="+Date.now()).then(function(r){return r.ok?r.json():{};}),
      fetch("/api/eth?t="+Date.now()).then(function(r){return r.ok?r.json():null;}),
      fetch("/api/research?t="+Date.now()).then(function(r){return r.ok?r.json():null;}),
      fetch("/api/marks?t="+Date.now()).then(function(r){return r.ok?r.json():null;}),
      fetch("/api/chain?t="+Date.now()).then(function(r){return r.ok?r.json():null;})
    ]);
    var j=pack[0]||{};
    var eth=pack[1];
    var rs=pack[2]||{};
    var mk=pack[3]||{};
    var ch=pack[4]||{};
    var g=rs.gtp||{};
    var l2=rs.l2||{};
    var fg=j.fear_greed||{};
    var etf=j.etf||{};
    var px=(mk.ETH!=null?+mk.ETH:(j.spot&&j.spot.ETH&&j.spot.ETH.px));
    var gate=2900, wash=1600, lookHigh=5400;
    var toGate=isFinite(px)?(gate/px-1)*100:null;
    var vsWash=isFinite(px)?(px/wash-1)*100:null;
    var mapCard="now "+usdPx(px)+" Coinbase<br>down wash ~"+usdPx(wash)+(vsWash!=null?" (\u00b7 +"+vsWash.toFixed(0)+"% off that low)":"")+"<br>up gate "+usdPx(gate)+(toGate!=null?" (\u00b7 "+toGate.toFixed(1)+"% still to go)":"")+"<br>LOOK only "+usdPx(lookHigh)+" \u00b7 weekly RSI ~64 not 30";
    var ethCard=eth
      ? ("supply "+mEth(eth.supply_m)+" \u00b7 burned "+mEth(eth.burned_m)+"<br>staked "+mEth(eth.staked_m)+(eth.staked_pct!=null?" ("+(eth.staked_pct*100).toFixed(1)+"%)":"")+"<br>HOLD \u00b7 DO NOT BUY under $2,900")
      : "gate $2,900 still off";
    var chainCard=ch.error?ch.error:("block "+(ch.block||"\u2014")+" \u00b7 gas "+(ch.gas_gwei!=null?ch.gas_gwei+" gwei":"\u2014")+"<br>24h txs "+kInt(ch.txs_24h)+" \u00b7 mempool "+(ch.mempool||"\u2014")+"<br>"+(ch.line||"LOOK"));
    var gtpCard=g.error?g.error:("DAA "+kInt(g.daa)+(g.daa_rank?" rank "+g.daa_rank:"")+"<br>fees "+bn(g.fees_usd)+" / "+(g.fees_eth!=null?g.fees_eth.toFixed(0)+" ETH":"\u2014")+"<br>stables "+bn(g.stables_usd));
    var top=(l2.top||[]).slice(0,3).map(function(p){return p.name+" "+bn(p.tvs);}).join(" \u00b7 ");
    var l2Card=l2.error?l2.error:("TVS "+bn(l2.tvs)+"<br>"+top+"<br>L2 activity \u2260 ETH buy");
    box.innerHTML=""
      +"<div class=\"idea\"><div class=\"tick\">ETH now</div><div class=\"thesis\">"+mapCard+"</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">Chain</div><div class=\"thesis\">"+chainCard+"</div></div>"
      +"<div class=\"idea\"><div class=\"tick\">ETH ultrasound</div><div class=\"thesis\">"+ethCard+"</div></div>"
      +"<a class=\"idea\" href=\"https://www.growthepie.com\" target=\"_blank\" rel=\"noopener\"><div class=\"tick\">growthepie</div><div class=\"thesis\">"+gtpCard+"</div></a>"
      +"<a class=\"idea\" href=\"https://l2beat.com\" target=\"_blank\" rel=\"noopener\"><div class=\"tick\">L2BEAT</div><div class=\"thesis\">"+l2Card+"</div></a>"
      +"<div class=\"idea\"><div class=\"tick\">ETH ETFs</div><div class=\"thesis\">latest "+(etf.eth_net_latest_usdm!=null?"+"+etf.eth_net_latest_usdm+"m":"\u2014")+"<br>does not clear $2,900</div></div>";
    if(reads) reads.innerHTML=[
      "Chain card = busy vs quiet. Not a fill.",
      "ETH HOLD. DO NOT BUY under $2,900. DRV DO NOT ADD."
    ].map(function(r){return "<div class=\"step\"><span class=\"k wait\">D</span><div><div class=\"t\">"+r+"</div></div></div>";}).join("");
    if(src) src.textContent="Coinbase + Blockchair + ultrasound + growthepie + L2BEAT";
  }catch(e){
    box.innerHTML="<div class=\"empty\">public tape failed</div>";
  }
}
drawPublicTape();
