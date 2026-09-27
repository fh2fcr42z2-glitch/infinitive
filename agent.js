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
  if (!n) return hit.key + " is on the tape or a crumb. No fill from chat.";
  return n.sym + "  " + n.call + (n.usd != null ? "  $" + n.usd : "") + "\nFit: " + n.fit + "\nWhy: " + n.why + "\nWrong: " + n.wrong + "\nAlpha: " + n.alpha;
}
function hxNews() {
  var items = (HX.news && HX.news.items) || [];
  if (!items.length) return "News hub is empty. Open /news.";
  return items.slice(0, 5).map(function (x) { return x.src + ": " + x.title; }).join("\n") + "\n\nHeadlines are not tickets.";
}
function hxBuy(q) {
  var hit = hxFindName(q);
  if (hit && hit.row) return hxName(hit);
  return "No live order from this desk.\n" + ((HX.rs && HX.rs.do_not) || []).join("\n");
}
function hxRisk() {
  return "Desmond: SNAP + DRV ~62% of live NAV. CB cash is the powder. RH BP $0.15. No 5x. No headline trade.";
}
function hxHelp() {
  return "Ask Houston. Book questions use the live files. Broader questions go to Grok on the server. Not a fill.";
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
    return c && c.row ? hxName(c) : "Coinbase USD is dry powder. HOLD. DO NOT spend RH $0.15.";
  }
  var hit = hxFindName(q);
  if (hit) return hxName(hit);
  return "";
}
function hxPush(who, text) {
  var log = document.getElementById("hx-log");
  if (!log) return;
  var el = document.createElement("article");
  el.className = "hx-msg " + who;
  el.innerHTML = "<div class=\"who\"></div><div class=\"body\"></div>";
  el.querySelector(".who").textContent = who === "me" ? "You" : "Houston";
  el.querySelector(".body").textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}
function hxAsk(q) {
  q = hxText(q).trim();
  if (!q) return;
  hxPush("me", q);
  var pending = hxPush("bot", "Thinking…");
  fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: q })
  }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
    .then(function (pack) {
      if (pack.ok && pack.j && pack.j.answer) {
        pending.querySelector(".body").textContent = pack.j.answer;
        var s = document.getElementById("hx-status");
        if (s) s.textContent = pack.j.model || "grok";
        return;
      }
      var local = hxAnswer(q) || (pack.j && pack.j.error) || "Ask failed. Using desk files.";
      pending.querySelector(".body").textContent = local;
    })
    .catch(function () {
      pending.querySelector(".body").textContent = hxAnswer(q) || "Ask failed.";
    });
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
    if (s) s.textContent = "Grok + book";
    hxPush("bot", "Houston on desk with Grok. Ask a position or anything on the book. Not a fill.");
  }).catch(function () {
    hxPush("bot", "Could not load desk files.");
  });
}
hxBind();
hxLoad();
