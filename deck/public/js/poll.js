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
  var thumb = Deck.thumb; // presenter previews never talk to the poll server
  var base = thumb ? null : SL5Config.base;
  var phoneHost = SL5Config.phoneHost, phoneUrl = SL5Config.phoneUrl;
  // offline copy: no vote QR/URL (votes would go nowhere visible); links QR stays
  if (window.SL5_OFFLINE || location.protocol === "file:") document.body.classList.add("is-offline");

  // admin key from #key=… / ?key=… (then stripped from the URL) or localStorage
  var urlKey = thumb ? null : SL5UrlKey();
  if (urlKey) LS.set("sl5:deckkey", urlKey);
  var key = LS.get("sl5:deckkey");
  Deck.listen("urlkey", function (k) { // #key=… added to the URL of the open deck (no reload)
    key = k; LS.set("sl5:deckkey", k); Deck.warn("");
    repush(Deck.current().el);
  });
  Deck.listen("key", function (k) {
    if (k === "k" || k === "K") {
      Deck.ask("Admin key for " + (base || "(offline)"), { password: true, hint: "Enter = save · empty = remove · Esc = cancel" }).then(function (v) {
        if (v === null) return;
        key = v.trim() || null; LS.set("sl5:deckkey", key);
        if (!key) return Deck.toast("Admin key removed");
        Deck.warn(""); Deck.toast("Admin key saved");
        repush(Deck.current().el); // the push that failed without a key (S0 on load) happens now
      });
    }
    if (k === "h" || k === "H") { var hs = document.body.classList.toggle("show-hands"); Deck.toast(hs ? "Show-of-hands mode" : "Live polls"); }
    if (k === "a" || k === "A") { if (base) window.open(base + "/admin", "_blank"); else Deck.toast("Offline: no admin page"); }
    if (k === "p" || k === "P") repush(Deck.current().el); // re-push what phones should show at this slide
  });

  function admin(path, body) { // resolves true only if the server accepted it
    if (!base) return Promise.resolve(false);
    if (!key) { Deck.warn("No admin key (press K): phones not switched"); return Promise.resolve(false); }
    return SL5Fetch(base + "/api/admin/" + path, {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + key }, body: JSON.stringify(body),
    }).then(function (r) {
      if (r.status === 401) Deck.warn("Admin key rejected (press K)");
      else if (!r.ok) Deck.warn("Poll server error " + r.status);
      else if (path !== "deck") Deck.warn(""); // deck heartbeats must not clear a failed poll switch
      return r.ok;
    }).catch(function () { Deck.warn("Poll server unreachable"); return false; });
  }
  // close first, then set current: both read-modify-write `open` server-side, so in parallel the
  // close can be overwritten (S5: warm would stay open)
  function pollActions(el) {
    var p = el.dataset.pollClose ? admin("open", { ids: el.dataset.pollClose.split(","), open: false }) : Promise.resolve();
    return p.then(function () { if (el.dataset.pollCurrent) return admin("current", { current: el.dataset.pollCurrent }); });
  }
  // What phones should show at a slide, as if the deck had been walked forward from S0: the last data-poll-current
  // up to here, with that group's polls open minus any data-poll-close since. Used for P, a forward jump, first load.
  var SLIDES = [].slice.call(document.querySelectorAll("section.slide"));
  function effective(el) {
    var cur = null, closed = [], i = SLIDES.indexOf(el);
    for (var j = 0; j <= i; j++) {
      var s = SLIDES[j];
      if (s.dataset.pollCurrent) { cur = s.dataset.pollCurrent; closed = []; }
      if (s.dataset.pollClose) closed = closed.concat(s.dataset.pollClose.split(","));
    }
    var open = D.POLLS.filter(function (p) { return p.grp === cur && closed.indexOf(p.id) < 0; }).map(function (p) { return p.id; });
    return { cur: cur || "idle", shut: D.POLLS.map(function (p) { return p.id; }).filter(function (id) { return open.indexOf(id) < 0; }) };
  }
  function applyEffective(el) {
    var e = effective(el);
    return admin("current", { current: e.cur }).then(function (ok) { return ok && e.shut.length ? admin("open", { ids: e.shut, open: false }) : ok; })
      .then(function (ok) { return { ok: ok, cur: e.cur }; });
  }
  function repush(el) {
    if (!base) return Deck.toast("Offline copy: no phones");
    if (!key) { Deck.warn("No admin key (press K): phones not switched"); return Deck.toast("Phones NOT switched: no admin key (press K)"); }
    applyEffective(el).then(function (r) { Deck.toast(r.ok ? "Phones → " + r.cur : "Phones NOT switched: see the warning"); });
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

  function setText(x, v) { // update a counter; pulse it when the number goes up
    if (x.textContent === v) return;
    var grew = parseInt(v, 10) > parseInt(x.textContent, 10);
    x.textContent = v;
    if (grew) { x.classList.remove("bump"); void x.offsetWidth; x.classList.add("bump"); }
  }

  function pollData(res, id) { return res && res.polls ? res.polls[id] : undefined; }

  function render(el, res) {
    el.querySelectorAll("[data-results]").forEach(function (box) {
      var id = box.dataset.results; renderBars(box, POLL[id], pollData(res, id));
    });
    el.querySelectorAll("[data-total]").forEach(function (x) {
      var d = pollData(res, x.dataset.total), u = x.dataset.unit;
      setText(x, !d ? "–" : u ? d.total + " " + u + (d.total === 1 ? "" : "s") : String(d.total));
    });
    Deck.emit("results", { el: el, res: res }); // custom renderers (e.g. S6 ladder rows)
    el.querySelectorAll("[data-voters]").forEach(function (x) {
      var g = groupOf(x.dataset.voters), d = res && res["v:" + g];
      setText(x, d == null ? "–" : String(d)); // null: no results yet (cache empty)
    });
  }

  function fetchGroups(grps) {
    // one request per group so per-group voter counts stay correct
    return Promise.all(grps.map(function (g) {
      return SL5Fetch(base + "/api/results?grp=" + g, { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
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
    if (!base) { if (!thumb) el.classList.add("nodata"); return; }
    fetchGroups(grps).then(function (res) {
      if (el !== activeEl) return;
      lastOk = Date.now(); cache = res; el.classList.remove("nodata"); render(el, res);
    }).catch(function () {
      if (el !== activeEl) return;
      if (Date.now() - Math.max(lastOk, enteredAt) > 5000) el.classList.add("nodata");
    }).then(function () { if (el === activeEl) timer = setTimeout(tick, document.hidden ? 5000 : 1000); });
  }

  var lastIdx = -1; // -1 = first load
  Deck.onChange(function (el, step, dir) {
    if (el !== activeEl) {
      var idx = SLIDES.indexOf(el);
      activeEl = el; enteredAt = Date.now(); clearTimeout(timer);
      // Phones follow the deck forward only. Walking forward: this slide's own actions. First load or a forward jump
      // (G, presenter jump list): catch up to the slide's effective state. Backward (Home, ←, jump back): phones stay.
      if (dir === 1) pollActions(el);
      // first load: toast the result ("Phones → warm" / "NOT switched: no admin key"), so a deck without a key is obvious
      else if (dir === 0 && idx > lastIdx) { if (lastIdx < 0 && base) repush(el); else applyEffective(el); }
      lastIdx = idx;
      if (liveEls(el).length) { try { render(el, cache); } catch (e) { console.error(e); } tick(); }
    }
  });

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  window.SL5Poll = { base: base, phoneUrl: phoneUrl, admin: admin, key: function () { return key; },
    setCurrent: function (c) { return admin("current", { current: c }); } };
  fillStatic();
})();
