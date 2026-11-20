// Real-input end-to-end test: every deck shortcut, the poll flow, a phone, both presenter modes, the admin page and the
// offline copy, driven like a person would (key presses, clicks, taps, typing). No URL shortcuts (no #key=) outside 4a: the
// K bug (Nov 15) hid for a week because tests set the admin key through the URL. 4a tests the URL key as a person types it.
//   local only:  node tools/e2e.mjs [--deck http://localhost:8080] [--api http://localhost:8787] [--token devtoken123]
// Start first: poll worker (wrangler dev --env dev --port 8787) + deck (python3 -m http.server 8080 -d deck/public).
// Uses a fresh rehearsal run on the LOCAL worker; refuses non-localhost APIs.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DECK = opt("--deck", "http://localhost:8080"), API = opt("--api", "http://localhost:8787"), TOKEN = opt("--token", "devtoken123");
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(API)) { console.error("refusing: --api must be a local worker"); process.exit(2); }

let fails = 0;
const ok = (name, cond, info = "") => { if (!cond) fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${info ? "  (" + info + ")" : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const admin = (path, body) => fetch(`${API}/api/admin/${path}`, {
  method: body ? "POST" : "GET", headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
  body: body ? JSON.stringify(body) : undefined,
}).then((r) => r.json());
const status = () => admin("status");
async function until(fn, ms = 4000) { const t = Date.now(); for (;;) { const v = await fn(); if (v || Date.now() - t > ms) return v; await sleep(150); } }

// clean slate on the local worker; fast phone polling for the test
await admin("run", { kind: "rehearsal", label: "e2e" });
await admin("config", { poll_ms: 1000 });

const browser = await chromium.launch();
const errors = [];
const watch = (p, tag) => { p.on("pageerror", (e) => errors.push(`${tag}: ${e.message}`)); p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`${tag}: ${m.text()}`); }); };

// ===================== 1. deck shortcuts (laptop) =====================
const lap = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const deck = await lap.newPage(); watch(deck, "deck");
deck.on("dialog", (d) => { errors.push("deck: unexpected dialog " + d.message()); d.dismiss(); });
await deck.goto(`${DECK}/?api=${API}#s4`, { waitUntil: "load" });
await deck.evaluate(() => localStorage.clear());
await deck.reload({ waitUntil: "load" });
const pos = () => deck.evaluate(() => { const c = Deck.current(); return { id: c.el.id, idx: c.idx, step: c.step, cut: c.cut }; });
const at = (id, s = 0) => deck.evaluate(([i, s]) => Deck.go(i, s), [id, s]).then(() => sleep(300));
const press = async (k, ms = 300) => { await deck.keyboard.press(k); await sleep(ms); };
const body = (cls) => deck.evaluate((c) => document.body.classList.contains(c), cls);
const n = (p) => p.idx * 100 + p.step;

// in-page prompt (G, K): type into it like a person
const answer = async (text) => { await deck.waitForSelector(".ask input", { timeout: 2000 }); await deck.keyboard.type(text); await deck.keyboard.press("Enter"); await sleep(400); };
const seesDeck = () => deck.evaluate(() => { // the deck is actually on screen (not just a class toggled)
  const a = document.querySelector(".slide.active"), r = a && a.getBoundingClientRect();
  return getComputedStyle(document.body).display !== "none" && !!r && r.width > 100 && getComputedStyle(a).visibility !== "hidden";
});
const shown = (sel) => deck.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; }, sel);

