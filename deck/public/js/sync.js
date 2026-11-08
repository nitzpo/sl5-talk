/* Deck ↔ presenter sync.
 * Same laptop (presenter window opened with S): BroadcastChannel "sl5-deck" (in-browser, instant, no network).
 * Phone remote: through the poll server (needs the admin key): the deck POSTs its position to /api/admin/deck and
 * polls /api/admin/remote for Next/Back/Black/Go commands (~1 req/s while a key is set).
 * Messages: {type:"state", id, step, cut, black} deck → presenter; {type:"cmd", cmd, arg} presenter → deck.
 */
(function () {
  "use strict";
  if (Deck.thumb) return;
  var ch = "BroadcastChannel" in window ? new BroadcastChannel("sl5-deck") : null;

  function state() {
    var c = Deck.current();
    return { type: "state", id: c.el ? c.el.id : null, step: c.step, cut: c.cut, black: Deck.isBlack(), ts: Date.now() };
  }
  function run(cmd, arg) {
    if (cmd === "next") Deck.next();
    else if (cmd === "prev") Deck.prev();
    else if (cmd === "black") Deck.black();
    else if (cmd === "go" && arg) Deck.go(arg, 0);
    else if (cmd === "cut") Deck.setCut(!Deck.current().cut);
    else if (cmd === "hello") send();
  }

  // ---- same laptop
  if (ch) ch.onmessage = function (e) { var m = e.data; if (m && m.type === "cmd") run(m.cmd, m.arg); };
  setInterval(function () { if (ch) ch.postMessage(state()); }, 2000); // heartbeat: presenter opened later still syncs

  // ---- phone remote via the poll server
  var since = null, pushT = null;
  function canRemote() { return window.SL5Poll && SL5Poll.base && SL5Poll.key(); }
  function remotePush(s) {
    if (!canRemote()) return;
    clearTimeout(pushT);
    pushT = setTimeout(function () { SL5Poll.admin("deck", { id: s.id, step: s.step, cut: s.cut, black: s.black }); }, 150);
  }
  function pollCmds() {
    if (!canRemote()) { setTimeout(pollCmds, 3000); return; }
    fetch(SL5Poll.base + "/api/admin/remote" + (since === null ? "" : "?since=" + since), { headers: { authorization: "Bearer " + SL5Poll.key() }, cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        if (since !== null) d.cmds.forEach(function (c) { if (Date.now() - c.ts < 15000) run(c.cmd, c.arg); }); // ignore stale commands
        since = d.seq;
      })
      .catch(function () {})
      .then(function () { setTimeout(pollCmds, document.hidden ? 3000 : 1000); });
  }

  function send() { var s = state(); if (ch) ch.postMessage(s); remotePush(s); }
  setInterval(function () { remotePush(state()); }, 20000); // server heartbeat: phone remote can tell "deck silent"
  Deck.onChange(send);
  Deck.listen("black", send);
  Deck.listen("cut", send);
  pollCmds();

  Deck.openPresenter = function () {
    if (window.SL5_OFFLINE) { Deck.toast("Offline copy: no presenter window. N = notes on this screen"); return; }
    var w = window.open("presenter.html?local" + (location.search ? "&" + location.search.slice(1) : ""), "sl5-presenter", "width=1280,height=800");
    if (!w) Deck.toast("Pop-up blocked: allow pop-ups, or open presenter.html");
  };
})();
