// Load test: N simulated phones follow the talk (warm → A → BC → links) like the real vote page.
//   NODE_USE_ENV_PROXY=1 BASE=https://vote-dev.nitzpo.workers.dev ADMIN_TOKEN=… node tools/loadtest.mjs [--phones 150] [--phase 30]
// Creates a fresh rehearsal run "loadtest", then re-activates the run that was active before. Refuses the live worker.
// Checks: every phone's vote is counted exactly once per poll; latency percentiles; errors / 429s.
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const BASE = (process.env.BASE || "").replace(/\/$/, "");
const TOKEN = process.env.ADMIN_TOKEN;
const PHONES = +opt("--phones", 150), PHASE = +opt("--phase", 30) * 1000;
if (!BASE || !TOKEN) { console.error("BASE and ADMIN_TOKEN required"); process.exit(2); }
if (/\/\/vote\.nitzpo\.workers\.dev/.test(BASE)) { console.error("refusing to load-test the LIVE worker"); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lat = {}, errs = {};
async function req(tag, path, init = {}) {
  const t = performance.now();
  try {
    const r = await fetch(BASE + path, { ...init, headers: { "content-type": "application/json", ...(init.headers || {}) } });
    (lat[tag] = lat[tag] || []).push(performance.now() - t);
    if (!r.ok) errs[tag + " " + r.status] = (errs[tag + " " + r.status] || 0) + 1;
    const ct = r.headers.get("content-type") || "";
    return { status: r.status, body: ct.includes("json") ? await r.json() : await r.text() };
  } catch (e) {
    errs[tag + " " + (e.cause?.code || e.message)] = (errs[tag + " " + (e.cause?.code || e.message)] || 0) + 1;
    return { status: 0, body: null };
  }
}
const admin = (path, body) => req("admin", "/api/admin/" + path, { method: body ? "POST" : "GET", headers: { authorization: "Bearer " + TOKEN }, body: body && JSON.stringify(body) });

let stop = false;
const expected = {}; // poll id -> number of phones that voted
async function phone(i) {
  await sleep(Math.random() * 3000);
  await req("page", "/");
  const vid = (await req("hello", "/api/hello", { method: "POST" })).body?.vid;
  if (!vid) return;
  const voted = new Set();
  while (!stop) {
    const s = (await req("state", "/api/state", { cache: "no-store" })).body;
    if (s && s.mode === "poll") {
      for (const p of s.polls || []) {
        if (voted.has(p.id) || !p.open) continue;
        await sleep(500 + Math.random() * 4000); // read + think
        const r = await req("vote", "/api/vote/" + p.id, { method: "POST", body: JSON.stringify({ opt: Math.floor(Math.random() * p.o.length), vid }) });
        if (r.status === 200) { voted.add(p.id); expected[p.id] = (expected[p.id] || 0) + 1; }
      }
    }
    await sleep((s?.poll_ms || 5000) * (0.9 + Math.random() * 0.2));
  }
}

const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((p / 100) * a.length))];
(async () => {
  const before = (await admin("status")).body;
  if (!before?.runs) { console.error("admin status failed", before); process.exit(1); }
  const prevRun = before.state.run, prevCurrent = before.state.current;
  await admin("run", { kind: "rehearsal", label: "loadtest" });
  await admin("current", { current: "warm" });
  const t0 = Date.now();
  console.log(`${PHONES} phones, phase ${PHASE / 1000}s, base ${BASE}`);
  const phones = Array.from({ length: PHONES }, (_, i) => phone(i));
  // the deck: same order as the talk; closes the previous group when it moves on
  await sleep(PHASE); await admin("open", { ids: ["warm"], open: false }); await admin("current", { current: "A" });
  await sleep(PHASE); await admin("open", { ids: ["A"], open: false }); await admin("current", { current: "BC" });
  await sleep(PHASE * 1.5); await admin("current", { current: "links" });
  await sleep(10000);
  stop = true; await Promise.all(phones);
  const secs = (Date.now() - t0) / 1000;

  let ok = true;
  for (const g of ["warm", "A", "BC"]) {
    const r = (await req("results", "/api/results?grp=" + g)).body;
    for (const [id, d] of Object.entries(r.polls)) {
      const good = d.total === (expected[id] || 0);
      ok = ok && good && d.total === PHONES;
      console.log(`  ${id}: counted ${d.total}, phones that got 200 ${expected[id] || 0}${good ? "" : "  ✗ MISMATCH"}${d.total === PHONES ? "" : "  (not all phones voted)"}`);
    }
  }
  const total = Object.values(lat).reduce((n, a) => n + a.length, 0);
  console.log(`requests ${total} in ${secs.toFixed(0)}s (${(total / secs).toFixed(1)}/s)`);
  for (const [k, a] of Object.entries(lat)) console.log(`  ${k.padEnd(7)} n=${String(a.length).padStart(5)}  p50 ${pct(a, 50).toFixed(0)}ms  p95 ${pct(a, 95).toFixed(0)}ms  max ${Math.max(...a).toFixed(0)}ms`);
  console.log("errors:", Object.keys(errs).length ? errs : "none");
  await admin("activate", { run: prevRun });
  await admin("current", { current: prevCurrent });
  console.log(`re-activated run ${prevRun} (current ${prevCurrent})`);
  process.exit(ok && !Object.keys(errs).length ? 0 : 1);
})();
