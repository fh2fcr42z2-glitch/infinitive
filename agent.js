var HX = { rh: null, rs: null, news: null, look: null, ready: false };

function hxText(s) {
  return String(s == null ? "" : s);
}
function hxFindName(q) {
  var names = (HX.rs && HX.rs.names) || [];
  var u = q.toUpperCase();
  var keys = ["SNAP","DRV","ETH","BTC","AERO","PUMP","ENA","VST","XPL","SCHD","SGOV","QQQ","SPY","XTKG","SOL","O"];
  var hit = "";
  keys.forEach(function (k) { if (u.indexOf(k) >= 0) hit = k; });
  if (!hit && /cash|powder|usd/.test(q.toLowerCase())) hit = "USD";
  if (!hit) return null;
  var row = null;
  names.forEach(function (n) {
    if (hxText(n.sym).toUpperCase().indexOf(hit) >= 0) row = n;
  });
  return { key: hit, row: row };
}
function hxHoldings() {
  var rows = ((HX.rh && HX.rh.holdings) || []).filter(function (h) { return (h.usd || 0) >= 1 || /call/i.test(h.kind || ""); });
  var lines = rows.map(function (h) {
    var usd = h.usd != null ? "$" + Number(h.usd).toFixed(0) : "n/a";
    return h.sym + "  " + usd + "  " + (h.account || "") + "  " + (h.action || "HOLD");
  });
  var nav = HX.rh && HX.rh.live_nav ? HX.rh.live_nav.toFixed(0) : "?";
  return "Live NAV $" + nav + " (RH + Coinbase).\n" + lines.join("\n") + "\n\nConcentration: " + ((HX.rs && HX.rs.concentration) || "see research") + "\nThis is the book. Not a new ticket.";
}
function hxName(hit) {
  var n = hit.row;
  if (!n) {
    return hit.key + " is on the tape or a crumb. Open DES " + hit.key + " or read Owned. No fill from chat.";
  }
  return n.sym + "  " + n.call + (n.usd != null ? "  $" + n.usd : "") + "\nFit: " + n.fit + "\nWhy: " + n.why + "\nWrong: " + n.wrong + "\nAlpha: " + n.alpha;
}
function hxNews() {
  var items = (HX.news && HX.news.items) || [];
  if (!items.length) return "News hub is empty. Open /news.";
  return items.slice(0, 5).map(function (x) {
    return x.src + ": " + x.title;
  }).join("\n") + "\n\nHeadlines are not tickets. DO NOT BUY from a feed.";
}
function hxBuy(q) {
  var hit = hxFindName(q);
  if (hit && hit.row) return hxName(hit);
  var dn = ((HX.rs && HX.rs.do_not) || []).join("\n");
  return "No live order from this desk.\n" + dn + "\n\nIf you want a ticket typed, say the name and I will answer HOLD / DO NOT ADD / LOOK. I will not send an order.";
}
function hxRisk() {
  return "Desmond: two names are ~62% of live NAV (SNAP + DRV). Coinbase cash $130 is the only powder. RH buying power $0.15. Pending $206 is not spendable. No 5x. No headline trade.\nDoocey: kill VST adds, PUMP/ENA/XPL adds, Look names, and any bot that orders from RSS.";
}
function hxHelp() {
  return "Ask Houston about the book.\nTry: what do I own / SNAP / ETH / should I buy / cash / risk / news / forecast\nAnswers come from rh.json + research.json + news.json. Not a live model. Not a fill.";
}
function hxAnswer(raw) {
  var q = hxText(raw).trim();
  if (!q) return hxHelp();
  var l = q.toLowerCase();
  if (/help|what can|commands/.test(l)) return hxHelp();
  if (/own|holding|book|nav|position/.test(l)) return hxHoldings();
  if (/news|headline|hack|bitget/.test(l)) return hxNews();
  if (/risk|concentrat|size|stop/.test(l)) return hxRisk();
  if (/buy|sell|add|fill|long|short|order/.test(l)) return hxBuy(q);
  if (/cash|powder|sgov/.test(l)) {
    var c = hxFindName("cash");
    return c && c.row ? hxName(c) : "Coinbase USD $130 is dry powder. HOLD. First process idea is SGOV or leave cash. DO NOT spend RH $0.15.";
  }
  if (/forecast|project/.test(l)) return "Forecast panel is SNAP-weighted bands on the live book. Planning sketch, not a promise. Open Forecast on the desk.";
  var hit = hxFindName(q);
  if (hit) return hxName(hit);
  return "I only speak the desk files.\n" + hxHelp();
}
function hxPush(who, text) {
  var log = document.getElementById("hx-log");
  if (!log) return;
  var el = document.createElement("article");
  el.className = "hx-msg " + who;
  el.innerHTML = "<div class=\"who\">" + (who === "me" ? "You" : "Houston") + "</div><div class=\"body\"></div>";
  el.querySelector(".body").textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}
function hxAsk(q) {
  q = hxText(q).trim();
  if (!q) return;
  hxPush("me", q);
  hxPush("bot", hxAnswer(q));
}
function hxBind() {
  var form = document.getElementById("hx-form");
  var input = document.getElementById("hx-q");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input ? input.value : "";
    if (input) input.value = "";
    hxAsk(v);
  });
  document.querySelectorAll("[data-hx]").forEach(function (b) {
    b.addEventListener("click", function () { hxAsk(b.getAttribute("data-hx")); });
  });
  var open = document.getElementById("hx-open");
  var panel = document.getElementById("hx");
  if (open && panel) open.addEventListener("click", function () {
    panel.hidden = !panel.hidden;
    if (!panel.hidden && input) input.focus();
  });
}
function hxLoad() {
  Promise.all([
    fetch("rh.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }),
    fetch("research.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }),
    fetch("news.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }),
    fetch("look.json?t=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; })
  ]).then(function (arr) {
    HX.rh = arr[0]; HX.rs = arr[1]; HX.news = arr[2]; HX.look = arr[3]; HX.ready = true;
    var s = document.getElementById("hx-status");
    if (s) s.textContent = HX.rh ? ("book $" + HX.rh.live_nav) : "files missing";
    hxPush("bot", "Houston on desk. Live NAV $" + (HX.rh && HX.rh.live_nav ? HX.rh.live_nav.toFixed(0) : "?") + ". Ask a name or: what do I own.");
  }).catch(function () {
    hxPush("bot", "Could not load desk files.");
  });
}
hxBind();
hxLoad();
