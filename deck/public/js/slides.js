/* Per-slide hooks. M1: placeholders for S10; animations come in M2/M3. */
(function () {
  "use strict";

  // S0: type out `scp weights.bin`
  Deck.on("s0", {
    enter: function (el) {
      var t = el.querySelector(".type"), full = t.dataset.text, i = 0;
      t.textContent = "";
      clearInterval(t._iv);
      t._iv = setInterval(function () { t.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(t._iv); }, 110);
    },
  });

  // S10: 47 tiles in 6 groups (placeholder names until real block names from nitzpo/sl5 are wired in M3)
  var GROUPS = [
    ["Network", 7, "#5aa9ff"], ["Machine", 9, "#b48cff"], ["Physical", 7, "#ff8a5c"],
    ["Personnel", 9, "#3ddc84"], ["Supply chain", 7, "#ffd166"], ["AI-specific", 8, "#ff5c8a"],
  ];
  var tiles = document.getElementById("s10-tiles");
  if (tiles) {
    tiles.innerHTML = GROUPS.map(function (g) {
      var t = ""; for (var i = 1; i <= g[1]; i++) t += '<div class="tile">' + g[0] + " block " + i + "</div>";
      return '<div class="grp" style="color:' + g[2] + '"><div class="gname">' + g[0] + " · " + g[1] + "</div>" + t + "</div>";
    }).join("");
  }
  var flood = document.getElementById("s10-flood");
  if (flood) {
    var s = "";
    for (var i = 0; i < 600; i++) s += "<p>Requirement " + (i + 1) + ": placeholder clause snippet (real text from the SL5 Standard + RAND in M3).</p>";
    flood.innerHTML = s;
  }
})();