await press("k", 400);
ok("K asks in a hidden field (no prompt(), no key on the projector)", await deck.evaluate(() => { const i = document.querySelector(".ask input"); return !!i && i.type === "password"; }));
await answer(TOKEN);
ok("K saves the admin key", (await deck.evaluate(() => localStorage.getItem("sl5:deckkey"))) === TOKEN);
for (const k of ["ArrowRight", "Space", "PageDown", "ArrowDown", "Enter"]) {
  await at("s4"); const a = await pos(); await press(k); const b = await pos(); ok(`${k} = next`, n(b) > n(a), `${a.id}.${a.step} → ${b.id}.${b.step}`);
}
for (const k of ["ArrowLeft", "PageUp", "ArrowUp", "Backspace"]) {
  await at("s6"); const a = await pos(); await press(k); const b = await pos(); ok(`${k} = back`, n(b) < n(a), `${a.id}.${a.step} → ${b.id}.${b.step}`);
}
await press("End"); ok("End = last slide", (await pos()).id === (await deck.evaluate(() => [...document.querySelectorAll("section.slide")].pop().id)));
await press("Home"); ok("Home = first slide", (await pos()).idx === 0);
for (const k of ["b", ".", "w"]) { await press(k); const on = await body("black"); await press(k); ok(`${k} toggles black`, on && !(await body("black")) && (await seesDeck())); }
// Hebrew keyboard layout: B arrives as "נ", "." as "ץ" (e.code is the physical key)
const heb = async (key, code) => { await deck.evaluate(([key, code]) => document.dispatchEvent(new KeyboardEvent("keydown", { key, code, bubbles: true })), [key, code]); await sleep(250); };
for (const [key, code] of [["נ", "KeyB"], ["ץ", "Period"]]) { await heb(key, code); const on = await body("black"); await heb(key, code); ok(`Hebrew layout: ${code} toggles black`, on && !(await body("black"))); }
await press("n"); const hud = await body("hud"); await press("n"); ok("N toggles notes HUD", hud && !(await body("hud")));
await press("t", 100); ok("T starts the timer", /Timer/.test(await deck.textContent("#toast")));
const c0 = (await pos()).cut; await press("c"); const c1 = (await pos()).cut; await press("c"); ok("C toggles the 15-min cut", c1 !== c0 && (await pos()).cut === c0);
await at("s4"); await press("h");
ok("H: show-of-hands text visible, deck still on screen", (await body("show-hands")) && (await seesDeck()) && (await shown(".slide.active .hands")));
await press("h"); ok("H again: live bars back", !(await body("show-hands")) && (await shown(".slide.active .bars")));
await press("f", 600); ok("F enters fullscreen", await deck.evaluate(() => !!document.fullscreenElement));
await press("g", 300); await answer("s10.2"); ok("G jumps to a slide (+click)", (p0 => p0.id === "s10" && p0.step === 2)(await pos()));
ok("G keeps fullscreen", await deck.evaluate(() => !!document.fullscreenElement));
await at("s4"); await press("g", 300); await answer("s99"); ok("G with a typo stays put", (await pos()).id === "s4" && /No slide/.test(await deck.textContent("#toast")));
await press("f", 400);
let pop = lap.waitForEvent("page", { timeout: 3000 }).catch(() => null); await press("a"); pop = await pop;
ok("A opens the admin page", !!pop && pop.url().startsWith(`${API}/admin`), pop && pop.url()); if (pop) await pop.close();
await at("s4"); const s4 = await pos(); await deck.mouse.click(700, 500); ok("click = next", n(await pos()) > n(s4));
await at("s5"); await admin("current", { current: "idle" }); await press("p", 900);
ok("P re-pushes the slide's poll state", (await status()).state.current === "A" && /Phones → A/.test(await deck.textContent("#toast")));
await at("s14"); await admin("current", { current: "idle" }); await press("p", 1200);
ok("P on a results slide pushes its effective state (BC)", (await status()).state.current === "BC");
await deck.evaluate(() => localStorage.removeItem("sl5:deckkey")); await deck.reload({ waitUntil: "load" }); await sleep(1200);
await press("p", 600); ok("P without a key says it failed", /NOT switched/.test(await deck.textContent("#toast")));
await press("k", 400); await answer(TOKEN); await sleep(800);
ok("saving the key re-pushes the phones", /Phones → BC/.test(await deck.textContent("#toast")) && (await status()).state.current === "BC");

