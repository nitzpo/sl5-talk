/* Per-slide hooks. Rule: forward (dir 1) plays the animation; dir 0/-1 snaps to the step's final state. */
(function () {
  "use strict";

  // ---------- images: <div class="img ph" data-img="01-datacenter"> → img/01-datacenter.webp (placeholder stays if missing)
  var seen = {};
  document.querySelectorAll(".img[data-img]").forEach(function (el) {
    var src = (window.SL5_IMG && SL5_IMG[el.dataset.img]) || "img/" + el.dataset.img + ".webp"; // offline copy: inlined
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
      clear("s1a");
      // Nvidia kiss-cam gag (click 4): stays up until the next click; the clip loops (muted). Thumbs: frozen frame.
      var kv = el.querySelector(".kc-video");
      if (kv) {
        if (s >= 4 && !Deck.thumb) {
          if (dir === 1) { try { kv.currentTime = 0; } catch (e) {} }
          var pp = kv.play(); if (pp && pp.catch) pp.catch(function () {});
        } else kv.pause();
      }
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
    leave: function (el) { clear("s1a"); var kv = el.querySelector(".kc-video"); if (kv) kv.pause(); },
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

  // ---------- S9: researcher types the pip install, output lines follow (forward only)
  Deck.on("s9", {
    step: function (el, s, dir) { // the terminal types on click 1 (the zoom into the side door)
      var cmd = el.querySelector(".s9-cmd"), full = cmd.dataset.text, lines = el.querySelectorAll(".tl1, .tl2, .tl3");
      if (s !== 1 || dir !== 1) {
        if (s >= 1) { clear("s9"); cmd.textContent = full; lines.forEach(function (l) { l.classList.add("shown"); }); }
        return;
      }
      clear("s9");
      lines.forEach(function (l) { l.classList.remove("shown"); });
      cmd.textContent = "";
      var i = 0;
      (function type() {
        if (i <= full.length) { cmd.textContent = full.slice(0, i++); later("s9", i === 1 ? 1200 : 45, type); }
        else lines.forEach(function (l, k) { later("s9", 300 + k * 450, function () { l.classList.add("shown"); }); });
      })();
    },
    leave: function () { clear("s9"); },
  });

  // ---------- S16: simulator capture plays from the start on each entry; paused elsewhere
  Deck.on("s16", {
    enter: function (el) { var v = el.querySelector(".sim-video"); if (v) { try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); } },
    leave: function (el) { var v = el.querySelector(".sim-video"); if (v) v.pause(); },
  });

  // ---------- S10: 47 real blocks (github.com/nitzpo/sl5) → flood of real clauses (SL5 Standard + RAND)
  var S10 = window.SL5_S10, COLORS = ["#5aa9ff", "#b48cff", "#ff8a5c", "#3ddc84", "#ffd166", "#ff5c8a"];
  var tiles = document.getElementById("s10-tiles"), flood = document.getElementById("s10-flood");
  if (S10 && tiles) {
    var k = 0;
    tiles.innerHTML = S10.groups.map(function (g, gi) {
      return '<div class="grp" style="color:' + COLORS[gi] + '"><div class="gname"><span>' + g.name + "</span><span>" + g.blocks.length + "</span></div>" +
        g.blocks.map(function (b) { return '<div class="tile" style="--i:' + (k++) + '">' + b + "</div>"; }).join("") + "</div>";
    }).join("");
  }
  if (S10 && flood) {
    var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var all = S10.clauses.concat(S10.clauses); // twice: enough to cover the screen at flood size
    flood.innerHTML = all.map(function (c) { return '<p style="--d:' + Math.round(rnd() * 1400) + '">' + c.replace(/</g, "&lt;") + "</p>"; }).join("");
  }

  // ---------- S14: the two numbers the speaker quotes (live, computed from the votes)
  Deck.listen("results", function (x) {
    if (x.el.id !== "s14") return;
    var b1 = x.res && x.res.polls && x.res.polls.B1, b2 = x.res && x.res.polls && x.res.polls.B2;
    var pct = function (n, d) { return d ? Math.round((100 * n) / d) + "%" : "–"; };
    document.getElementById("s14-heavy").textContent = b1 ? pct(b1.counts[2] + b1.counts[3], b1.total) : "–";
    document.getElementById("s14-jit").textContent = b2 ? pct(b2.counts[1], b2.total) : "–";
  });
})();
