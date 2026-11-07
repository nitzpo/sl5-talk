/* Per-slide hooks. Rule: forward (dir 1) plays the animation; dir 0/-1 snaps to the step's final state. */
(function () {
  "use strict";

  // ---------- images: <div class="img ph" data-img="01-datacenter"> → img/01-datacenter.webp (placeholder stays if missing)
  var seen = {};
  document.querySelectorAll(".img[data-img]").forEach(function (el) {
    var src = "img/" + el.dataset.img + ".webp";
    var p = seen[src] || (seen[src] = new Promise(function (ok) {
      var im = new Image(); im.onload = function () { ok(true); }; im.onerror = function () { ok(false); }; im.src = src;
    }));
    p.then(function (found) { if (found) { el.style.backgroundImage = "url(" + src + ")"; el.classList.remove("ph"); } });
  });

  // ---------- helpers
  var timers = {}; // per-slide cancel callbacks, flushed on step change / leave
  function track(id, cancel) { (timers[id] = timers[id] || []).push(cancel); }
  function later(id, ms, fn) { var h = setTimeout(fn, ms); track(id, function () { clearTimeout(h); }); }
  function clear(id) { (timers[id] || []).forEach(function (c) { c(); }); timers[id] = []; }
  var easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  function tween(id, ms, fn, ease) { // fn(progress 0..1), cancelled by clear(id)
    var t0 = performance.now(), live = true;
    track(id, function () { live = false; });
    (function frame(now) {
      if (!live) return;
      var x = Math.min(1, (now - t0) / ms); fn((ease || easeOut)(x));
      if (x < 1) requestAnimationFrame(frame);
    })(t0);
  }
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

  // ---------- S0: type `scp weights.bin`
  Deck.on("s0", {
    enter: function (el) {
      var t = el.querySelector(".type"), full = t.dataset.text, i = 0;
      clear("s0"); t.textContent = "";
      (function next() { if (i <= full.length) { t.textContent = full.slice(0, i++); later("s0", i === 1 ? 900 : 120, next); } })();
    },
    leave: function () { clear("s0"); },
  });

  // ---------- S1a: counters tick in (count up on forward clicks)
  Deck.on("s1a", {
    step: function (el, s, dir) {
      el.querySelectorAll(".tick").forEach(function (tk) {
        var v = tk.querySelector(".tick-v"), n = +tk.dataset.in;
        if (v.dataset.count) {
          var to = +v.dataset.count;
          if (dir === 1 && n === s) tween("s1a", 1300, function (x) { v.textContent = fmt(to * x); });
          else v.textContent = fmt(to);
        } else if (v.dataset.countText) {
          var word = v.dataset.countText;
          if (dir === 1 && n === s) { // slot-machine flicker, then settle on the word
            var k = 0, chars = "$0123456789";
            (function roll() {
              if (k++ < 9) { v.textContent = word.replace(/./g, function () { return chars[(Math.random() * chars.length) | 0]; }); later("s1a", 55, roll); }
              else v.textContent = word;
            })();
          } else v.textContent = word;
        }
      });
    },
    leave: function () { clear("s1a"); },
  });

  // ---------- S1b: copy stalls → dialog → cursor clicks Delete → copy completes
  function copyTo(el, pct, ms) {
    var fill = el.querySelector(".copyfill"), lbl = el.querySelector(".copy-pct");
    var from = parseFloat(fill.style.width) || 0;
    if (!ms) { fill.style.width = pct + "%"; lbl.textContent = Math.round(pct) + "%"; return; }
    tween("s1b", ms, function (x) { var v = from + (pct - from) * x; fill.style.width = v + "%"; lbl.textContent = Math.round(v) + "%"; });
  }
  Deck.on("s1b", {
    step: function (el, s, dir) {
      clear("s1b");
      var copy = el.querySelector(".copy"), wrap = el.querySelector(".dlg-wrap"), del = el.querySelector(".dlg-del");
      copy.classList.remove("stalled", "done"); wrap.classList.remove("play", "gone"); del.classList.remove("pressed");
      if (s === 0) { copyTo(el, 0); return; }
      if (s === 1) {
        if (dir === 1) { copyTo(el, 0); later("s1b", 700, function () { copyTo(el, 92, 2200); }); later("s1b", 2950, function () { copy.classList.add("stalled"); }); }
        else { copyTo(el, 92); copy.classList.add("stalled"); }
        return;
      }
      // s === 2
      if (dir === 1) {
        copyTo(el, 92); copy.classList.add("stalled");
        wrap.classList.add("play");
        later("s1b", 1750, function () { del.classList.add("pressed"); });
        later("s1b", 1950, function () { wrap.classList.add("gone"); copy.classList.remove("stalled"); copyTo(el, 100, 900); });
        later("s1b", 2900, function () { copy.classList.add("done"); });
      } else { wrap.classList.add("gone"); copyTo(el, 100); copy.classList.add("done"); }
    },
    leave: function () { clear("s1b"); },
  });

  // ---------- S2: jet pops, then flies off (forward only; static otherwise)
  Deck.on("s2", {
    step: function (el, s, dir) {
      clear("s2");
      var jet = el.querySelector(".jet");
      jet.classList.remove("fly");
      if (s === 3 && dir === 1) later("s2", 2600, function () { jet.classList.add("fly"); });
    },
    leave: function () { clear("s2"); },
  });

  // ---------- S3a/S3b: guardrails removal bar
  Deck.on("s3a", {
    step: function (el, s, dir) {
      clear("s3a");
      var fill = el.querySelector(".guard .copyfill"), pct = el.querySelector(".guard-pct");
      var set = function (v) { fill.style.width = v + "%"; pct.textContent = Math.round(v) + "%"; };
      if (s < 2) return set(0);
      if (s === 2 && dir === 1) { set(0); later("s3a", 400, function () { tween("s3a", 2200, function (x) { set(100 * x); }, function (x) { return x; }); }); }
      else set(100);
    },
    leave: function () { clear("s3a"); },
  });

  // ---------- S6: Poll A bars that morph into the RAND ladder (rows carry the room's %)
  Deck.listen("results", function (x) {
    if (x.el.id !== "s6") return;
    var d = x.res && x.res.polls && x.res.polls.A, total = d ? d.total : 0;
    var max = d ? Math.max.apply(null, d.counts) : 0;
    x.el.querySelectorAll(".lr[data-opt]").forEach(function (row) {
      var n = d ? d.counts[+row.dataset.opt] : 0, pct = total ? (100 * n) / total : 0;
      row.querySelector(".lr-fill").style.width = pct + "%";
      row.querySelector(".lr-pct").textContent = total ? Math.round(pct) + "%" : "–";
      row.classList.toggle("lead", total > 0 && n === max && n > 0);
    });
  });

  // ---------- S10: 47 tiles in 6 groups (placeholder names until real block names from nitzpo/sl5 are wired in M3)
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