// ===================== 2. poll flow, forward with real key presses =====================
await admin("current", { current: "idle" }); await admin("open", { ids: ["warm", "A", "B1", "B2", "C"], open: false });
await deck.evaluate(() => { location.hash = "#s0"; }); await deck.reload({ waitUntil: "load" }); await sleep(1500);
ok("S0 on load: phones → warm-up", (await status()).state.current === "warm");
const expect = { s5: ["A", { warm: false, A: true }], s9: [null, { A: false }], s13: ["BC", { B1: true, B2: true, C: true }], s18: [null, { B1: false, B2: false, C: false }], s20: ["links", {}] };
const seen = {};
const phoneCtx = await browser.newContext({ ...devices["iPhone 13"] });
const phone = await phoneCtx.newPage(); watch(phone, "phone");
await phone.goto(`${API}/`, { waitUntil: "load" });
// phone votes in the warm-up
await phone.waitForSelector("button.o[data-i]", { timeout: 4000 }).catch(() => {});
await phone.tap("button.o[data-i='1']").catch(() => {});
ok("phone: tap votes in the warm-up", await until(async () => (await status()).polls.find((p) => p.id === "warm").counts[1] === 1));
for (let i = 0; i < 120; i++) {
  const p = await pos();
  if (expect[p.id] && !seen[p.id] && p.step === 0) {
    seen[p.id] = 1; await sleep(700);
    const st = (await status()).state, [cur, open] = expect[p.id];
    if (cur) ok(`${p.id} (forward): phones → ${cur}`, st.current === cur, st.current);
    for (const [id, want] of Object.entries(open)) ok(`${p.id}: poll ${id} ${want ? "open" : "closed"}`, st.open.includes(id) === want, JSON.stringify(st.open));
    if (p.id === "s5") {
      ok("phone follows to Poll A", await until(() => phone.isVisible("button.o[data-i]").then(async (v) => v && /attacker/i.test(await phone.textContent("body")))));
      await phone.tap("button.o[data-i='2']").catch(() => {});
      ok("phone: tap votes in Poll A", await until(async () => (await status()).polls.find((x) => x.id === "A").counts[2] === 1));
    }
    if (p.id === "s13") { // B1 → B2 → C chain on the phone
      for (const id of ["B1", "B2", "C"]) {
        await phone.waitForSelector("button.o[data-i]:not([disabled])", { timeout: 4000 }).catch(() => {});
        await phone.tap("button.o[data-i='0']").catch(() => {});
        ok(`phone: chain vote ${id}`, await until(async () => (await status()).polls.find((x) => x.id === id).counts[0] === 1));
        await sleep(1200); // the phone moves on to the next open poll by itself (0.7s after a vote)
      }
    }
    if (p.id === "s20") {
      ok("phone lands on the links page", await until(() => phone.evaluate(() => location.pathname === "/links" && /Where to go next/.test(document.body.textContent))));
    }
  }
  if (p.id === "s20") break;
  await press("ArrowRight", 120);
}
for (const id of Object.keys(expect)) ok(`walk reached ${id}`, !!seen[id]);

// backward never moves phones; a forward jump catches them up
await press("Home", 800); ok("Home (back to S0) leaves phones alone", (await status()).state.current === "links");
await press("g", 300); await answer("s13"); await sleep(1000); ok("forward jump (G s13) moves phones → BC", (await status()).state.current === "BC");
await press("g", 300); await answer("s5"); await sleep(1000); ok("backward jump (G s5) leaves phones alone", (await status()).state.current === "BC");

