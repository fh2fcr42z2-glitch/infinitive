function gwei(wei) {
  var n = Number(wei);
  if (!isFinite(n)) return null;
  return n / 1e9;
}
function read(d) {
  var txs = d.transactions_24h;
  var gas = gwei(d.mempool_median_gas_price);
  var mem = d.mempool_transactions;
  var busy = (txs != null && txs > 1.6e6) || (gas != null && gas >= 5);
  var quiet = gas != null && gas < 1 && (mem == null || mem < 800);
  var line = quiet
    ? "Chain is quiet. Cheap gas is not a buy signal."
    : busy
      ? "Chain is busy. Fees up. Still not a ticket."
      : "Chain is normal. Activity \u2260 price.";
  return {
    asof: new Date().toISOString(),
    source: "blockchair.com/ethereum/stats",
    block: d.best_block_height || d.blocks || null,
    txs_24h: txs || null,
    blocks_24h: d.blocks_24h || null,
    mempool: mem || null,
    gas_gwei: gas != null ? Math.round(gas * 1000) / 1000 : null,
    tps_mempool: d.mempool_tps || null,
    line: line,
    call: "LOOK. On-chain heat does not clear the $2,900 ETH gate."
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    var r = await fetch("https://api.blockchair.com/ethereum/stats", {
      headers: { "User-Agent": "infinitive-desk" }
    });
    if (!r.ok) return res.status(r.status).json({ error: "blockchair " + r.status });
    var j = await r.json();
    return res.status(200).json(read(j.data || j));
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
