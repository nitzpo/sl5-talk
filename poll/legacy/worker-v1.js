// ted-polls: tiny live-poll backend. Served at https://vote.nitzpo.workers.dev
// Routes:
//   GET  /<id>            mobile vote page
//   GET  /                newest open poll's vote page
//   GET  /api/poll/<id>   {id, question, options, counts, total, open}
//   POST /api/vote/<id>   {opt, voter} -> upsert one vote per voter
// Polls are created/edited directly in D1 (tables: polls, votes, counts).

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
  });
const ID_RE = /^[a-z0-9-]{1,32}$/;
const VOTER_RE = /^[A-Za-z0-9-]{8,64}$/;

async function getPoll(db, id) {
  const poll = await db.prepare("SELECT id, question, options, open FROM polls WHERE id = ?").bind(id).first();
  if (!poll) return null;
  const options = JSON.parse(poll.options);
  const { results } = await db.prepare("SELECT opt, n FROM counts WHERE poll_id = ?").bind(id).all();
  const counts = options.map(() => 0);
  for (const r of results) if (r.opt >= 0 && r.opt < counts.length) counts[r.opt] = Math.max(0, r.n);
  return { id: poll.id, question: poll.question, options, counts, total: counts.reduce((a, b) => a + b, 0), open: !!poll.open };
}

async function vote(db, id, req) {
  let body;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const opt = body?.opt, voter = body?.voter;
  if (!Number.isInteger(opt) || typeof voter !== "string" || !VOTER_RE.test(voter)) return json({ error: "bad_input" }, 400);
  const poll = await db.prepare("SELECT options, open FROM polls WHERE id = ?").bind(id).first();
  if (!poll) return json({ error: "not_found" }, 404);
  if (!poll.open) return json({ error: "closed" }, 409);
  if (opt < 0 || opt >= JSON.parse(poll.options).length) return json({ error: "bad_option" }, 400);

  const prev = await db.prepare("SELECT opt FROM votes WHERE poll_id = ? AND voter = ?").bind(id, voter).first();
  if (prev && prev.opt === opt) return json({ ok: true, opt });
  const stmts = [
    db.prepare("INSERT INTO votes (poll_id, voter, opt) VALUES (?, ?, ?) ON CONFLICT(poll_id, voter) DO UPDATE SET opt = excluded.opt, ts = unixepoch()").bind(id, voter, opt),
    db.prepare("INSERT INTO counts (poll_id, opt, n) VALUES (?, ?, 1) ON CONFLICT(poll_id, opt) DO UPDATE SET n = n + 1").bind(id, opt),
  ];
  if (prev) stmts.push(db.prepare("UPDATE counts SET n = n - 1 WHERE poll_id = ? AND opt = ?").bind(id, prev.opt));
  await db.batch(stmts);
  return json({ ok: true, opt });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(title, body) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<style>
:root{--bg:#0f1115;--fg:#f4f4f5;--mut:#a1a1aa;--acc:#e62b1e;--card:#1d2027;--line:#2c313b}
*{box-sizing:border-box;margin:0}
body{min-height:100dvh;background:var(--bg);color:var(--fg);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px 16px 40px;display:flex;justify-content:center}
main{width:100%;max-width:520px;display:flex;flex-direction:column;gap:18px}
.bar{width:48px;height:5px;background:var(--acc);border-radius:4px}
h1{font-size:26px;line-height:1.2;font-weight:800}
.opts{display:flex;flex-direction:column;gap:12px}
button.o{all:unset;box-sizing:border-box;width:100%;padding:18px 18px;border-radius:14px;background:var(--card);border:2px solid var(--line);font-size:19px;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center;-webkit-tap-highlight-color:transparent}
button.o:active{transform:scale(.99)}
button.o.sel{border-color:var(--acc);background:#2a1514}
button.o .tick{opacity:0;color:var(--acc);font-weight:800}
button.o.sel .tick{opacity:1}
button.o[disabled]{opacity:.6;cursor:default}
.msg{color:var(--mut);font-size:15px;min-height:1.4em}
.msg.ok{color:#4ade80}
.msg.err{color:#f87171}
</style></head><body><main>${body}</main></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function votePage(p) {
  const opts = p.options.map((o, i) => `<button class="o" data-i="${i}"><span>${esc(o)}</span><span class="tick">✓</span></button>`).join("");
  return page(p.question, `<div class="bar"></div><h1>${esc(p.question)}</h1>
<div class="opts">${opts}</div><p class="msg" id="msg">${p.open ? "Tap to vote. You can change your answer." : "Voting is closed."}</p>
<script>
const ID=${JSON.stringify(p.id)}, OPEN=${p.open};
let voter=null; const key="v:"+ID;
try{voter=localStorage.getItem("voter")}catch(e){}
if(!voter){voter=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2));try{localStorage.setItem("voter",voter)}catch(e){}}
const btns=[...document.querySelectorAll("button.o")], msg=document.getElementById("msg");
const mark=i=>btns.forEach((b,k)=>b.classList.toggle("sel",k===i));
try{const s=localStorage.getItem(key);if(s!==null)mark(+s)}catch(e){}
if(!OPEN)btns.forEach(b=>b.disabled=true);
let busy=false;
btns.forEach(b=>b.onclick=async()=>{
  if(busy||!OPEN)return; busy=true; const i=+b.dataset.i; btns.forEach(x=>x.disabled=true); msg.className="msg"; msg.textContent="Sending…";
  try{
    const r=await fetch("/api/vote/"+ID,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({opt:i,voter})});
    const d=await r.json().catch(()=>({}));
    if(r.ok){mark(i);try{localStorage.setItem(key,i)}catch(e){};msg.className="msg ok";msg.textContent="Vote counted. Tap another to change it.";}
    else{msg.className="msg err";msg.textContent=d.error==="closed"?"Voting is closed.":"Couldn't send your vote. Try again.";}
  }catch(e){msg.className="msg err";msg.textContent="No connection. Try again.";}
  busy=false; if(OPEN)btns.forEach(x=>x.disabled=false);
});
</script>`);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const db = env.DB;
    try {
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      if (parts[0] === "api") {
        const id = parts[2] || "";
        if (!ID_RE.test(id)) return json({ error: "bad_id" }, 400);
        if (parts[1] === "poll" && req.method === "GET") {
          const p = await getPoll(db, id);
          return p ? json(p) : json({ error: "not_found" }, 404);
        }
        if (parts[1] === "vote" && req.method === "POST") return vote(db, id, req);
        return json({ error: "not_found" }, 404);
      }
      if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });
      if (parts[0] === "favicon.ico") return new Response(null, { status: 204 });
      let id = (parts[0] || "").toLowerCase();
      if (!id) {
        const latest = await db.prepare("SELECT id FROM polls WHERE open = 1 ORDER BY created_at DESC LIMIT 1").first();
        if (!latest) return page("No poll", `<div class="bar"></div><h1>No poll is open right now.</h1>`);
        id = latest.id;
      }
      if (!ID_RE.test(id)) return page("Not found", `<h1>Poll not found.</h1>`);
      const p = await getPoll(db, id);
      if (!p) return page("Not found", `<div class="bar"></div><h1>Poll not found.</h1><p class="msg">Check the code on screen.</p>`);
      return votePage(p);
    } catch (e) {
      return json({ error: "server_error" }, 500);
    }
  },
};
