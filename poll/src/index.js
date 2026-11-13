// SL5 talk live polls (v2). Free tier: phones poll /api/state every poll_ms (default 5s) while visible.
//
// Public:
//   GET  /                 phone page (follows the current poll / group, then links)
//   GET  /links            links page
//   GET  /admin            admin page (token entered on the page)
//   GET  /api/state        {rev, run, epoch, poll_ms, mode: idle|links|poll, grp?, polls?}
//   POST /api/hello        {vid}  server-signed voter id (≤ ip_cap new ids per IP per run, else 429)
//   POST /api/vote/<id>    {opt, vid}
//   GET  /api/results?grp=warm,A   live counts for the active run
// Admin (Authorization: Bearer <ADMIN_TOKEN>):
//   GET  /api/admin/status
//   POST /api/admin/current {current: idle|links|<group>}   (opens the group's polls)
//   POST /api/admin/open    {ids: [...], open: bool}
//   POST /api/admin/run     {kind: rehearsal|live, label}  (new run = zero votes; closes all, current=idle)
//   POST /api/admin/activate {run}
//   POST /api/admin/reset   {poll?}   (deletes votes in the active run)
//   POST /api/admin/config  {poll_ms?, ip_cap?}
//   GET  /api/admin/export.csv?run=<id>
//   POST /api/admin/deck   {id, step, cut, black}   deck reports its position (phone remote reads it)
//   GET  /api/admin/deck   -> {deck, seq}
//   POST /api/admin/remote {cmd: next|prev|black|go, arg?}   phone remote queues a command
//   GET  /api/admin/remote?since=<seq> -> {seq, cmds}      deck polls for new commands

import { POLLS, GROUPS } from "./polls.js";
import { votePage, linksPage, adminPage, FAVICON } from "./pages.js";

const POLL = Object.fromEntries(POLLS.map((p) => [p.id, p]));
const CURRENTS = new Set(["idle", "links", ...Object.keys(GROUPS)]);

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-max-age": "86400",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS },
  });
const html = (body) =>
  new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

// ---------- state (kv table), cached per isolate for 1s ----------
let stateCache = { t: 0, v: null };

async function readState(db, fresh = false) {
  const now = Date.now();
  if (!fresh && stateCache.v && now - stateCache.t < 1000) return stateCache.v;
  const { results } = await db.prepare("SELECT k, v FROM kv").all();
  const kv = Object.fromEntries(results.map((r) => [r.k, r.v]));
  const v = {
    run: +kv.active_run || 0,
    current: CURRENTS.has(kv.current) ? kv.current : "idle",
    open: safeParse(kv.open, []),
    rev: +kv.rev || 0,
    epoch: +kv.epoch || 0,
    poll_ms: +kv.poll_ms || 5000,
    ip_cap: +kv.ip_cap || 600,
  };
  stateCache = { t: now, v };
  return v;
}

