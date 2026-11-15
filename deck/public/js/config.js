/* Shared by the deck and the presenter page: which poll server to talk to.
 * ?api=live|dev|off|<url>; default: live on sl5-deck.* hosts, dev on previews/localhost, off from file:// (offline copy). */
(function () {
  "use strict";
  var API = { live: "https://vote.nitzpo.workers.dev", dev: "https://vote-dev.nitzpo.workers.dev" };
  var params = new URLSearchParams(location.search), p = params.get("api");
  var base = p === "off" || window.SL5_OFFLINE ? null : p === "live" || p === "dev" ? API[p] : p ? p.replace(/\/$/, "")
    : location.protocol === "file:" ? null : /^sl5-deck\./.test(location.hostname) ? API.live : API.dev;
  window.SL5Config = { API: API, base: base, phoneUrl: base || API.live, phoneHost: (base || API.live).replace(/^https?:\/\//, "") };
})();
