export function initDesk() {
  const START = 100000;
  const A = {
    SPY:{name:"S&P 500", col:"--spy", px:773.38, dp:2},
    QQQ:{name:"Nasdaq 100", col:"--qqq", px:747.46, dp:2},
    BTC:{name:"Bitcoin", col:"--btc", px:86378.44, dp:4},
    ETH:{name:"Ether", col:"--eth", px:2764.30, dp:3},
    CASH:{name:"Cash", col:"--cash", px:1, dp:0}
  };
  const KEYS = ["SPY","QQQ","BTC","ETH"];
  const TARGET = {SPY:.15, QQQ:.15, BTC:.12, ETH:.08};
  const RULES = {maxName:.15, maxCrypto:.40, deskStop:.15};
  let book = [], seq = 1, realized = 0, view = "now", filter = "all";
  try {
    const s = JSON.parse(localStorage.getItem("inf-book") || "null");
    if (s) { book = s.book || []; seq = s.seq || 1; realized = s.realized || 0; if (s.px) for (const k in s.px) if (A[k]) A[k].px = s.px[k]; }
  } catch (e) {}
  const save = () => { try { localStorage.setItem("inf-book", JSON.stringify({ book, seq, realized, px: Object.fromEntries(KEYS.map(k => [k, A[k].px])) })); } catch (e) {} };
  const $ = (id) => document.getElementById(id);
  const usd = (n, d) => { if (d == null) d = 0; return (n < 0 ? "\u2212" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); };
  const pct = (n, d) => { if (d == null) d = 1; return (n * 100).toFixed(d) + "%"; };
  const cashBal = () => START + realized - book.reduce((s, p) => s + p.qty * p.entry, 0);
  const mv = (k) => book.filter((p) => p.sym === k).reduce((s, p) => s + p.qty * A[k].px, 0);
  const nav = () => cashBal() + KEYS.reduce((s, k) => s + mv(k), 0);
  const weightsNow = () => { const n = nav(); const w = {}; KEYS.forEach((k) => w[k] = mv(k) / n); w.CASH = Math.max(0, cashBal() / n); return w; };
  function toast(m) { const t = $("toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(toast._); toast._ = setTimeout(() => t.classList.remove("show"), 2200); }
  function flatten() { book.forEach((p) => realized += p.qty * (A[p.sym].px - p.entry)); book = []; toast("Book flattened"); }
  function drawKpis() {
    const n = nav(), w = weightsNow();
    if ($("k-nav")) $("k-nav").textContent = usd(n);
    if ($("k-inv")) $("k-inv").textContent = pct(1 - w.CASH, 0);
    if ($("k-cr")) $("k-cr").textContent = pct((w.BTC || 0) + (w.ETH || 0), 0);
    const dd = Math.max(0, (START - n) / START);
    if ($("k-dd")) $("k-dd").textContent = pct(RULES.deskStop - dd);
    if ($("k-inv-m")) $("k-inv-m").style.width = Math.min(100, (1 - w.CASH) * 100) + "%";
    if ($("rules")) {
      const maxName = Math.max(...KEYS.map((k) => w[k]));
      $("rules").innerHTML = "<div class=\"rule\"><div class=\"top2\"><span style=\"font-weight:600\">Largest name</span><span class=\"num\">" + pct(maxName) + " / 15%</span></div></div><div class=\"rule\"><div class=\"top2\"><span style=\"font-weight:600\">Crypto</span><span class=\"num\">" + pct((w.BTC || 0) + (w.ETH || 0)) + " / 40%</span></div></div><div class=\"rule\"><div class=\"top2\"><span style=\"font-weight:600\">Execution</span><span class=\"num\">Manual</span></div><span class=\"fine\">Paper only. You press the button.</span></div>";
    }
  }
  function drawPlan() {
    if ($("plan-head")) $("plan-head").innerHTML = "<b>All cash \u2014 ready to deploy</b>";
    if ($("plan")) $("plan").innerHTML = "<div class=\"step\"><span class=\"k buy\">B</span><div><div class=\"t\">Build the 15/15/12 sleeve</div><div class=\"why\">Target SPY 15%, QQQ 15%, BTC 12%, ETH 8%. Paper fill from Trade ideas.</div></div></div>";
  }
  function drawBook() {
    if ($("book")) $("book").innerHTML = book.length ? "<div class=\"empty\">" + book.length + " open</div>" : "<div class=\"empty\">No open positions. Use Paper buy on an idea when the full engine is loaded.</div>";
  }
  function drawMarks() {
    if (!$("marks")) return;
    $("marks").innerHTML = "<span class=\"label\">Marks</span>" + KEYS.map((k) => "<label class=\"mk\">" + k + "<input id=\"mk-" + k + "\" type=\"number\" step=\"any\" value=\"" + A[k].px + "\"></label>").join("");
    KEYS.forEach((k) => { const el = $("mk-" + k); if (el) el.onchange = (e) => { const v = +e.target.value; if (v > 0) { A[k].px = v; render(true); } }; });
  }
  function drawIdeas() {
    if ($("ideas")) $("ideas").innerHTML = "<div class=\"empty\">Ideas load with the full desk engine. Mandate is unchanged: SPY QQQ BTC ETH, 15% / 40% / \u221215%.</div>";
  }
  function drawWheel() {
    if ($("legend")) {
      const w = weightsNow(), n = nav();
      $("legend").innerHTML = KEYS.concat(["CASH"]).map((k) => "<div class=\"lg\"><span class=\"sw\" style=\"background:var(" + A[k].col + ")\"></span><span class=\"n\">" + k + "</span><span class=\"p\">" + pct(k === "CASH" ? w.CASH : w[k]) + "</span><span class=\"d\">" + usd((k === "CASH" ? w.CASH : w[k]) * n) + "</span></div>").join("");
    }
    if ($("wheel")) $("wheel").innerHTML = "<svg viewBox=\"0 0 200 200\"><text x=\"100\" y=\"108\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"600\" fill=\"currentColor\">" + usd(nav()) + "</text></svg>";
  }
  function clock() {
    if (!$("mkt")) return;
    const now = new Date();
    const ct = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
    const t = ct.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    $("mkt").innerHTML = "<span class=\"dot on\"></span>US market \u00b7 " + t + " CT \u00b7 crypto 24/7";
  }
  function render(keepMarks) { save(); drawKpis(); drawWheel(); drawPlan(); drawIdeas(); drawBook(); if (!keepMarks) drawMarks(); }
  if ($("flatten")) $("flatten").onclick = () => { flatten(); render(); };
  clock();
  const clockId = setInterval(clock, 30000);
  render();
  return () => clearInterval(clockId);
}