function setKV(db, pairs) {
  return Object.entries(pairs).map(([k, v]) =>
    db.prepare("INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(k, String(v)),
  );
}
const bumpRev = (db) => db.prepare("UPDATE kv SET v = CAST(v AS INTEGER) + 1 WHERE k = 'rev'");

async function writeState(db, pairs, extra = []) {
  await db.batch([...extra, ...setKV(db, pairs), bumpRev(db)]);
  stateCache.t = 0;
  resultsCache.clear();
}

function publicState(s) {
  const mode = s.current === "idle" || s.current === "links" ? s.current : "poll";
  const out = { rev: s.rev, run: s.run, epoch: s.epoch, poll_ms: s.poll_ms, mode };
  if (mode === "poll") {
    out.grp = s.current;
    out.polls = GROUPS[s.current].map((id) => ({ id, q: POLL[id].q, o: POLL[id].o, open: s.open.includes(id) }));
  }
  return out;
}

// ---------- voter ids: random.HMAC (stops trivially forged ids) ----------
const enc = new TextEncoder();
const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let keyCache = null;
async function sign(env, msg) {
  if (!keyCache) {
    const secret = (env.ADMIN_TOKEN || "insecure-dev-secret") + ":voter";
    keyCache = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  }
  return b64u(await crypto.subtle.sign("HMAC", keyCache, enc.encode(msg))).slice(0, 16);
}
// Light anti-stuffing: cap new voter ids per IP per run (ip_cap). Phones mint one id and keep it (localStorage).
async function hello(req, env) {
  const s = await readState(env.DB);
  const ip = req.headers.get("cf-connecting-ip") || "";
  const r = await env.DB.prepare(
    "INSERT INTO hellos (run_id, ip, n) VALUES (?, ?, 1) ON CONFLICT(run_id, ip) DO UPDATE SET n = n + 1 RETURNING n",
  ).bind(s.run, ip).first();
  if (r && r.n > s.ip_cap) return json({ error: "rate_limited" }, 429);
  return json({ vid: await newVid(env) });
}
async function newVid(env) {
  const r = b64u(crypto.getRandomValues(new Uint8Array(12)));
  return `${r}.${await sign(env, r)}`;
}
async function checkVid(env, vid) {
  if (typeof vid !== "string" || !/^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{16}$/.test(vid)) return false;
  const [r, s] = vid.split(".");
  return safeEq(s, await sign(env, r));
}
function safeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const safeParse = (s, dflt) => {
  try { return JSON.parse(s); } catch { return dflt; }
};

// ---------- votes & results ----------
async function vote(req, env, id) {
  const p = POLL[id];
  if (!p) return json({ error: "not_found" }, 404);
  const body = await req.json().catch(() => null);
  const opt = body?.opt, vid = body?.vid;
  if (!Number.isInteger(opt) || opt < 0 || opt >= p.o.length) return json({ error: "bad_option" }, 400);
  if (!(await checkVid(env, vid))) return json({ error: "bad_voter" }, 401);
  const db = env.DB;
  // Cached state (≤1s); re-read only to confirm a "closed". Load: 1 write per vote. (Nov 13: 4 queries/vote incl. a
  // per-IP COUNT scan → "D1 DB is overloaded. Too many resources consumed within a 10 second window" at 300 phones.)
  let s = await readState(db);
  if (!s.open.includes(id)) s = await readState(db, true);
  if (!s.open.includes(id)) return json({ error: "closed" }, 409);
  const ip = req.headers.get("cf-connecting-ip") || "";
  await db
    .prepare(
      "INSERT INTO votes (run_id, poll_id, voter, opt, ip) VALUES (?, ?, ?, ?, ?) " +
        "ON CONFLICT(run_id, poll_id, voter) DO UPDATE SET opt = excluded.opt, ts = unixepoch()",
    )
    .bind(s.run, id, vid, opt, ip)
    .run();
  resultsCache.clear();
  return json({ ok: true, opt });
}

const resultsCache = new Map(); // `${run}|${grps}` -> {t, v}

async function results(env, grps) {
  const db = env.DB;
  const s = await readState(db);
  const key = `${s.run}|${s.rev}|${grps.join(",")}`;
  const hit = resultsCache.get(key);
  if (hit && Date.now() - hit.t < 1000) return hit.v;
  const ids = grps.flatMap((g) => GROUPS[g]);
  const qs = ids.map(() => "?").join(",");
  const [rows, voters] = await db.batch([
    db.prepare(`SELECT poll_id, opt, COUNT(*) AS n FROM votes WHERE run_id = ? AND poll_id IN (${qs}) GROUP BY poll_id, opt`).bind(s.run, ...ids),
    db.prepare(`SELECT COUNT(DISTINCT voter) AS n FROM votes WHERE run_id = ? AND poll_id IN (${qs})`).bind(s.run, ...ids),
  ]);
  const polls = {};
  for (const id of ids) polls[id] = { counts: POLL[id].o.map(() => 0), total: 0, open: s.open.includes(id) };
  for (const r of rows.results) {
    const p = polls[r.poll_id];
    if (p && r.opt >= 0 && r.opt < p.counts.length) {
      p.counts[r.opt] = r.n;
      p.total += r.n;
    }
  }
  const v = { run: s.run, current: s.current, polls, voters: voters.results[0]?.n || 0 };
  resultsCache.set(key, { t: Date.now(), v });
  if (resultsCache.size > 50) resultsCache.delete(resultsCache.keys().next().value);
  return v;
}

// ---------- admin ----------
function authed(req, env) {
  const h = req.headers.get("authorization") || "";
  return !!env.ADMIN_TOKEN && h.startsWith("Bearer ") && safeEq(h.slice(7), env.ADMIN_TOKEN);
}

async function admin(req, env, action) {
  if (!env.ADMIN_TOKEN) return json({ error: "admin_token_not_set" }, 503);
  if (!authed(req, env)) return json({ error: "unauthorized" }, 401);
  const db = env.DB;
  const body = req.method === "POST" ? (await req.json().catch(() => ({}))) || {} : {};

  if (action === "status" && req.method === "GET") {
    const s = await readState(db, true);
    const [runs, rows, voters] = await db.batch([
      db.prepare("SELECT r.id, r.kind, r.label, r.created_at, (SELECT COUNT(*) FROM votes v WHERE v.run_id = r.id) AS votes FROM runs r ORDER BY r.id DESC LIMIT 30"),
      db.prepare("SELECT poll_id, opt, COUNT(*) AS n FROM votes WHERE run_id = ? GROUP BY poll_id, opt").bind(s.run),
      db.prepare("SELECT COUNT(DISTINCT voter) AS n FROM votes WHERE run_id = ?").bind(s.run),
    ]);
    const counts = Object.fromEntries(POLLS.map((p) => [p.id, p.o.map(() => 0)]));
    for (const r of rows.results) if (counts[r.poll_id] && r.opt < counts[r.poll_id].length) counts[r.poll_id][r.opt] = r.n;
    return json({
      state: s,
      runs: runs.results,
      voters: voters.results[0]?.n || 0,
      groups: GROUPS,
      polls: POLLS.map((p) => ({ id: p.id, grp: p.grp, short: p.short, o: p.o, open: s.open.includes(p.id), counts: counts[p.id] })),
    });
  }
  if (req.method !== "POST" && !["export.csv", "deck", "remote"].includes(action)) return json({ error: "method" }, 405);

  if (action === "current") {
    const cur = body.current;
    if (!CURRENTS.has(cur)) return json({ error: "bad_current" }, 400);
    const s = await readState(db, true);
    const open = GROUPS[cur] ? [...new Set([...s.open, ...GROUPS[cur]])] : s.open;
    await writeState(db, { current: cur, open: JSON.stringify(open) });
    return json({ ok: true, current: cur, open });
  }
  if (action === "open") {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length || ids.some((id) => !POLL[id])) return json({ error: "bad_ids" }, 400);
    const s = await readState(db, true);
    const set = new Set(s.open);
    for (const id of ids) body.open ? set.add(id) : set.delete(id);
    const open = POLLS.map((p) => p.id).filter((id) => set.has(id));
    await writeState(db, { open: JSON.stringify(open) });
    return json({ ok: true, open });
  }
  if (action === "run") {
    const kind = body.kind === "live" ? "live" : "rehearsal";
    const label = String(body.label || "").slice(0, 60);
    const r = await db.prepare("INSERT INTO runs (kind, label) VALUES (?, ?) RETURNING id").bind(kind, label).first();
    await writeState(db, { active_run: r.id, current: "idle", open: "[]" });
    return json({ ok: true, run: r.id, kind });
  }
  if (action === "activate") {
    const r = await db.prepare("SELECT id FROM runs WHERE id = ?").bind(+body.run || 0).first();
    if (!r) return json({ error: "bad_run" }, 400);
    await writeState(db, { active_run: r.id });
    return json({ ok: true, run: r.id });
  }
  if (action === "reset") {
    const s = await readState(db, true);
    if (body.poll !== undefined && !POLL[body.poll]) return json({ error: "bad_poll" }, 400);
    const del = body.poll
      ? db.prepare("DELETE FROM votes WHERE run_id = ? AND poll_id = ?").bind(s.run, body.poll)
      : db.prepare("DELETE FROM votes WHERE run_id = ?").bind(s.run);
    await writeState(db, { epoch: s.epoch + 1 }, [del]);
    return json({ ok: true });
  }
  // ---- deck <-> phone remote (no rev bump: phones don't care) ----
  if (action === "deck") {
    if (req.method === "POST") {
      const d = { id: String(body.id || "").slice(0, 16), step: +body.step | 0, cut: !!body.cut, black: !!body.black, ts: Date.now() };
      await db.batch(setKV(db, { deck: JSON.stringify(d) }));
      return json({ ok: true });
    }
    const rows = (await db.prepare("SELECT k, v FROM kv WHERE k IN ('deck', 'remote')").all()).results;
    const kv = Object.fromEntries(rows.map((r) => [r.k, safeParse(r.v, null)]));
    return json({ deck: kv.deck || null, seq: kv.remote ? kv.remote.seq : 0, now: Date.now() });
  }
  if (action === "remote") {
    const cur = safeParse((await db.prepare("SELECT v FROM kv WHERE k = 'remote'").first())?.v, null) || { seq: 0, cmds: [] };
    if (req.method === "POST") {
      const cmd = String(body.cmd || "");
      if (!["next", "prev", "black", "go", "cut"].includes(cmd)) return json({ error: "bad_cmd" }, 400);
      const seq = cur.seq + 1;
      const cmds = [...cur.cmds, { seq, cmd, arg: body.arg === undefined ? null : String(body.arg).slice(0, 16), ts: Date.now() }].slice(-20);
      await db.batch(setKV(db, { remote: JSON.stringify({ seq, cmds }) }));
      return json({ ok: true, seq });
    }
    const since = +new URL(req.url).searchParams.get("since") || 0;
    return json({ seq: cur.seq, cmds: cur.cmds.filter((c) => c.seq > since) });
  }
  if (action === "config") {
    const pairs = {};
    if (body.poll_ms !== undefined) pairs.poll_ms = Math.max(1000, Math.min(60000, +body.poll_ms | 0));
    if (body.ip_cap !== undefined) pairs.ip_cap = Math.max(1, Math.min(100000, +body.ip_cap | 0));
    if (!Object.keys(pairs).length) return json({ error: "nothing_to_set" }, 400);
    await writeState(db, pairs);
    return json({ ok: true, ...pairs });
  }
  if (action === "export.csv" && req.method === "GET") {
    const run = +new URL(req.url).searchParams.get("run") || (await readState(db, true)).run;
    const { results } = await db.prepare("SELECT run_id, poll_id, opt, voter, ts FROM votes WHERE run_id = ? ORDER BY ts").bind(run).all();
    const q = (x) => `"${String(x).replace(/"/g, '""')}"`;
    const lines = ["run,poll,opt,option,voter,ts"];
    for (const r of results) lines.push([r.run_id, r.poll_id, r.opt, q(POLL[r.poll_id]?.o[r.opt] ?? ""), r.voter.split(".")[0], r.ts].join(","));
    return new Response(lines.join("\n") + "\n", {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="sl5-votes-run${run}.csv"`, ...CORS },
    });
  }
  return json({ error: "not_found" }, 404);
}

// ---------- router ----------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (path === "/api/state" && req.method === "GET") return json(publicState(await readState(env.DB)));
      if (path === "/api/hello" && req.method === "POST") return hello(req, env);
      if (path.startsWith("/api/vote/") && req.method === "POST") return vote(req, env, path.slice(10));
      if (path === "/api/results" && req.method === "GET") {
        const grps = (url.searchParams.get("grp") || "").split(",").filter((g) => GROUPS[g]);
        if (!grps.length) return json({ error: "bad_grp" }, 400);
        return json(await results(env, grps));
      }
      if (path.startsWith("/api/admin/")) return admin(req, env, path.slice(11));
      if (path.startsWith("/api/")) return json({ error: "not_found" }, 404);
      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
      if (path === "/") return html(votePage(publicState(await readState(env.DB))));
      if (path === "/links") return html(linksPage());
      if (path === "/admin") return html(adminPage());
      if (path === "/favicon.svg" || path === "/favicon.ico")
        return new Response(FAVICON, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" } });
      return Response.redirect(new URL("/", url).toString(), 302);
    } catch (e) {
      console.error(e);
      return json({ error: "server_error" }, 500);
    }
  },
};
