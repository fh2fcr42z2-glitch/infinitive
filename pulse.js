window.LIVE_PX = window.LIVE_PX || {};
function pulseStamp(iso) {
  var el = document.getElementById("mark-src");
  if (!el) return;
  var t = iso ? new Date(iso) : new Date();
  var hh = String(t.getHours()).padStart(2, "0");
  var mm = String(t.getMinutes()).padStart(2, "0");
  var ss = String(t.getSeconds()).padStart(2, "0");
  el.textContent = "CB live " + hh + ":" + mm + ":" + ss;
}
function applyMarks(j) {
  if (!j) return;
  ["BTC","ETH","SOL","AERO","ENA","DRV","PUMP","XPL"].forEach(function (k) {
    if (j[k] != null) window.LIVE_PX[k] = j[k];
  });
  if (typeof A !== "undefined") {
    if (j.BTC) A.BTC.px = j.BTC;
    if (j.ETH) A.ETH.px = j.ETH;
    if (typeof render === "function") render(true);
    else if (typeof drawQm === "function") drawQm();
  }
  if (typeof refreshLiveMarks === "function") refreshLiveMarks();
  pulseStamp(j.asof);
}
function pulseMarks() {
  fetch("/api/marks?t=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(applyMarks)
    .catch(function () {});
}
function pulseFiles() {
  if (typeof drawLive === "function") drawLive();
  if (typeof drawPublicTape === "function") drawPublicTape();
}
pulseMarks();
setInterval(pulseMarks, 15000);
setInterval(pulseFiles, 120000);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) { pulseMarks(); pulseFiles(); }
});
