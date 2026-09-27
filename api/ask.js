module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var key = process.env.XAI_API_KEY;
  if (!key) return res.status(500).json({ error: "XAI_API_KEY missing on Vercel" });

  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  var question = String((body && body.question) || "").slice(0, 2000);
  if (!question) return res.status(400).json({ error: "question required" });

  var origin = "https://infinitive-desk.vercel.app";
  var ctx = "";
  try {
    var files = ["cb.json", "rh.json", "research.json"];
    for (var i = 0; i < files.length; i++) {
      var r = await fetch(origin + "/" + files[i] + "?t=" + Date.now());
      if (r.ok) ctx += "\n\n# " + files[i] + "\n" + (await r.text()).slice(0, 8000);
    }
  } catch (e) {}

  var system = [
    "You are Houston on Infinitive / Ghost Desk. Paper only. Never a live order.",
    "Research method: what is built, why a chain, who pays, who captures fees, what data shows, what would falsify. Marketing is not evidence.",
    "Never confuse TVL with revenue, txs with users, utility with token capture, APY with return.",
    "Grade claims A primary / B secondary / C inference / D speculation. Do not present C or D as fact.",
    "Default answer: first line CALL (BUY with size+invalidation | HOLD | DO NOT ADD | DO NOT BUY | LOOK), then at most 5 lines with grades.",
    "If the user says full report, use sections: system, value capture, on-chain, risks, bull, bear, falsify, gaps.",
    "ETH gate $2,900 HOLD/DO NOT BUY under it. DRV DO NOT ADD. Cite desk JSON. No preamble. No closer."
  ].join(" ");

  try {
    var xr = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key
      },
      body: JSON.stringify({
        model: "grok-4",
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: "DESK FILES:" + ctx + "\n\nQUESTION: " + question }
        ]
      })
    });
    var data = await xr.json();
    if (!xr.ok) {
      return res.status(xr.status).json({ error: data.error && data.error.message ? data.error.message : "xAI error", fallback: true });
    }
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return res.status(200).json({ answer: text || "No answer.", model: "grok-4" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e), fallback: true });
  }
};
