export const MARKUP = `<div class="wrap">
  <header class="top">
    <div class="brand">
      <div class="mark" aria-hidden="true">∞</div>
      <div><h1>INFINITIVE</h1><small>Ghost Desk · paper book</small></div>
    </div>
    <div class="chips">
      <span class="chip"><span class="dot on"></span>Paper mode</span>
      <span class="chip" id="mkt"><span class="dot"></span>US market</span>
      <span class="chip">Marks: close Sep 22, 2026</span>
    </div>
  </header>
  <section class="kpis" aria-label="Summary">
    <div class="kpi"><span class="label">Net asset value</span><span class="v" id="k-nav">$100,000</span><span class="s" id="k-nav-s">Start $100,000</span></div>
    <div class="kpi"><span class="label">Open P&L</span><span class="v" id="k-pnl">$0</span><span class="s" id="k-pnl-s">0.00% on NAV</span></div>
    <div class="kpi"><span class="label">Invested</span><span class="v" id="k-inv">0%</span><div class="meter"><i id="k-inv-m" style="width:0%"></i></div></div>
    <div class="kpi"><span class="label">Crypto sleeve</span><span class="v" id="k-cr">0%</span><span class="s">Cap 40%</span></div>
    <div class="kpi"><span class="label">Room to desk stop</span><span class="v" id="k-dd">15.0%</span><span class="s">Stop at −15% → 7 days flat</span></div>
  </section>
  <div class="grid2">
    <section class="panel" aria-labelledby="wheel-h">
      <div class="phead">
        <h2 id="wheel-h">Portfolio wheel</h2>
        <div class="seg" role="group" aria-label="Wheel view">
          <button id="v-now" aria-pressed="true">Now</button>
          <button id="v-tgt" aria-pressed="false">Target plan</button>
        </div>
      </div>
      <div class="wheel-row">
        <div class="wheel" id="wheel"></div>
        <div class="legend" id="legend"></div>
      </div>
      <div class="proj">
        <div class="phead">
          <h2>What it could make</h2>
          <div class="proj-ctl">
            <label htmlFor="hz">Horizon <input type="range" id="hz" min="1" max="10" defaultValue="3" /> <b class="num" id="hz-v">3 yr</b></label>
          </div>
        </div>
        <div class="scen">
          <div class="sc"><span class="label">Rough year (1 in 10)</span><span class="v" id="p10">—</span><span class="g" id="p10g">—</span></div>
          <div class="sc base"><span class="label">Base case</span><span class="v" id="p50">—</span><span class="g" id="p50g">—</span></div>
          <div class="sc"><span class="label">Strong (1 in 10)</span><span class="v" id="p90">—</span><span class="g" id="p90g">—</span></div>
        </div>
        <svg class="fan" id="fan" viewBox="0 0 520 150" preserveAspectRatio="none" role="img" aria-label="Projected value range over time"></svg>
        <p class="fine" id="proj-note">Projection uses the wheel you are viewing.</p>
      </div>
    </section>
    <section class="panel" aria-labelledby="plan-h">
      <div class="phead">
        <h2 id="plan-h">Next moves</h2>
        <span class="label">AI desk plan · updates live</span>
      </div>
      <div class="plan-head" id="plan-head"></div>
      <div class="plan" id="plan"></div>
      <p class="fine">Nothing executes unless you press a button. This is a paper book.</p>
    </section>
  </div>
  <section class="panel" aria-labelledby="ideas-h">
    <div class="phead">
      <h2 id="ideas-h">Trade ideas</h2>
      <div class="seg" role="group" aria-label="Filter ideas" id="ifilter">
        <button data-f="all" aria-pressed="true">All</button>
        <button data-f="rec" aria-pressed="false">Recommended</button>
        <button data-f="idea" aria-pressed="false">Ideas</button>
        <button data-f="watch" aria-pressed="false">Watching</button>
      </div>
    </div>
    <div class="ideas" id="ideas"></div>
  </section>
  <section class="panel" aria-labelledby="book-h">
    <div class="phead">
      <h2 id="book-h">Paper book</h2>
      <div class="marks" id="marks"></div>
    </div>
    <div class="tbl-wrap" id="book"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="btn ghost" id="flatten">Flatten book</button>
    </div>
  </section>
  <section class="panel" aria-labelledby="rules-h">
    <div class="phead"><h2 id="rules-h">Desk rules</h2><span class="label">Universe BTC · ETH · SPY · QQQ</span></div>
    <div class="rules" id="rules"></div>
  </section>
  <footer>INFINITIVE / GHOST DESK · paper simulation · not a registered fund · not advice</footer>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
