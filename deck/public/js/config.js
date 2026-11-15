/* Shared by the deck and the presenter page: which poll server to talk to.
 * ?api=live|dev|off|<url>; default: live on sl5-deck.* hosts, dev on previews/localhost, off from file:// (offline copy). */
(function () {
  "use strict";
  var API = { live: "https://vote.nitzpo.workers.dev", dev: "https://vote-dev.nitzpo.workers.dev" };
  var params = new URLSearchParams(location.search), p = params.get("api");
  var base = p === "off" || window.SL5_OFFLINE ? null : p === "live" || p === "dev" ? API[p] : p ? p.replace(/\/$/, "")
    : location.protocol === "file:" ? null : /^sl5-deck\./.test(location.hostname) ? API.live : API.dev;
  // fetch that gives up: a hung request (dead uplink) must not freeze polling loops or the show-of-hands fallback
  window.SL5Fetch = function (url, opts, ms) {
    return new Promise(function (res, rej) {
      var c = "AbortController" in window ? new AbortController() : null;
      var t = setTimeout(function () { if (c) c.abort(); rej(new Error("timeout")); }, ms || 3500);
      fetch(url, c ? Object.assign({ signal: c.signal }, opts || {}) : opts).then(function (r) { clearTimeout(t); res(r); }, function (e) { clearTimeout(t); rej(e); });
    });
  };
  // shortcut key, independent of the keyboard layout: on a Hebrew layout B arrives as "נ" and "." as "ץ" (dead shortcuts,
  // incl. a clicker's black button); fall back to the physical key. Latin layouts (incl. AZERTY) keep e.key.
  window.SL5Key = function (e) {
    var k = e.key;
    if (k && k.length === 1 && !/[a-z.]/i.test(k)) {
      var c = e.code || "";
      if (/^Key[A-Z]$/.test(c)) k = c.slice(3).toLowerCase(); else if (c === "Period") k = ".";
    }
    return k;
  };
  window.SL5Config = { API: API, base: base, phoneUrl: base || API.live, phoneHost: (base || API.live).replace(/^https?:\/\//, "") };
})();
