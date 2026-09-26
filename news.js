var NEWS = { items: [], filter: "all" };

function esc(s) {
  return String(s || "")
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

function drawNews() {
  var items = (NEWS.items || []).filter(function (x) {
    return NEWS.filter === "all" || x.src === NEWS.filter;
  });
  var box = document.getElementById("nlist");
  var n = document.getElementById("ncount");
  if (n) n.textContent = items.length + " headlines";
  if (!box) return;
  if (!items.length) {
    box.innerHTML = "<div class=\"empty\">No headlines in this filter.</div>";
    return;
  }
  var html = "";
  for (var i = 0; i < items.length; i++) {
    var x = items[i];
    var src = esc((x.src || "?").slice(0, 3).toUpperCase());
    html += '<a class="step" href="' + esc(x.url) + '" target="_blank" rel="noopener">';
    html += '<span class="k wait">' + src + "</span>";
    html += "<div><div class=\"t\">" + esc(x.title) + "</div>";
    html += '<div class="why">' + esc(x.src) + " | " + esc(x.date || "") + " | " + esc(x.sum || "") + "</div></div></a>";
  }
  box.innerHTML = html;
}

function loadNews() {
  fetch("news.json?t=" + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error("news.json " + r.status);
      return r.json();
    })
    .then(function (j) {
      NEWS.items = j.items || [];
      var stamp = document.getElementById("stamp");
      var asof = document.getElementById("asof");
      if (stamp && j.stamp) stamp.textContent = j.stamp;
      if (asof) asof.textContent = j.asof || "";
      var fil = document.getElementById("nfilter");
      var srcs = ["all"];
      var seen = {};
      (j.feeds || []).forEach(function (f) {
        if (f.id && !seen[f.id]) { seen[f.id] = 1; srcs.push(f.id); }
      });
      if (fil) {
        fil.innerHTML = srcs.map(function (s) {
          return "<button type=\"button\" data-f=\"" + esc(s) + "\" aria-pressed=\"" + (s === "all") + "\">" + s + "</button>";
        }).join("");
        fil.querySelectorAll("button").forEach(function (b) {
          b.onclick = function () {
            NEWS.filter = b.getAttribute("data-f");
            fil.querySelectorAll("button").forEach(function (x) {
              x.setAttribute("aria-pressed", x === b ? "true" : "false");
            });
            drawNews();
          };
        });
      }
      drawNews();
    })
    .catch(function (e) {
      var box = document.getElementById("nlist");
      if (box) box.innerHTML = "<div class=\"empty\">Could not load news.json</div>";
      console.error(e);
    });
}

loadNews();
