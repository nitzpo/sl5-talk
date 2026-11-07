/* Deck ↔ poll backend.
 * Slide attributes:
 *   data-poll-current="warm|A|BC|links"  on enter (forward): set what phones show (needs admin key)
 *   data-poll-close="A,B1"                on enter (forward): close those polls (needs admin key)
 * Elements (live while their slide is active, refreshed every 1s):
 *   .bars[data-results="A"] [data-hl="2,3"] [data-lead]   bar chart; data-lead highlights the leader
 *   [data-total="A"]  vote count · [data-voters="warm"] distinct phones in a group
 *   .qrbox[data-qr="vote|links"]  QR for the phone URL · [data-url="vote|links"] printed URL
 * No data for 5s on a live slide → slide gets .nodata (show-of-hands fallback). Never fakes numbers.
 * API base: ?api=live|dev|<url>; default live on sl5-deck.* hosts, dev elsewhere. ?api=off = offline.
 * Admin key: press K (stored in localStorage on this laptop) or open the deck with #key=<token>.
 */
(function () {
  "use strict";
  var D = window.SL5_POLLS, LS = Deck.LS;
  var API = {
    live: "https://vote.nitzpo.workers.dev",
    dev: "https://vote-dev.nitzpo.workers.dev",
  };
  var p = Deck.params.get("api");
  var base = p === "off" ? null : p === "live" || p === "dev" ? API[p] : p ? p.replace(/\/$/, "")
    : location.protocol === "file:" ? null : /^sl5-deck\./.test(location.hostname) ? API.live : API.dev;
  var phoneHost = base ? base.replace(/^https?:\/\//, "") : "vote.nitzpo.workers.dev";
  var phoneUrl = base || API.live;

  // admin key from #key=… (then stripped from the URL) or localStorage
  var km = /key=([^&]+)/.exec(location.hash);
  if (km) { LS.set("sl5:deckkey", decodeURIComponent(km[1])); history.replaceState(null, "", location.pathname + location.search); }
  var key = LS.get("sl5:deckkey");
  Deck.listen("key", function (k) {
    if (k === "k" || k === "K") {
      var v = prompt("Admin key for " + (base || "(offline)") + " (blank = remove)", "");
      if (v !== null) { key = v.trim() || null; LS.set("sl5:deckkey", key); Deck.toast(key ? "Admin key saved" : "Admin key removed"); }
    }
    if (k === "h" || k === "H") { document.body.classList.toggle("hands"); Deck.toast(document.body.classList.contains("hands") ? "Show-of-hands mode" : "Live polls"); }
    if (k === "a" || k === "A") { if (base) window.open(base + "/admin", "_blank"); else Deck.toast("Offline: no admin page"); }
    if (k === "p" || k === "P") { // force-apply this slide's poll actions (after a reload / jump)
      var el = Deck.current().el;
      if (el.dataset.pollClose) admin("open", { ids: el.dataset.pollClose.split(","), open: false });
      if (el.dataset.pollCurrent) admin("current", { current: el.dataset.pollCurrent }).then(function () { Deck.toast("Phones → " + el.dataset.pollCurrent); });
    }
  });

  function admin(path, body) {
    if (!base) return Promise.resolve();
    if (!key) { Deck.toast("No admin key (press K): phones not switched"); return Promise.resolve(); }
    return fetch(base + "/api/admin/" + path, {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + key }, body: JSON.stringify(body),
    }).then(function (r) {
      if (r.status === 401) Deck.toast("Admin key rejected (press K)");
      else if (!r.ok) Deck.toast("Poll server error " + r.status);
    }).catch(function () { Deck.toast("Poll server unreachable"); });
  }

  // ---------- QR + URLs ----------
  function qrSvg(text) {
    var q = qrcode(0, "M"); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
  }
  function fillStatic() {
    document.querySelectorAll("[data-qr]").forEach(function (el) {
      el.innerHTML = qrSvg(phoneUrl + (el.dataset.qr === "links" ? "/links" : ""));
    });
    document.querySelectorAll("[data-url]").forEach(function (el) {
      el.innerHTML = phoneHost.replace(/^([^.]+)/, "<b>$1</b>") + (el.dataset.url === "links" ? "/links" : "");
    });
  }

  // ---------- live results ----------
  var timer = null, lastOk = 0, enteredAt = 0, activeEl = null, cache = null;
  var POLL = {}; D.POLLS.forEach(function (x) { POLL[x.id] = x; });
  function groupOf(id) { return POLL[id] ? POLL[id].grp : D.GROUPS[id] ? id : null; }

  function liveEls(el) { return el.querySelectorAll("[data-results],[data-total],[data-voters]"); }
  function grpsFor(el) {
    var g = {};
    liveEls(el).forEach(function (x) { var id = x.dataset.results || x.dataset.total || x.dataset.voters; var gg = groupOf(id); if (gg) g[gg] = 1; });
    return Object.keys(g);
  }

  function renderBars(box, poll, data) {
    var counts = data ? data.counts : null, total = data ? data.total : 0;
    var hide = poll.deckHide || [];
    var hl = (box.dataset.hl || "").split(",").filter(Boolean).map(Number);
    var vis = poll.o.map(function (_, i) { return i; }).filter(function (i) { return hide.indexOf(i) < 0; });
    var max = counts ? Math.max.apply(null, vis.map(function (i) { return counts[i]; })) : 0;
    if (!box.firstChild || box.dataset.built !== poll.id) {
      box.innerHTML = vis.map(function (i) {
        return '<div class="bar" data-i="' + i + '"><div class="lbl">' + esc(poll.o[i]) + '</div><div class="track"><div class="fill"></div></div><div class="pct">–</div></div>';
      }).join("") + '<div class="wait"></div>';
      box.dataset.built = poll.id;
      void box.offsetWidth; // start bars from 0 so they animate in
    }
    box.querySelectorAll(".bar").forEach(function (b) {
      var i = +b.dataset.i, n = counts ? counts[i] : 0, pct = total ? Math.round((100 * n) / total) : 0;
      b.querySelector(".fill").style.width = (total ? (100 * n) / total : 0) + "%";
      b.querySelector(".pct").textContent = total ? pct + "%" : "–";
      b.classList.toggle("lead", box.hasAttribute("data-lead") && total > 0 && n === max && n > 0);
      b.classList.toggle("hl", hl.indexOf(i) >= 0);
    });
    box.querySelector(".wait").textContent = total ? total + (total === 1 ? " vote" : " votes") : "Waiting for votes…";
  }

  function pollData(res, id) { return res && res.polls ? res.polls[id] : undefined; }

  function render(el, res) {
    el.querySelectorAll("[data-results]").forEach(function (box) {
      var id = box.dataset.results; renderBars(box, POLL[id], pollData(res, id));
    });
    el.querySelectorAll("[data-total]").forEach(function (x) {
      var d = pollData(res, x.dataset.total), u = x.dataset.unit;
      x.textContent = !d ? "–" : u ? d.total + " " + u + (d.total === 1 ? "" : "s") : d.total;
    });
    Deck.emit("results", { el: el, res: res }); // custom renderers (e.g. S6 ladder rows)
    el.querySelectorAll("[data-voters]").forEach(function (x) {
      var g = groupOf(x.dataset.voters), d = res && res["v:" + g];
      x.textContent = d === undefined ? "–" : d;
    });
  }

  function fetchGroups(grps) {
    // one request per group so per-group voter counts stay correct
    return Promise.all(grps.map(function (g) {
      return fetch(base + "/api/results?grp=" + g, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) { return [g, d]; });
    })).then(function (rs) {
      var out = { polls: {} };
      rs.forEach(function (x) { Object.assign(out.polls, x[1].polls); out["v:" + x[0]] = x[1].voters; });
      return out;
    });
  }

  function tick() {
    clearTimeout(timer);
    var el = activeEl; if (!el) return;
    var grps = grpsFor(el); if (!grps.length) return;
    if (!base) { el.classList.add("nodata"); return; }
    fetchGroups(grps).then(function (res) {
      if (el !== activeEl) return;
      lastOk = Date.now(); cache = res; el.classList.remove("nodata"); render(el, res);
    }).catch(function () {
      if (el !== activeEl) return;
      if (Date.now() - Math.max(lastOk, enteredAt) > 5000) el.classList.add("nodata");
    }).then(function () { if (el === activeEl) timer = setTimeout(tick, document.hidden ? 5000 : 1000); });
  }

  Deck.onChange(function (el, step, dir) {
    if (el !== activeEl) {
      activeEl = el; enteredAt = Date.now(); clearTimeout(timer);
      if (dir === 1 || (dir === 0 && el.hasAttribute("data-poll-onload"))) { // forward navigation (or the pre-show slide on load) drives the phones
        if (el.dataset.pollClose) admin("open", { ids: el.dataset.pollClose.split(","), open: false });
        if (el.dataset.pollCurrent) admin("current", { current: el.dataset.pollCurrent });
      }
      if (liveEls(el).length) { try { render(el, cache); } catch (e) { console.error(e); } tick(); }
    }
  });

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  window.SL5Poll = { base: base, phoneUrl: phoneUrl, admin: admin, setCurrent: function (c) { return admin("current", { current: c }); } };
  fillStatic();
})();
