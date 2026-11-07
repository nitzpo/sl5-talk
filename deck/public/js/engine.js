/* Deck engine: stage scaling, step model, keys, hash routing, 15-min cut, HUD.
 *
 * Slides: <section class="slide" id="s7" data-clicks="3" data-clicks-cut="4" data-cut="drop" data-at="5:15">
 *   - data-clicks: number of clicks (states 0..clicks). data-clicks-cut overrides in 15-min mode.
 *   - data-cut="drop": slide skipped in 15-min mode.
 * Elements: data-in="N" (visible from step N), data-out="M" (hidden from step M),
 *   data-cut-only / data-full-only (shown only in that mode).
 * Hooks: Deck.on("s7", { enter(el, step, dir), step(el, step, dir), leave(el, dir) })
 *   dir: +1 forward, -1 back, 0 jump/reload (render final state of that step instantly).
 */
(function () {
  "use strict";
  var W = 1920, H = 1080;
  var stage = document.getElementById("stage");
  var all = [].slice.call(document.querySelectorAll(".slide"));
  var hooks = {}, listeners = [];
  var params = new URLSearchParams(location.search);
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };
  var cut = params.has("cut") ? params.get("cut") === "15" : LS.get("sl5:cut") === "15";
  var cur = -1, step = 0, list = [];

  function fit() {
    var s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = "translate(-50%,-50%) scale(" + s + ")";
  }

  function buildList() {
    list = all.filter(function (el) { return !(cut && el.dataset.cut === "drop"); });
    document.body.classList.toggle("cut", cut);
  }
  function clicksOf(el) {
    var c = cut && el.dataset.clicksCut !== undefined ? el.dataset.clicksCut : el.dataset.clicks;
    return Math.max(0, parseInt(c || "0", 10));
  }

  function applyStep(el, s) {
    el.setAttribute("data-step", s);
    el.querySelectorAll("[data-in],[data-out]").forEach(function (x) {
      var i = x.hasAttribute("data-in") ? +x.dataset.in : 0;
      var o = x.hasAttribute("data-out") ? +x.dataset.out : Infinity;
      x.classList.toggle("on", s >= i && s < o);
    });
    el.querySelectorAll("[data-cut-only]").forEach(function (x) { x.hidden = !cut; });
    el.querySelectorAll("[data-full-only]").forEach(function (x) { x.hidden = cut; });
  }

  function call(id, name, a, b, c) {
    var h = hooks[id];
    if (h && h[name]) { try { h[name](a, b, c); } catch (e) { console.error(id, name, e); } }
  }

  function go(idx, s, dir) {
    idx = Math.max(0, Math.min(list.length - 1, idx));
    var el = list[idx], prev = list[cur];
    s = Math.max(0, Math.min(clicksOf(el), s));
    var instant = dir === 0;
    if (prev !== el) {
      if (prev) { prev.classList.remove("active"); call(prev.id, "leave", prev, dir); }
      if (instant) el.classList.add("instant");
      el.classList.toggle("fwd", dir === 1); // intro animations play only on forward entry
      applyStep(el, s);
      el.classList.add("active");
      cur = idx; step = s;
      call(el.id, "enter", el, s, dir);
      call(el.id, "step", el, s, dir);
      if (instant) { void el.offsetWidth; requestAnimationFrame(function () { el.classList.remove("instant"); }); }
    } else {
      if (instant) el.classList.add("instant");
      applyStep(el, s);
      step = s;
      call(el.id, "step", el, s, dir);
      if (instant) { void el.offsetWidth; requestAnimationFrame(function () { el.classList.remove("instant"); }); }
    }
    history.replaceState(null, "", "#" + el.id + (s ? "." + s : ""));
    listeners.forEach(function (f) { try { f(el, s, dir); } catch (e) { console.error(e); } });
    hud();
  }

  function next() {
    var el = list[cur];
    if (step < clicksOf(el)) go(cur, step + 1, 1);
    else if (cur < list.length - 1) go(cur + 1, 0, 1);
  }
  function prev() {
    if (step > 0) go(cur, step - 1, -1);
    else if (cur > 0) go(cur - 1, clicksOf(list[cur - 1]), -1);
  }
  function fromHash() {
    var m = /^#([\w-]+)(?:\.(\d+))?/.exec(location.hash);
    if (!m) return go(0, 0, 0);
    var idx = list.findIndex(function (el) { return el.id === m[1]; });
    if (idx < 0) { // slide hidden by cut mode: go to the next visible one
      var i = all.findIndex(function (el) { return el.id === m[1]; });
      idx = i < 0 ? 0 : list.indexOf(all.slice(i).filter(function (el) { return list.indexOf(el) >= 0; })[0]);
      return go(Math.max(0, idx), 0, 0);
    }
    go(idx, +(m[2] || 0), 0);
  }

  function setCut(v) {
    var id = list[cur] && list[cur].id;
    cut = v; LS.set("sl5:cut", v ? "15" : null);
    buildList();
    var idx = list.findIndex(function (el) { return el.id === id; });
    if (idx < 0) { // current slide dropped: move to next visible
      var i = all.findIndex(function (el) { return el.id === id; });
      idx = list.indexOf(all.slice(i).filter(function (el) { return list.indexOf(el) >= 0; })[0]);
    }
    cur = -1;
    go(Math.max(0, idx), 0, 0);
    toast(cut ? "15-min cut ON (" + list.length + " slides)" : "Full 17-min version (" + list.length + " slides)");
  }

  // ---------- HUD: notes + timing (rehearsal helper; presenter window comes later) ----------
  var hudEl = document.getElementById("hud"), t0 = null;
  function fmt(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
  function hud() {
    if (!document.body.classList.contains("hud")) return;
    var el = list[cur]; if (!el) return;
    var n = el.querySelector(".notes");
    var nx = list[cur + 1];
    var el2 = (t0 ? fmt((Date.now() - t0) / 1000) : "0:00");
    hudEl.innerHTML = '<div class="meta"><span>' + el.id + " · step " + step + "/" + clicksOf(el) + "</span><span>planned " + (el.dataset.at || "–") +
      "</span><span>elapsed " + el2 + "</span><span>" + (cut ? "15-MIN CUT" : "FULL") + "</span><span>next: " + (nx ? nx.id + " " + (nx.dataset.title || "") : "end") +
      '</span></div>' + (warning ? '<div class="warn">⚠ ' + warning + '</div>' : "") + '<div class="say">' + (n ? n.innerHTML : "") + "</div>";
  }
  setInterval(function () { if (t0) hud(); }, 1000);

  var toastEl = document.getElementById("toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  // presenter-only warnings (status dot + HUD), never shown big on the projected screen
  var statusEl = document.getElementById("status"), warning = "";
  function warn(msg) {
    warning = msg || ""; statusEl.classList.toggle("warn", !!warning); statusEl.title = warning; hud();
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
  }

  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") { e.preventDefault(); prev(); }
    else if (k === "Home") go(0, 0, 0);
    else if (k === "End") go(list.length - 1, 0, 0);
    else if (k === "f" || k === "F" || k === "F5") { e.preventDefault(); fullscreen(); }
    else if (k === "b" || k === "B" || k === "." || k === "w" || k === "W") document.body.classList.toggle("black");
    else if (k === "n" || k === "N") { document.body.classList.toggle("hud"); hud(); }
    else if (k === "c" || k === "C") setCut(!cut);
    else if (k === "t" || k === "T") { t0 = Date.now(); toast("Timer started"); hud(); }
    else if (k === "g" || k === "G") {
      var id = prompt("Go to slide id (e.g. s7)");
      if (id) { location.hash = "#" + id.trim(); fromHash(); }
    }
    else return;
    Deck.emit("key", k);
  });

  // Mouse: show cursor while moving; click = next (ignore clicks on controls)
  var mt;
  document.addEventListener("mousemove", function () {
    document.body.classList.add("show-cursor"); clearTimeout(mt);
    mt = setTimeout(function () { document.body.classList.remove("show-cursor"); }, 1500);
  });
  stage.addEventListener("click", function (e) { if (!e.target.closest("a,button,input")) next(); });
  addEventListener("resize", fit);
  addEventListener("hashchange", function () {
    var el = list[cur];
    if (!el || location.hash.slice(1) !== el.id + (step ? "." + step : "")) fromHash();
  });

  var bus = {};
  window.Deck = {
    on: function (id, h) { hooks[id] = h; },
    onChange: function (f) { listeners.push(f); },
    current: function () { return { el: list[cur], step: step, idx: cur, cut: cut }; },
    next: next, prev: prev, go: function (id, s) { var i = list.findIndex(function (el) { return el.id === id; }); if (i >= 0) go(i, s || 0, 0); },
    toast: toast, warn: warn, params: params, LS: LS,
    emit: function (ev, x) { (bus[ev] || []).forEach(function (f) { f(x); }); },
    listen: function (ev, f) { (bus[ev] = bus[ev] || []).push(f); },
    start: function () { buildList(); fit(); fromHash(); },
  };
})();