// ===================== 3. presenter: local (S) and remote (phone) =====================
await at("s4");
pop = lap.waitForEvent("page", { timeout: 4000 }).catch(() => null); await press("s"); const pres = await pop;
ok("S opens the presenter view", !!pres && /presenter/.test(pres.url()), pres && pres.url());
if (pres) {
  watch(pres, "presenter"); await pres.waitForLoadState("load"); await sleep(1500);
  ok("presenter (local) shows the deck's slide", (await pres.textContent("#p-id")).trim() === "s4", await pres.textContent("#p-id"));
  let a = await pos(); await pres.click("#b-next"); await sleep(500); ok("presenter (local) Next button", n(await pos()) > n(a));
  a = await pos(); await pres.keyboard.press("ArrowRight"); await sleep(500); ok("presenter (local) → key", n(await pos()) > n(a));
  a = await pos(); await pres.click("#b-prev"); await sleep(500); ok("presenter (local) Back button", n(await pos()) < n(a));
  await pres.click("#b-black"); await sleep(400); const blk = await body("black"); await pres.click("#b-black"); await sleep(400);
  ok("presenter (local) Black button", blk && !(await body("black")));
  const cut0 = (await pos()).cut; await pres.keyboard.press("c"); await sleep(400); ok("presenter (local) C = cut", (await pos()).cut !== cut0); await pres.keyboard.press("c"); await sleep(400);
  await at("s4"); await pres.keyboard.press("h"); await sleep(500);
  ok("presenter (local) H reaches the deck (visible)", (await body("show-hands")) && (await seesDeck()));
  await pres.keyboard.press("h"); await sleep(400);
  await pres.click("#p-id"); await pres.click(".jump-list button[data-id='s12']").catch(() => {}); await sleep(600);
  ok("presenter (local) jump list", (await pos()).id === "s12");
  await pres.close();
}
const rp = await phoneCtx.newPage(); watch(rp, "remote");
await rp.goto(`${DECK}/presenter.html?api=${API}&remote`, { waitUntil: "load" });
await rp.fill("#p-tok", TOKEN); await rp.tap("#p-tok-go"); await sleep(2500);
const did = (await pos()).id;
ok("presenter (phone) shows the deck's slide", await until(async () => (await rp.textContent("#p-id")).trim() === did, 6000), `${(await rp.textContent("#p-id")).trim()} vs ${did}`);
let a2 = await pos(); await rp.tap("#b-next"); ok("presenter (phone) Next moves the deck", await until(async () => n(await pos()) > n(a2), 6000));
a2 = await pos(); await rp.tap("#b-prev"); ok("presenter (phone) Back moves the deck", await until(async () => n(await pos()) < n(a2), 6000));
await at("s4"); a2 = await pos(); await rp.tap("#b-next"); await rp.tap("#b-next");
ok("presenter (phone) quick double tap = 2 steps (s4 → s6)", await until(async () => (await pos()).id === "s6", 8000), JSON.stringify(await pos()));
await rp.tap("#b-black"); ok("presenter (phone) Black", await until(() => body("black"), 6000)); await rp.tap("#b-black"); await until(async () => !(await body("black")), 6000);
await rp.tap("#p-id"); await rp.tap(".jump-list button[data-id='s9']").catch(() => {}); ok("presenter (phone) jump list", await until(async () => (await pos()).id === "s9", 6000));

// ===================== 4. admin page (phone) =====================
const ad = await phoneCtx.newPage(); watch(ad, "admin"); ad.on("dialog", (d) => d.accept());
await ad.goto(`${API}/admin`, { waitUntil: "load" });
await ad.fill("#tok", TOKEN); await ad.tap("#go"); await sleep(1200);
await ad.tap("[data-cur='A']").catch(() => {}); ok("admin: set current", await until(async () => (await status()).state.current === "A"));
await ad.tap("[data-open='A']").catch(() => {}); ok("admin: open/close a poll", await until(async () => !(await status()).state.open.includes("A")));
await ad.tap("[data-reset='A']").catch(() => {}); ok("admin: reset one poll", await until(async () => (await status()).polls.find((x) => x.id === "A").counts.every((c) => c === 0)));
await ad.tap("#rall").catch(() => {}); ok("admin: reset all", await until(async () => (await status()).polls.every((x) => x.counts.every((c) => c === 0))));
const top = async () => Math.max(...(await status()).runs.map((r) => r.id)); // status lists the newest 30 runs
const run0 = await top(); await ad.tap("[data-run='rehearsal']").catch(() => {});
ok("admin: new rehearsal run", await until(async () => (await top()) > run0));
await ad.fill("#pm", "1500"); await ad.tap("#cfg").catch(() => {}); ok("admin: poll interval", await until(async () => (await status()).state.poll_ms === 1500));
const dl = ad.waitForEvent("download", { timeout: 4000 }).catch(() => null); await ad.tap("#csv").catch(() => {}); ok("admin: export CSV", !!(await dl));

