/* Presenter view = speaker notes + clicker. One page, two transports:
 *   local  (opened from the deck with S, or presenter.html?local): BroadcastChannel "sl5-deck", same browser.
 *   remote (phone, presenter.html on any device): through the poll server, needs the admin token.
 * Layout follows screen size: previews (now / next) only on wide screens.
 * Slide data (titles, planned times, clicks, notes) is parsed from index.html, so notes have one source.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };
  var params = new URLSearchParams(location.search);
  var base = SL5Config.base;
  var wantLocal = (params.has("local") || !!window.opener) && !params.has("remote");
  var P = {}; SL5_POLLS.POLLS.forEach(function (x) { P[x.id] = x; });

  // ---------- slides from index.html ----------
  var slides = [], byId = {};
  function parseAt(s) { var m = /^(\d+):(\d\d)$/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; }
  function loadSlides() {
    return fetch("index.html", { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      slides = [].slice.call(doc.querySelectorAll("section.slide")).map(function (el) {
        var n = el.querySelector(".notes");
        return { id: el.id, title: el.dataset.title || "", at: el.dataset.at || "", t: parseAt(el.dataset.at),
          clicks: +(el.dataset.clicks || 0), clicksCut: el.dataset.clicksCut !== undefined ? +el.dataset.clicksCut : null,
          drop: el.dataset.cut === "drop", notes: n ? n.innerHTML.trim() : "" };
      });
      slides.forEach(function (s, i) { // planned duration = gap to the next slide's planned start
        var nx = slides[i + 1]; s.dur = s.t !== null && nx && nx.t !== null ? nx.t - s.t : 0; byId[s.id] = s;
      });
    });
  }
  function visible(cut) { return slides.filter(function (s) { return !(cut && s.drop); }); }
  function clicksOf(s, cut) { return cut && s.clicksCut !== null ? s.clicksCut : s.clicks; }
  function plannedOf(s, cut) { // cut mode: dropped slides' time comes off everything after them
    if (s.t === null) return null;
    var off = 0;
    if (cut) for (var i = 0; i < slides.length && slides[i] !== s; i++) if (slides[i].drop) off += slides[i].dur;
    return s.t - off;
  }

  // ---------- state ----------
  var st = null, lastSeen = 0, prevId = null, localSeen = 0, deckAge = 0;
  function isLocal() { return Date.now() - localSeen < 5000; } // a deck in this browser answers on the channel

  function onState(d) {
    if (!d || !d.id) return;
    lastSeen = Date.now();
    var changed = !st || st.id !== d.id || st.step !== d.step || st.cut !== d.cut || st.black !== d.black;
    if (st && st.id === "s0" && d.id !== "s0" && !d.black) startTimer(); // talk starts when you leave the title slide
    st = { id: d.id, step: d.step | 0, cut: !!d.cut, black: !!d.black };
    if (changed) render();
  }

  // ---------- transports ----------
  var ch = "BroadcastChannel" in window ? new BroadcastChannel("sl5-deck") : null;
  var token = null, remoteOn = false;
  if (ch) ch.onmessage = function (e) { var m = e.data; if (m && m.type === "state") { localSeen = Date.now(); onState(m); } };
  function send(cmd, arg) {
    flash(cmd);
    if (ch && (isLocal() || !token)) return ch.postMessage({ type: "cmd", cmd: cmd, arg: arg });
    if (!base || !token) return;
    fetch(base + "/api/admin/remote", {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify({ cmd: cmd, arg: arg }),
    }).then(function (r) { if (r.status === 401) needAuth("Token rejected"); }).catch(function () {});
  }
  function startRemote() { if (!remoteOn) { remoteOn = true; pollRemote(); } }
  function pollRemote() {
    if (!token || isLocal()) { remoteOn = false; return; }
    fetch(base + "/api/admin/deck", { headers: { authorization: "Bearer " + token }, cache: "no-store" })
      .then(function (r) {
        if (r.status === 401) { needAuth("Token rejected"); throw 0; }
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        if (!d) return;
        lastSeen = Date.now(); hideAuth();
        deckAge = d.deck && d.now ? d.now - d.deck.ts : 0;
        if (d.deck) onState(d.deck); else if (!st) $("p-title").textContent = "deck not connected yet (it needs the admin key: K)";
      })
      .catch(function () {})
      .then(function () { if (token && !isLocal()) setTimeout(pollRemote, document.hidden ? 4000 : 1000); else remoteOn = false; });
  }

  function needAuth(err) {
    token = null; LS.set("sl5:remote-token", null);
    $("p-auth").hidden = false; $("p-tok-err").textContent = err || "";
    setTimeout(function () { $("p-tok").focus(); }, 50);
  }
  function hideAuth() { $("p-auth").hidden = true; $("p-tok-err").textContent = ""; }
  $("p-tok-go").onclick = function () {
    var v = $("p-tok").value.trim(); if (!v) return;
    token = v; LS.set("sl5:remote-token", v); $("p-tok-err").textContent = "checking…"; startRemote();
  };
  $("p-tok").addEventListener("keydown", function (e) { if (e.key === "Enter") $("p-tok-go").onclick(); });

  // ---------- timer ----------
  var t0 = +LS.get("sl5:t0") || null;
  function startTimer() { t0 = Date.now(); LS.set("sl5:t0", String(t0)); tickTimer(); }
  function fmt(sec) { var s = Math.abs(Math.round(sec)); return (sec < 0 ? "−" : "") + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  $("p-timer").onclick = function () {
    this.blur();
    if (!t0 || confirm("Restart the talk timer at 0:00?")) startTimer();
  };
  function tickTimer() {
    var tEl = $("p-timer"), dEl = $("p-delta");
    if (!t0) { tEl.textContent = "0:00"; dEl.textContent = "starts after S0"; dEl.className = "pill mut"; return; }
    var el = (Date.now() - t0) / 1000;
    tEl.textContent = fmt(el);
    var s = st && byId[st.id]; if (!s) { dEl.textContent = ""; return; }
    var list = visible(st.cut), i = list.indexOf(s), nx = list[i + 1];
    var p0 = plannedOf(s, st.cut), p1 = nx ? plannedOf(nx, st.cut) : null;
    if (p0 === null) { dEl.textContent = ""; dEl.className = "pill"; return; }
    if (p1 !== null && el > p1) { dEl.textContent = "+" + fmt(el - p1) + " behind"; dEl.className = "pill behind"; }
    else if (el < p0 - 5) { dEl.textContent = fmt(p0 - el) + " ahead"; dEl.className = "pill ahead"; }
    else { dEl.textContent = "on time"; dEl.className = "pill"; }
  }
  setInterval(function () { tickTimer(); linkDot(); }, 1000);

  function linkDot() {
    var loc = isLocal(), ok = Date.now() - lastSeen < 6000, silent = !loc && deckAge > 60000; // deck heartbeats every 20s
    var l = $("p-link"); l.className = "pill " + (ok && !silent ? "ok" : "bad");
    l.title = (loc ? "same-browser sync" : "via poll server") + (!ok ? ": no contact" : silent ? ": deck silent " + Math.round(deckAge / 1000) + "s" : ": connected");
    l.textContent = (loc ? "● local" : "● remote") + (silent ? " (deck?)" : "");
  }

  // ---------- previews ----------
  var wide = matchMedia("(min-width: 901px)");
  var shown = { "f-cur": "", "f-nxt": "" };
  function frameSrc(id, step, cut) { return "index.html?thumb&api=off&cut=" + (cut ? "15" : "full") + "#" + id + (step ? "." + step : ""); }
  function setFrame(fid, src) {
    if (!wide.matches || shown[fid] === src) return;
    var f = $(fid), cur = shown[fid];
    // same page, only the #hash differs → in-page jump, no reload
    if (cur && cur.split("#")[0] === src.split("#")[0] && f.contentWindow) {
      try { f.contentWindow.location.hash = src.split("#")[1]; shown[fid] = src; return; } catch (e) {}
    }
    f.src = src; shown[fid] = src;
  }
  function scaleFrames() {
    document.querySelectorAll(".view").forEach(function (v) {
      var f = v.querySelector("iframe"); f.style.transform = "scale(" + v.clientWidth / 1920 + ")";
    });
  }
  if ("ResizeObserver" in window) new ResizeObserver(scaleFrames).observe(document.querySelector(".views"));
  addEventListener("resize", scaleFrames);
  wide.addEventListener && wide.addEventListener("change", function () { shown = { "f-cur": "", "f-nxt": "" }; render(); });

  // ---------- render ----------
  function nextPos() { // where "Next" lands: next click on this slide, or the next slide's step 0
    var list = visible(st.cut), s = byId[st.id], i = list.indexOf(s);
    if (s && st.step < clicksOf(s, st.cut)) return { s: s, step: st.step + 1 };
    return list[i + 1] ? { s: list[i + 1], step: 0 } : null;
  }
  function render() {
    if (!st || !slides.length) return;
    var s = byId[st.id] || { id: st.id, title: "", notes: "", clicks: 0 };
    var nclk = clicksOf(s, st.cut);
    $("p-id").textContent = s.id;
    $("p-title").textContent = s.title;
    $("p-step").textContent = "click " + st.step + "/" + nclk;
    $("p-step").hidden = !nclk;
    var p0 = plannedOf(s, st.cut);
    $("p-planned").textContent = "plan " + (p0 === null ? s.at || "–" : fmt(p0));
    $("p-cut").hidden = !st.cut;
    $("p-black").hidden = !st.black;
    $("b-black").classList.toggle("on", st.black);
    $("b-black").textContent = st.black ? "Unblack" : "Black";
    $("p-notes").innerHTML = s.notes || '<span class="mut">(no notes)</span>';
    if (prevId !== s.id) { $("p-notes").scrollTop = 0; prevId = s.id; }
    var nx = nextPos();
    $("p-next").textContent = nx ? "next: " + (nx.s === s ? "click " + nx.step : nx.s.id + " " + nx.s.title) : "end";
    setFrame("f-cur", frameSrc(s.id, st.step, st.cut));
    if (nx) setFrame("f-nxt", frameSrc(nx.s.id, nx.step, st.cut));
    pollBox(true);
    tickTimer();
    document.title = s.id + " · Presenter";
  }

  // ---------- live poll numbers + which branch line to say ----------
  // per slide: groups to fetch and a function that turns results into lines
  function pct(d, opts) {
    if (!d || !d.total) return null;
    var n = 0; [].concat(opts).forEach(function (i) { n += d.counts[i] || 0; });
    return Math.round((100 * n) / d.total);
  }
  function leader(d) { if (!d || !d.total) return -1; var m = Math.max.apply(null, d.counts); return d.counts.indexOf(m); }
  function nums(id, d) {
    if (!d) return "<span>" + id + ": –</span>";
    return "<span>" + id + " <b>" + d.total + "</b>" + (d.open ? "" : ' <i class="mut">closed</i>') + "</span>";
  }
  var HINTS = {
    s0: { g: ["warm"], f: function (r) { return { nums: nums("warm", r.polls.warm) + "<span>phones <b>" + r["v:warm"] + "</b></span>" }; } },
    s4: { g: ["warm"], f: function (r) {
      var d = r.polls.warm, red = pct(d, 0), blue = pct(d, 1), h = [];
      if (red !== null) h.push(red > blue ? ["say", "Red " + red + "% > blue " + blue + "%: “Okay. I'll keep an eye on my laptop.”"] : ["", "Red " + red + "% ≤ blue " + blue + "%: skip the laptop line"]);
      return { nums: nums("warm", d) + "<span>in the room <b>" + r["v:warm"] + "</b></span>", hints: h };
    } },
    s5: { g: ["A"], f: function (r) { return { nums: nums("A", r.polls.A) }; } },
    s6: { g: ["A"], f: function (r) {
      var d = r.polls.A, imp = pct(d, 3), ld = leader(d), h = [];
      if (imp === null) return { nums: nums("A", d), hints: [["", "No votes: show of hands"]] };
      h.push(["", "Leading: #" + (ld + 1) + " " + P.A.o[ld] + " (" + pct(d, ld) + "%)"]);
      if (imp > 10) h.push(["say", "Impossible " + imp + "%: “To the " + imp + "% who said impossible: I'd love to buy you a drink after. I also have a bridge to sell you.”"]);
      else h.push(["say", "Impossible " + imp + "%: say “almost nobody voted for #4”"]);
      if (ld === 2) h.push(["say", "Most picked $1B: “You're generous to the labs. Let's see if they agree.”"]);
      return { nums: nums("A", d), hints: h };
    } },
    s13: { g: ["BC"], f: function (r) { return { nums: nums("B1", r.polls.B1) + nums("B2", r.polls.B2) + nums("C", r.polls.C) + "<span>phones <b>" + r["v:BC"] + "</b></span>" }; } },
    s14: { g: ["BC"], f: function (r) {
      var b1 = r.polls.B1, b2 = r.polls.B2, x = pct(b1, [2, 3]), y = pct(b2, 1), never = pct(b2, 2), h = [];
      if (x !== null || y !== null) h.push(["", "X (heavy slowdown) = " + (x === null ? "–" : x + "%") + " · Y (Just-in-Time) = " + (y === null ? "–" : y + "%")]);
      if (leader(b2) === 0) h.push(["say", "“Start right now” leads: “Most of you would start now. Your future CFO disagrees. Let's see why you're right.”"]);
      if (never !== null && never > 15) h.push(["say", "Never " + never + "%: “And to the " + never + "% who said never: at least you're honest.”"]);
      return { nums: nums("B1", b1) + nums("B2", b2), hints: h };
    } },
    s17: { g: ["BC"], f: function (r) {
      var d = r.polls.C, x = pct(d, [0, 1]), h = [];
      if (x !== null) h.push(["", "X (high + moderate) = " + x + "%"]);
      if (leader(d) === 0) h.push(["say", "Mostly “High”: “Most of you think it already happened. Maybe. But today they don't even need to steal: there's a cheaper way.”"]);
      if (leader(d) === 2) h.push(["say", "Mostly “Low”: “Most of you think it hasn't happened yet. Probably right, because today there's a cheaper way.”"]);
      return { nums: nums("C", d), hints: h };
    } },
  };
  var pollT = null, pollFor = null;
  function pollBox(entered) {
    var box = $("p-poll"), cfg = st && HINTS[st.id];
    if (entered && pollFor === (st && st.id)) return; // same slide, the timer keeps it fresh
    clearTimeout(pollT); pollFor = st && st.id;
    if (!cfg) { box.hidden = true; return; }
    if (!base) { box.hidden = false; box.innerHTML = '<div class="hint">Offline: show of hands</div>'; return; }
    var id = st.id;
    Promise.all(cfg.g.map(function (g) {
      return fetch(base + "/api/results?grp=" + g, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { return [g, d]; });
    })).then(function (rs) {
      if (!st || st.id !== id) return;
      var res = { polls: {} };
      rs.forEach(function (x) { Object.assign(res.polls, x[1].polls); res["v:" + x[0]] = x[1].voters; });
      var o = cfg.f(res);
      box.hidden = false;
      box.innerHTML = '<div class="nums">' + o.nums + "</div>" + (o.hints || []).map(function (h) {
        return '<div class="hint' + (h[0] ? " " + h[0] : "") + '">' + esc(h[1]) + "</div>";
      }).join("");
    }).catch(function () {
      if (!st || st.id !== id) return;
      box.hidden = false; box.innerHTML = '<div class="hint red">Poll server unreachable: show of hands</div>';
    }).then(function () { if (st && st.id === id) pollT = setTimeout(function () { pollFor = null; pollBox(false); }, document.hidden ? 6000 : 2000); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- jump list (tap the slide id) ----------
  function jump() {
    if (!st) return;
    var ov = document.createElement("div"); ov.className = "jump";
    ov.innerHTML = '<div class="jump-list">' + visible(st.cut).map(function (s) {
      return '<button data-id="' + s.id + '"' + (s.id === st.id ? ' class="cur"' : "") + "><b>" + s.id + "</b> " + esc(s.title) + ' <span class="mut">' + esc(s.at) + "</span></button>";
    }).join("") + '</div><button class="jump-x">Cancel</button>';
    ov.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.id) send("go", b.dataset.id);
      ov.remove();
    };
    document.body.appendChild(ov);
    var c = ov.querySelector(".cur"); if (c) c.scrollIntoView({ block: "center" });
  }
  $("p-id").parentNode.onclick = jump;

  // ---------- controls ----------
  function flash(cmd) {
    var b = { next: "b-next", prev: "b-prev", black: "b-black" }[cmd]; if (!b) return;
    b = $(b); b.classList.remove("sent"); void b.offsetWidth; b.classList.add("sent");
  }
  // blur after tap, so a clicker's Space/Enter can't also "press" the focused button (double step)
  $("b-next").onclick = function () { this.blur(); send("next"); };
  $("b-prev").onclick = function () { this.blur(); send("prev"); };
  $("b-black").onclick = function () { this.blur(); send("black"); };
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter") send("next");
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") send("prev");
    else if (k === "b" || k === "B" || k === "." || k === "w" || k === "W") send("black");
    else if (k === "c" || k === "C") send("cut");
    else if (k === "g" || k === "G") jump();
    else return;
    e.preventDefault();
  });

  // ---------- start ----------
  // Mode: a deck in this browser (same laptop) answers "hello" on the channel within ~1s → local.
  // Otherwise (phone, other device) → remote via the poll server with the admin token.
  linkDot(); tickTimer();
  var km = /key=([^&]+)/.exec(location.hash);
  if (km) { LS.set("sl5:remote-token", decodeURIComponent(km[1])); history.replaceState(null, "", location.pathname + location.search); }
  loadSlides().then(function () {
    if (st) render();
    if (ch) ch.postMessage({ type: "cmd", cmd: "hello" });
    if (!st) $("p-title").textContent = "waiting for the deck…";
    setTimeout(function () {
      if (isLocal()) return;
      if (wantLocal || !base) {
        if (!st) $("p-title").textContent = base ? "waiting for the deck (same browser)…" : "offline: open the presenter from the deck (S)";
        return;
      }
      token = LS.get("sl5:remote-token");
      if (token) startRemote(); else needAuth("");
    }, 1200);
    // local deck went away (e.g. presenter opened on the laptop, deck tab closed) → fall back to remote if we have a token
    setInterval(function () { if (!isLocal() && !wantLocal && base && LS.get("sl5:remote-token") && !remoteOn) { token = LS.get("sl5:remote-token"); startRemote(); } }, 3000);
  }).catch(function (e) { $("p-title").textContent = "could not load slides: " + e; });
})();
