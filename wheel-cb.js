var CB_BOOK = null;
var CB_COL = {
  DRV: "#1a1a1a",
  ETH: "#333333",
  AMP: "#5a5a5a",
  BTC: "#808080",
  XRP: "#a0a0a0",
  SOL: "#bfbfbf",
  AERO: "#666666",
  ENA: "#808080",
  PUMP: "#a0a0a0",
  CASH: "#dedfe1"
};
function cbUsd(n) {
  n = +n; if (!isFinite(n)) return "$0";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function cbPct(n) { return ((n || 0) * 100).toFixed(1) + "%"; }
function cbRows() {
  var rows = ((CB_BOOK && CB_BOOK.holdings) || []).map(function (h) {
    var px = window.LIVE_PX && window.LIVE_PX[h.sym];
    var usd = (px != null && h.qty) ? px * h.qty : h.usd;
    return { sym: h.sym, qty: h.qty, usd: +usd || 0 };
  });
  var cash = CB_BOOK && CB_BOOK.cash ? +CB_BOOK.cash : 0;
  if (cash > 0.5) rows.push({ sym: "CASH", qty: cash, usd: cash });
  var nav = rows.reduce(function (s, r) { return s + r.usd; }, 0) || (CB_BOOK && CB_BOOK.nav) || 0;
  rows.forEach(function (r) { r.w = nav ? r.usd / nav : 0; });
  rows.sort(function (a, b) { return b.usd - a.usd; });
  return { rows: rows, nav: nav };
}
function drawWheel() {
  var box = document.getElementById("wheel");
  var leg = document.getElementById("legend");
  if (!box) return;
  var pack = cbRows();
  var rows = pack.rows, n = pack.nav;
  var a = -Math.PI / 2, paths = "";
  function pth(r, ang) { return [100 + r * Math.cos(ang), 100 + r * Math.sin(ang)]; }
  rows.forEach(function (r) {
    if (r.w < 0.004) return;
    var span = r.w * Math.PI * 2;
    var a0 = a + 0.006, a1 = a + span - 0.006;
    var p0 = pth(95, a0), p1 = pth(95, a1), p2 = pth(65, a1), p3 = pth(65, a0);
    var large = span > Math.PI ? 1 : 0;
    var col = CB_COL[r.sym] || "#808080";
    paths += "<path d=\"M" + p0[0] + "," + p0[1] + "A95,95 0 " + large + " 1 " + p1[0] + "," + p1[1] + "L" + p2[0] + "," + p2[1] + "A65,65 0 " + large + " 0 " + p3[0] + "," + p3[1] + "Z\" fill=\"" + col + "\"><title>" + r.sym + " " + cbPct(r.w) + "</title></path>";
    a += span;
  });
  box.innerHTML = "<svg viewBox=\"0 0 200 200\"><text x=\"100\" y=\"88\" text-anchor=\"middle\" font-size=\"9\" fill=\"#666\">COINBASE</text><text x=\"100\" y=\"108\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#000\">" + cbUsd(n) + "</text><text x=\"100\" y=\"123\" text-anchor=\"middle\" font-size=\"7.5\" fill=\"#666\">Default book</text>" + paths + "</svg>";
  if (leg) {
    leg.innerHTML = rows.map(function (r) {
      return "<div class=\"lg\"><span class=\"sw\" style=\"background:" + (CB_COL[r.sym] || "#808080") + "\"></span><span class=\"n\">" + r.sym + "</span><span class=\"p\">" + cbPct(r.w) + "</span><span class=\"d\">" + cbUsd(r.usd) + "</span></div>";
    }).join("");
  }
  var vn = document.getElementById("v-now"); if (vn) vn.setAttribute("aria-pressed", "true");
  var vt = document.getElementById("v-tgt"); if (vt) vt.setAttribute("aria-pressed", "false");
}
function loadCbWheel() {
  fetch("cb.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    if (j) CB_BOOK = j;
    drawWheel();
  }).catch(function () { drawWheel(); });
}
loadCbWheel();