// ===================== 4a. admin key in the URL (what the speaker types into the address bar) =====================
// Nov 20: #key= added to an already-open deck tab was ignored (no reload; key only read at load) → phones stayed idle.
const uctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const ud = await uctx.newPage(); watch(ud, "urlkey");
const uState = () => ud.evaluate(() => ({ id: Deck.current().el.id, step: Deck.current().step, url: location.href, key: localStorage.getItem("sl5:deckkey"), toast: document.querySelector("#toast").textContent }));
await admin("current", { current: "idle" });
await ud.goto(`${DECK}/?api=${API}#key=${TOKEN}`, { waitUntil: "load" });
let u = await until(async () => { const x = await uState(); return /Phones → warm/.test(x.toast) && x; });
ok("URL #key= on load: phones → warm, toast, key stored, hidden from the URL", !!u && u.key === TOKEN && !u.url.includes(TOKEN) && (await status()).state.current === "warm", u && u.url);
await ud.evaluate(() => localStorage.clear()); await ud.goto(`${DECK}/?api=${API}#s5`); await ud.reload({ waitUntil: "load" }); await sleep(800);
await ud.keyboard.press("ArrowRight"); await sleep(300); await admin("current", { current: "idle" }); // → s6 (S5 has no clicks): phones should be on A
await ud.goto(`${DECK}/?api=${API}#key=${TOKEN}`); // same document: only the hash changes, like editing the address bar
u = await until(async () => { const x = await uState(); return /Phones →/.test(x.toast) && x; });
ok("#key= added to the open deck: stays on the slide, key stored, phones re-pushed, hidden from the URL",
  !!u && u.id === "s6" && u.step === 0 && u.key === TOKEN && !u.url.includes(TOKEN) && (await status()).state.current === "A", u && JSON.stringify(u));
await ud.evaluate(() => localStorage.clear()); await admin("current", { current: "idle" });
await ud.goto(`${DECK}/?api=${API}&key=${TOKEN}#s4`, { waitUntil: "load" });
u = await until(async () => { const x = await uState(); return /Phones →/.test(x.toast) && x; });
ok("URL ?key= works too (kept slide + api)", !!u && u.id === "s4" && u.key === TOKEN && !u.url.includes(TOKEN) && u.url.includes("api=") && (await status()).state.current === "warm", u && u.url);
await ud.close(); // presenter test below must be remote (no deck in this browser)
const up = await uctx.newPage(); watch(up, "presenter-urlkey");
await up.goto(`${DECK}/presenter.html?api=${API}&remote`, { waitUntil: "load" });
await up.evaluate(() => localStorage.removeItem("sl5:remote-token")); await up.reload({ waitUntil: "load" }); await sleep(1800);
const askedTok = await up.evaluate(() => !document.getElementById("p-auth").hidden);
await up.goto(`${DECK}/presenter.html?api=${API}&remote#key=${TOKEN}`);
ok("presenter: #key= added to the open page connects (token box closes), hidden from the URL", askedTok &&
  await until(async () => up.evaluate((t) => localStorage.getItem("sl5:remote-token") === t && document.getElementById("p-auth").hidden && !location.href.includes(t), TOKEN)));
await uctx.close();

// ===================== 4b. hung poll server → show of hands =====================
const hang = await lap.newPage(); watch(hang, "hang");
await hang.route(`${API}/api/**`, () => {}); // requests never answer (dead uplink)
await hang.goto(`${DECK}/?api=${API}#s4`, { waitUntil: "load" });
ok("hung server: show of hands within 10s", await until(() => hang.evaluate(() => { const a = document.querySelector(".slide.active"); const h = a && a.querySelector(".hands"); return !!(a && a.classList.contains("nodata") && h && h.getBoundingClientRect().height > 0); }), 10000));
await hang.close();

// ===================== 5. offline copy (file://) =====================
const off = await lap.newPage(); watch(off, "offline"); off.on("dialog", (d) => d.accept(""));
await off.goto(pathToFileURL(resolve("deck/public/offline.html")).href + "#s4"); await sleep(1500);
const opos = () => off.evaluate(() => { const c = Deck.current(); return c.idx * 100 + c.step; });
let o = await opos(); await off.keyboard.press("ArrowRight"); await sleep(300); ok("offline: → next", (await opos()) > o);
o = await opos(); await off.keyboard.press("ArrowLeft"); await sleep(300); ok("offline: ← back", (await opos()) < o);
await off.keyboard.press("h"); await sleep(200); const oh = await off.evaluate(() => document.body.classList.contains("show-hands")); await off.keyboard.press("h");
ok("offline: H toggles show-of-hands (deck visible)", oh && (await off.evaluate(() => getComputedStyle(document.body).display !== "none")));

ok("no page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await admin("config", { poll_ms: 5000 });
await browser.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
