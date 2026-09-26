const START = 100000;
const A = {
  SPY:{name:"S&P 500",  col:"--spy", px:772.04,  mu:.07, sd:.16, crypto:false, dp:2},
  QQQ:{name:"Nasdaq 100",col:"--qqq",px:745.40, mu:.09, sd:.21, crypto:false, dp:2},
  BTC:{name:"Bitcoin",  col:"--btc", px:83958.04, mu:.15, sd:.55, crypto:true, dp:4},
  ETH:{name:"Ether",    col:"--eth", px:2687.58, mu:.15, sd:.70, crypto:true, dp:3},
  CASH:{name:"Cash",    col:"--cash",px:1,       mu:.04, sd:0,   crypto:false}
};
const KEYS = ["SPY","QQQ","BTC","ETH"];
const RHO = {"SPY|QQQ":.92,"BTC|ETH":.82,"SPY|BTC":.35,"SPY|ETH":.35,"QQQ|BTC":.4,"QQQ|ETH":.4};
const rho=(a,b)=>a===b?1:(RHO[a+"|"+b]||RHO[b+"|"+a]||0);
const TARGET = {SPY:.15, QQQ:.15, BTC:.12, ETH:.08};
const RULES = {maxName:.15, maxCrypto:.40, deskStop:.15};
const IDEAS = [
  {id:"i1",sym:"SPY",status:"rec",side:"Buy",entry:772.04,stop:735,target:830,size:.15,conv:4,
   thesis:"RH last $772.04 Fri extended. Core sleeve when funded. Stop ~5% below."},
  {id:"i2",sym:"BTC",status:"rec",side:"Buy",entry:83958,stop:79500,target:98000,size:.12,conv:3,
   thesis:"Coinbase last $83,958. Dust only on RH. Do not size until funded."},
  {id:"i3",sym:"ETH",status:"idea",side:"Buy",entry:2687.58,stop:2520,target:3200,size:.08,conv:2,
   thesis:"Coinbase last $2,687.58. DO NOT BUY until $2,900 reclaim."},
  {id:"i4",sym:"QQQ",status:"watch",side:"Buy limit",entry:724,stop:700,target:780,size:.15,conv:3,
   thesis:"RH last $745.40 Fri extended. Wait $724. Do not chase."}
];
let book = []; let seq = 1; let realized = 0;
try{const s=JSON.parse(localStorage.getItem("inf-book")||"null"); if(s){book=s.book||[];seq=s.seq||1;realized=s.realized||0;}}catch(e){}
const save=()=>{try{localStorage.setItem("inf-book",JSON.stringify({book,seq,realized}))}catch(e){};};
let view="now", filter="all";
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const $=id=>document.getElementById(id);
const usd=(n,d)=>{if(d==null)d=0;return (n<0?"\u2212":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});};
const sgn=(n,d)=>{if(d==null)d=0;return (n>0?"+":"")+usd(n,d);};
const pct=(n,d)=>{if(d==null)d=1;return (n*100).toFixed(d)+"%";};
const px=(k)=>{const p=A[k].px;return p>=1000?usd(p,0):usd(p,2);};
const fmtPx=p=>p>=1000?usd(p,0):usd(p,2);
function cashBal(){return START + realized - book.reduce((s,p)=>s+p.qty*p.entry,0);}
function mv(k){return book.filter(p=>p.sym===k).reduce((s,p)=>s+p.qty*A[k].px,0);}
function nav(){return cashBal()+KEYS.reduce((s,k)=>s+mv(k),0);}
function weightsNow(){const n=nav();const w={};KEYS.forEach(k=>w[k]=mv(k)/n);w.CASH=Math.max(0,cashBal()/n);return w;}
function weightsTgt(){const w=Object.assign({},TARGET);w.CASH=1-KEYS.reduce((s,k)=>s+TARGET[k],0);return w;}
function arc(cx,cy,r0,r1,a0,a1){
  const p=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];
  const large=(a1-a0)>Math.PI?1:0;
  const p0=p(r1,a0), p1=p(r1,a1), p2=p(r0,a1), p3=p(r0,a0);
  return "M"+p0[0]+","+p0[1]+"A"+r1+","+r1+" 0 "+large+" 1 "+p1[0]+","+p1[1]+"L"+p2[0]+","+p2[1]+"A"+r0+","+r0+" 0 "+large+" 0 "+p3[0]+","+p3[1]+"Z";
}
function drawWheel(){
  const w = view==="now"?weightsNow():weightsTgt();
  const n = nav();
  const order=KEYS.concat(["CASH"]);
  let a=-Math.PI/2, paths="";
  const gap=order.filter(k=>w[k]>0.0005).length>1?0.012:0;
  order.forEach(k=>{
    if(w[k]<=0.0005) return;
    const span=w[k]*Math.PI*2;
    const a0=a+gap/2, a1=a+span-gap/2;
    if(span>=Math.PI*2-0.001){
      paths+=`<circle cx="100" cy="100" r="80" fill="none" stroke="${css(A[k].col)}" stroke-width="30"><title>${k} ${pct(w[k])}</title></circle>`;
    } else paths+=`<path d="${arc(100,100,65,95,a0,a1)}" fill="${css(A[k].col)}"><title>${k} ${pct(w[k])}</title></path>`;
    a+=span;
  });
  const crypto=(w.BTC||0)+(w.ETH||0);
  $("wheel").innerHTML=`<svg viewBox="0 0 200 200" role="img" aria-label="Allocation wheel">
    ${paths}
    <text x="100" y="88" text-anchor="middle" font-size="9" font-family="var(--body)" fill="${css("--ink-3")}" letter-spacing="1">${view==="now"?"NOW":"TARGET"}</text>
    <text x="100" y="108" text-anchor="middle" font-size="19" font-weight="600" font-family="Inter, sans-serif" fill="${css("--ink")}">${usd(n)}</text>
    <text x="100" y="123" text-anchor="middle" font-size="7.5" font-family="var(--body)" fill="${css("--ink-3")}">${pct(1-(w.CASH||0),0)} invested · ${pct(crypto,0)} crypto</text>
  </svg>`;
  $("legend").innerHTML=order.map(k=>{
    const val=w[k]*n;
    return `<div class="lg"><span class="sw" style="background:var(${A[k].col})"></span>
      <span class="n">${k==="CASH"?"Cash":k}<small>${k==="CASH"?"dry powder":A[k].name}</small></span>
      <span class="p">${pct(w[k])}</span><span class="d">${usd(val)}</span></div>`;
  }).join("");
  $("v-now").setAttribute("aria-pressed",view==="now");
  $("v-tgt").setAttribute("aria-pressed",view!=="now");
  drawProjection(w,n);
}
function portStats(w){
  const ks=KEYS.concat(["CASH"]);
  let mu=0,v=0;
  ks.forEach(i=>{mu+=w[i]*A[i].mu; ks.forEach(j=>{v+=w[i]*w[j]*A[i].sd*A[j].sd*rho(i,j)})});
  return {mu:mu,sd:Math.sqrt(v)};
}
function band(n,mu,sd,t){
  const m=Math.log(1+mu)-sd*sd/2;
  return {p10:n*Math.exp(m*t-1.2816*sd*Math.sqrt(t)),p50:n*Math.exp(m*t),p90:n*Math.exp(m*t+1.2816*sd*Math.sqrt(t))};
}
function drawProjection(w,n){
  const T=+$("hz").value; $("hz-v").textContent=T+" yr";
  const st=portStats(w), mu=st.mu, sd=st.sd;
  const b=band(n,mu,sd,T);
  [["p10",b.p10],["p50",b.p50],["p90",b.p90]].forEach(function(pair){
    var id=pair[0], v=pair[1];
    $(id).textContent=usd(v);
    const g=v-n; const el=$(id+"g");
    el.textContent=sgn(g)+" ("+(g/n*100>=0?"+":"")+(g/n*100).toFixed(1)+"%)";
    el.className="g "+(g>=0?"up":"down");
  });
  const W=520,H=150,pl=52,pr=10,pt=10,pb=22;
  const pts=[];for(let i=0;i<=T*4;i++){const t=i/4; const bb=band(n,mu,sd,t); pts.push({t:t,p10:bb.p10,p50:bb.p50,p90:bb.p90});}
  const maxV=Math.max.apply(null,pts.map(p=>p.p90)), minV=Math.min.apply(null,pts.map(p=>p.p10));
  const lo=Math.floor(minV/5000)*5000, hi=Math.ceil(maxV/5000)*5000||n*1.1;
  const X=t=>pl+(t/T)*(W-pl-pr), Y=v=>pt+(1-(v-lo)/(hi-lo||1))*(H-pt-pb);
  const line=k=>pts.map((p,i)=>(i?"L":"M")+X(p.t).toFixed(1)+","+Y(p[k]).toFixed(1)).join("");
  const area=line("p90")+pts.slice().reverse().map(p=>"L"+X(p.t).toFixed(1)+","+Y(p.p10).toFixed(1)).join("")+"Z";
  const ticks=[lo,(lo+hi)/2,hi];
  const grid=ticks.map(v=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css("--line")}" stroke-width="1"/><text x="${pl-6}" y="${Y(v)+3.5}" text-anchor="end" font-size="10" font-family="Inter, sans-serif" fill="${css("--ink-3")}">${v>=1e6?"$"+(v/1e6).toFixed(2)+"M":"$"+Math.round(v/1000)+"k"}</text>`).join("");
  const xt=[0,Math.round(T/2),T].filter((v,i,a)=>a.indexOf(v)===i).map(t=>`<text x="${X(t)}" y="${H-6}" text-anchor="${t===0?"start":t===T?"end":"middle"}" font-size="10" font-family="Inter, sans-serif" fill="${css("--ink-3")}">${t===0?"Today":t+"y"}</text>`).join("");
  const acc=css("--accent");
  $("fan").innerHTML=grid+`
    <path d="${area}" fill="${acc}" fill-opacity=".14"/>
    <path d="${line("p90")}" fill="none" stroke="${acc}" stroke-opacity=".45" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>
    <path d="${line("p10")}" fill="none" stroke="${acc}" stroke-opacity=".45" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>
    <path d="${line("p50")}" fill="none" stroke="${acc}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    <line x1="${pl}" x2="${W-pr}" y1="${Y(n)}" y2="${Y(n)}" stroke="${css("--ink-3")}" stroke-width="1" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
    `+xt;
  $("proj-note").textContent="Overlay wheel uses RH/Coinbase marks. Live dollars are in Owned. Expected "+pct(mu)+" / vol "+pct(sd)+".";
}
function buildPlan(){
  const n=nav(), w=weightsNow(), steps=[];
  const dd=(START-n)/START;
  if(dd>=RULES.deskStop){
    steps.push({k:"stop",icon:"!",t:"Desk stop hit \u2014 flatten everything",why:"NAV is down "+pct(dd)+" from start. Rule: go flat, then stand aside 7 days.",act:{type:"flatten"}});
    return {steps:steps,mood:"Desk stop triggered",tone:"down"};
  }
  book.forEach(p=>{
    if(p.stop && A[p.sym].px<=p.stop) steps.push({k:"sell",icon:"S",t:"Exit "+p.sym+" \u2014 stop hit",why:"Last "+px(p.sym)+" is at or below the "+fmtPx(p.stop)+" stop.",act:{type:"close",id:p.id}});
    else if(p.target && A[p.sym].px>=p.target) steps.push({k:"sell",icon:"S",t:"Take profit on "+p.sym,why:"Reached the "+fmtPx(p.target)+" target. Sell half and move the stop to entry.",act:{type:"trim",id:p.id}});
  });
  KEYS.forEach(k=>{ if(w[k]>RULES.maxName+0.005){const ex=(w[k]-RULES.maxName)*n; steps.push({k:"sell",icon:"S",t:"Trim "+k+" to 15%",why:k+" is "+pct(w[k])+" of NAV; max per name is 15%. Sell about "+usd(ex)+".",act:{type:"sell",sym:k,usd:ex}});}});
  const cr=w.BTC+w.ETH;
  if(cr>RULES.maxCrypto+0.005) steps.push({k:"sell",icon:"S",t:"Cut crypto sleeve to 40%",why:"Crypto is "+pct(cr)+" of NAV.",act:null});
  KEYS.forEach(k=>{
    const diff=TARGET[k]-w[k]; const amt=diff*n;
    if(Math.abs(diff)<0.02) return;
    const idea=IDEAS.find(i=>i.sym===k);
    if(diff>0){
      if(idea && idea.status==="watch" && A[k].px>idea.entry){
        steps.push({k:"wait",icon:"W",t:"Wait on "+k+" \u2014 limit at "+fmtPx(idea.entry),why:"Target is "+pct(TARGET[k],0)+" ("+usd(amt)+"), but price "+px(k)+" is extended. Fill only on a pullback.",act:null});
      } else {
        steps.push({k:"buy",icon:"B",t:"Buy "+usd(amt)+" of "+k,why:"Brings "+k+" from "+pct(w[k])+" to its "+pct(TARGET[k],0)+" target. Stop "+(idea?fmtPx(idea.stop):"\u2014")+".",act:{type:"buy",sym:k,usd:amt}});
      }
    } else if(!steps.some(s=>s.t.indexOf("Trim "+k)===0)){
      steps.push({k:"sell",icon:"S",t:"Sell "+usd(-amt)+" of "+k,why:"Above its "+pct(TARGET[k],0)+" target weight.",act:{type:"sell",sym:k,usd:-amt}});
    }
  });
  if(!steps.length) steps.push({k:"ok",icon:"\u2713",t:"On plan \u2014 hold",why:"Book matches the target wheel and every rule passes.",act:null});
  const order={stop:0,sell:1,buy:2,wait:3,ok:4};
  steps.sort((a,b)=>order[a.k]-order[b.k]);
  const invested=1-w.CASH;
  const mood = invested<0.05?"All cash \u2014 ready to deploy":steps.some(s=>s.k==="sell")?"Risk to reduce":steps.some(s=>s.k==="buy")?"Building toward target":"On plan";
  return {steps:steps,mood:mood,tone:""};
}
function drawPlan(){
  const plan=buildPlan(); const steps=plan.steps, mood=plan.mood;
  const nAct=steps.filter(s=>s.act).length;
  $("plan-head").innerHTML="<b>"+mood+"</b><span class=\"muted\" style=\"font-size:12.5px\">"+steps.length+" step"+(steps.length>1?"s":"")+(nAct?" · overlay only":"")+"</span>";
  $("plan").innerHTML=steps.map((s,i)=>`<div class="step"><span class="k ${s.k}">${s.icon}</span>
    <div><div class="t">${s.t}</div><div class="why">${s.why}</div></div>
    <span></span></div>`).join("");
}
