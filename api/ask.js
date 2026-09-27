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
    "You are Houston on Infinitive / Ghost Desk.",
    "Paper and research only. Never place or imply a live broker order.",
    "First line is the call: BUY (size + invalidation) or HOLD or DO NOT ADD or DO NOT BUY or LOOK.",
    "Then at most 5 short numbered lines. Cite cb.json / rh.json / research.json. Do not invent balances.",
    "ETH gate $2,900: HOLD / DO NOT BUY under it. DRV: DO NOT ADD.",
    "No preamble. No recap. No closer. Headlines are not tickets."
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
      return res.status(500).json({ error: data.error && data.error.message ? data.error.message : "xAI error", fallback: true });
    }
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return res.status(200).json({ answer: text || "No answer.", model: "grok-4" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e), fallback: true });
  }
};
