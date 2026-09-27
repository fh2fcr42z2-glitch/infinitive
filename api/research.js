function lastVal(card) {
  if (!card) return null;
  if (card.value != null) return card.value;
  if (card.value_usd != null) return card.value_usd;
  var spark = card.sparkline && card.sparkline.data;
  if (spark && spark.length) return spark[spark.length - 1][1];
  return null;
}
async function growthepie() {
  var r = await fetch("https://api.growthepie.com/v1/chains/ethereum/overview.json", {
    headers: { "User-Agent": "infinitive-desk" }
  });
  if (!r.ok) throw new Error("gtp " + r.status);
  var j = await r.json();
  var d = j.data || {};
  var rank = d.ranking || {};
  return {
    source: "growthepie.com",
    updated: j.last_updated_utc || null,
    daa: rank.daa ? rank.daa.value : lastVal(d.kpi_cards && d.kpi_cards.daa),
    daa_rank: rank.daa ? rank.daa.rank + "/" + rank.daa.out_of : null,
    fees_usd: rank.fees ? rank.fees.value_usd : null,
    fees_eth: rank.fees ? rank.fees.value_eth : null,
    stables_usd: rank.stables_mcap ? rank.stables_mcap.value_usd : null
  };
}
async function l2beat() {
  var r = await fetch("https://l2beat.com/api/scaling/summary", {
    headers: { "User-Agent": "infinitive-desk" }
  });
  if (!r.ok) throw new Error("l2beat " + r.status);
  var j = await r.json();
  var row = (j.chart && j.chart.data && j.chart.data.length) ? j.chart.data[j.chart.data.length - 1] : null;
  var tvs = row ? row[1] + row[2] + row[3] : null;
  var top = Object.keys(j.projects || {}).map(function (k) {
    var p = j.projects[k];
    var tot = p.tvs && p.tvs.breakdown ? p.tvs.breakdown.total : 0;
    return { name: p.name, slug: p.slug, stage: p.stage, tvs: tot };
  }).sort(function (a, b) { return b.tvs - a.tvs; }).slice(0, 4);
  return { source: "l2beat.com", tvs: tvs, top: top };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
  if (req.method === "OPTIONS") return res.status(200).end();
  var out = { asof: new Date().toISOString(), call: "Research tape. Not a fill. ETH gate $2,900." };
  try { out.gtp = await growthepie(); } catch (e) { out.gtp = { error: String(e.message || e) }; }
  try { out.l2 = await l2beat(); } catch (e) { out.l2 = { error: String(e.message || e) }; }
  out.beacon = {
    source: "beaconcha.in",
    note: "V2 API needs a free key. Stake % is on /api/eth from ultrasound.",
    url: "https://beaconcha.in"
  };
  return res.status(200).json(out);
};
