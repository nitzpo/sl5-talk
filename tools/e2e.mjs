// Real-input end-to-end test: every deck shortcut, the poll flow, a phone, both presenter modes, the admin page and the
// offline copy, driven like a person would (key presses, clicks, taps, typing). No URL shortcuts (no #key=): the K bug
// (Nov 15) hid for a week because tests set the admin key through the URL.
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
let dialogAnswer = "";
deck.on("dialog", (d) => d.accept(dialogAnswer));
await deck.goto(`${DECK}/?api=${API}#s4`, { waitUntil: "load" });
await deck.evaluate(() => localStorage.clear());
await deck.reload({ waitUntil: "load" });
const pos = () => deck.evaluate(() => { const c = Deck.current(); return { id: c.el.id, idx: c.idx, step: c.step, cut: c.cut }; });
const at = (id, s = 0) => deck.evaluate(([i, s]) => Deck.go(i, s), [id, s]).then(() => sleep(300));
const press = async (k, ms = 300) => { await deck.keyboard.press(k); await sleep(ms); };
const body = (cls) => deck.evaluate((c) => document.body.classList.contains(c), cls);
const n = (p) => p.idx * 100 + p.step;

dialogAnswer = TOKEN; await press("k");
ok("K saves the admin key", (await deck.evaluate(() => localStorage.getItem("sl5:deckkey"))) === TOKEN);
for (const k of ["ArrowRight", "Space", "PageDown", "ArrowDown", "Enter"]) {
  await at("s4"); const a = await pos(); await press(k); const b = await pos(); ok(`${k} = next`, n(b) > n(a), `${a.id}.${a.step} → ${b.id}.${b.step}`);
}
for (const k of ["ArrowLeft", "PageUp", "ArrowUp", "Backspace"]) {
  await at("s6"); const a = await pos(); await press(k); const b = await pos(); ok(`${k} = back`, n(b) < n(a), `${a.id}.${a.step} → ${b.id}.${b.step}`);
}
await press("End"); ok("End = last slide", (await pos()).id === (await deck.evaluate(() => [...document.querySelectorAll("section.slide")].pop().id)));
await press("Home"); ok("Home = first slide", (await pos()).idx === 0);
for (const k of ["b", ".", "w"]) { await press(k); const on = await body("black"); await press(k); ok(`${k} toggles black`, on && !(await body("black"))); }
await press("n"); const hud = await body("hud"); await press("n"); ok("N toggles notes HUD", hud && !(await body("hud")));
await press("t", 100); ok("T starts the timer", /Timer/.test(await deck.textContent("#toast")));
const c0 = (await pos()).cut; await press("c"); const c1 = (await pos()).cut; await press("c"); ok("C toggles the 15-min cut", c1 !== c0 && (await pos()).cut === c0);
await press("h"); const hands = await body("hands"); await press("h"); ok("H toggles show-of-hands", hands && !(await body("hands")));
dialogAnswer = "s10.2"; await press("g"); ok("G jumps to a slide (+click)", (p0 => p0.id === "s10" && p0.step === 2)(await pos()));
await at("s4"); dialogAnswer = "s99"; await press("g"); ok("G with a typo stays put", (await pos()).id === "s4" && /No slide/.test(await deck.textContent("#toast")));
let pop = lap.waitForEvent("page", { timeout: 3000 }).catch(() => null); await press("a"); pop = await pop;
ok("A opens the admin page", !!pop && pop.url().startsWith(`${API}/admin`), pop && pop.url()); if (pop) await pop.close();
await at("s4"); const s4 = await pos(); await deck.mouse.click(700, 500); ok("click = next", n(await pos()) > n(s4));
await at("s5"); await admin("current", { current: "idle" }); await press("p", 800);
ok("P re-pushes the slide's poll state", (await status()).state.current === "A");
await press("f", 600); ok("F enters fullscreen", await deck.evaluate(() => !!document.fullscreenElement)); await press("f", 400);

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
const runs0 = (await status()).runs.length; await ad.tap("[data-run='rehearsal']").catch(() => {});
ok("admin: new rehearsal run", await until(async () => (await status()).runs.length === runs0 + 1));
await ad.fill("#pm", "1500"); await ad.tap("#cfg").catch(() => {}); ok("admin: poll interval", await until(async () => (await status()).state.poll_ms === 1500));
const dl = ad.waitForEvent("download", { timeout: 4000 }).catch(() => null); await ad.tap("#csv").catch(() => {}); ok("admin: export CSV", !!(await dl));

// ===================== 5. offline copy (file://) =====================
const off = await lap.newPage(); watch(off, "offline"); off.on("dialog", (d) => d.accept(""));
await off.goto(pathToFileURL(resolve("deck/public/offline.html")).href + "#s4"); await sleep(1500);
const opos = () => off.evaluate(() => { const c = Deck.current(); return c.idx * 100 + c.step; });
let o = await opos(); await off.keyboard.press("ArrowRight"); await sleep(300); ok("offline: → next", (await opos()) > o);
o = await opos(); await off.keyboard.press("ArrowLeft"); await sleep(300); ok("offline: ← back", (await opos()) < o);
await off.keyboard.press("h"); await sleep(200); const oh = await off.evaluate(() => document.body.classList.contains("hands")); await off.keyboard.press("h");
ok("offline: H toggles show-of-hands", oh);

ok("no page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await admin("config", { poll_ms: 5000 });
await browser.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
