/* Derivatives Monkey public snapshot — BTC/ETH only. Observe, no tickets. */
(function () {
  const SRC = "deribit,derive,binance,bybit,okx";
  const BASE = "https://www.derivativesmonkey.com/api/market/market-summary";
  const DVOL = "https://www.derivativesmonkey.com/api/market/dvol-index";
  function money(n) {
    if (n == null || isNaN(n)) return "—";
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(Math.round(n));
  }
  function usd(n) {
    if (n == null || isNaN(n)) return "—";
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function vp(n) {
    if (n == null || isNaN(n)) return "—";
    return n.toFixed(1) + "%";
  }
  function card(sym, s, dvol) {
    const gex = s.net_gamma || {};
    const flip = s.gamma_flip || {};
    const ivp = s.iv_percentile || {};
    const rv = s.rv || {};
    const pc = s.pc || {};
    const term = s.term || {};
    const cw = s.call_wall || {};
    const pw = s.put_wall || {};
    const longG = (gex.regime || "").indexOf("long") >= 0;
    return `<article class="idea">
      <div class="idea-top"><span class="tick">${sym}</span>
        <span class="pill ${longG ? "rec" : "watch"}">${(gex.regime || "gex").replace("_", " ")}</span></div>
      <div class="levels">
        <div class="lv"><div class="label">Spot</div><div class="num">${usd(s.spot && s.spot.value)}</div></div>
        <div class="lv"><div class="label">ATM 7D</div><div class="num">${vp(s.atm_iv_7d && s.atm_iv_7d.value)}</div></div>
        <div class="lv"><div class="label">DVOL</div><div class="num">${dvol && dvol.current != null ? dvol.current.toFixed(1) : "—"}</div></div>
      </div>
      <p class="thesis">IV ${ivp.tag || "—"} (${ivp.percentile != null ? Math.round(ivp.percentile) + "th pct" : "—"})
        · VRP ${rv.vrp != null ? rv.vrp.toFixed(1) + " vp" : "—"} (${rv.tag || "—"})
        · term ${term.tag || "—"}
        · P/C ${pc.ratio != null ? pc.ratio.toFixed(2) : "—"} ${pc.tag || ""}
        · call wall ${usd(cw.strike)} · put wall ${usd(pw.strike)}
        · flip ${usd(flip.strike)} (${flip.distance_pct != null ? flip.distance_pct.toFixed(2) + "% vs spot" : "—"})
        · net γ ${money(gex.value)}</p>
    </article>`;
  }
  async function pull(asset) {
    const [sum, dvol] = await Promise.all([
      fetch(BASE + "?asset=" + asset + "&sources=" + SRC).then((r) => r.json()),
      fetch(DVOL + "?asset=" + asset).then((r) => r.json()).catch(() => ({}))
    ]);
    return { sum, dvol };
  }
  async function drawOpt() {
    const el = document.getElementById("opt");
    const note = document.getElementById("opt-note");
    if (!el) return;
    try {
      const [btc, eth] = await Promise.all([pull("btc"), pull("eth")]);
      el.innerHTML = card("BTC", btc.sum, btc.dvol) + card("ETH", eth.sum, eth.dvol);
      if (note) note.textContent = "Live from Derivatives Monkey public summary · observe only · not a ticket";
      window.OPT = { btc: btc.sum, eth: eth.sum, at: Date.now() };
    } catch (e) {
      el.innerHTML = '<div class="empty">Options feed missed. Open derivativesmonkey.com/eth.</div>';
    }
  }
  drawOpt();
  setInterval(drawOpt, 5 * 60 * 1000);
})();
