function weiToEth(v) {
  if (v == null) return null;
  if (typeof v === "number" && isFinite(v)) return v;
  var s = String(v).replace(/n$/i, "");
  if (!/^\d+$/.test(s)) return null;
  if (s.length <= 18) return Number(s) / 1e18;
  var whole = s.slice(0, s.length - 18);
  var frac = s.slice(s.length - 18, s.length - 15);
  return Number(whole + "." + frac);
}
function mln(n) {
  if (n == null || !isFinite(n)) return null;
  return Math.round(n / 1e4) / 100;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    var r = await fetch("https://ultrasound.money/api/fees/scarcity");
    if (!r.ok) return res.status(r.status).json({ error: "ultrasound scarcity " + r.status });
    var j = await r.json();
    var supply = weiToEth(j.ethSupply);
    var burned = weiToEth(j.engines && j.engines.burned && j.engines.burned.amount);
    var staked = weiToEth(j.engines && j.engines.staked && j.engines.staked.amount);
    var locked = j.engines && j.engines.locked ? Number(j.engines.locked.amount) : null;
    var stakePct = supply ? staked / supply : null;
    return res.status(200).json({
      asof: new Date().toISOString(),
      source: "ultrasound.money /api/fees/scarcity",
      block: j.number || null,
      supply_eth: supply,
      burned_eth: burned,
      staked_eth: staked,
      locked_eth: isFinite(locked) ? locked : null,
      staked_pct: stakePct,
      supply_m: mln(supply),
      burned_m: mln(burned),
      staked_m: mln(staked),
      call: "HOLD ETH. DO NOT BUY under $2,900. Burn stock is not a fill."
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
