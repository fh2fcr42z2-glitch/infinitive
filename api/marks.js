async function spot(sym) {
  try {
    var r = await fetch("https://api.coinbase.com/v2/prices/" + encodeURIComponent(sym) + "-USD/spot");
    if (!r.ok) return null;
    var j = await r.json();
    var n = Number(j && j.data && j.data.amount);
    return isFinite(n) ? n : null;
  } catch (e) { return null; }
}
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
  if (req.method === "OPTIONS") return res.status(200).end();
  var names = ["BTC","ETH","SOL","DRV","AMP","XRP","AERO","ENA","PUMP","XPL"];
  var out = { asof: new Date().toISOString(), source: "Coinbase public spot" };
  var vals = await Promise.all(names.map(spot));
  names.forEach(function (n, i) { if (vals[i] != null) out[n] = vals[i]; });
  return res.status(200).json(out);
};
