async function spot(sym) {
  var r = await fetch("https://api.coinbase.com/v2/prices/" + sym + "-USD/spot");
  if (!r.ok) return null;
  var j = await r.json();
  var n = Number(j && j.data && j.data.amount);
  return isFinite(n) ? n : null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    var pair = await Promise.all([
      spot("BTC"), spot("ETH"), spot("SOL")
    ]);
    return res.status(200).json({
      asof: new Date().toISOString(),
      source: "Coinbase public spot",
      BTC: pair[0],
      ETH: pair[1],
      SOL: pair[2]
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
