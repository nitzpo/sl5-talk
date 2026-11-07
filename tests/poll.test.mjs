// API tests for the poll worker. Mutates state: run against local (`npm run poll:dev`) or vote-dev only.
//   BASE=http://localhost:8787 ADMIN_TOKEN=devtoken123 npm run test:poll
import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE || "http://localhost:8787";
const TOKEN = process.env.ADMIN_TOKEN || "devtoken123";
if (/\/\/vote\.nitzpo/.test(BASE)) throw new Error("refusing to run tests against the live worker");

const get = (p, h = {}) => fetch(BASE + p, { headers: h, redirect: "manual" });
const post = (p, body, h = {}) =>
  fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(body ?? {}) });
const auth = { authorization: `Bearer ${TOKEN}` };
const admin = async (p, body) => (await post(`/api/admin/${p}`, body, auth)).json();
const vidOf = async () => (await (await post("/api/hello")).json()).vid;
const vote = (id, opt, vid) => post(`/api/vote/${id}`, { opt, vid });
const results = async (g) => (await get(`/api/results?grp=${g}`)).json();
const state = async () => (await get("/api/state")).json();
const settle = () => new Promise((r) => setTimeout(r, 1100)); // per-isolate caches are 1s

test("poll worker v2", async (t) => {
  await admin("run", { kind: "rehearsal", label: "test" });
  await settle();

  await t.test("idle state after new run", async () => {
    const s = await state();
    assert.equal(s.mode, "idle");
    assert.ok(s.run > 0 && s.poll_ms >= 1000);
  });

  await t.test("admin requires token", async () => {
    assert.equal((await get("/api/admin/status")).status, 401);
    assert.equal((await post("/api/admin/current", { current: "warm" }, { authorization: "Bearer nope" })).status, 401);
  });

  const vid = await vidOf();
  await t.test("closed poll rejects votes", async () => {
    assert.equal((await vote("warm", 0, vid)).status, 409);
  });

  await t.test("current=warm opens it; vote + change vote", async () => {
    const r = await admin("current", { current: "warm" });
    assert.deepEqual(r.open, ["warm"]);
    await settle();
    const s = await state();
    assert.equal(s.mode, "poll");
    assert.equal(s.grp, "warm");
    assert.equal(s.polls[0].open, true);
    assert.equal((await vote("warm", 1, vid)).status, 200);
    assert.equal((await vote("warm", 2, vid)).status, 200);
    await settle();
    const res = await results("warm");
    assert.deepEqual(res.polls.warm.counts, [0, 0, 1, 0, 0]);
    assert.equal(res.voters, 1);
  });

  await t.test("input validation", async () => {
    assert.equal((await vote("warm", 9, vid)).status, 400);
    assert.equal((await vote("warm", 0, "AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAA")).status, 401);
    assert.equal((await vote("nope", 0, vid)).status, 404);
    assert.equal((await get("/api/results?grp=zzz")).status, 400);
  });

  await t.test("BC group chain: all three open; closing warm blocks it", async () => {
    const r = await admin("current", { current: "BC" });
    assert.deepEqual(r.open, ["warm", "B1", "B2", "C"]);
    await admin("open", { ids: ["warm"], open: false });
    await settle();
    const s = await state();
    assert.deepEqual(s.polls.map((p) => p.id), ["B1", "B2", "C"]);
    assert.equal((await vote("warm", 0, vid)).status, 409);
    for (const id of ["B1", "B2", "C"]) assert.equal((await vote(id, 0, vid)).status, 200);
    await settle();
    const res = await results("BC");
    assert.equal(res.polls.B1.total, 1);
    assert.equal(res.voters, 1);
  });

  await t.test("ip cap", async () => {
    await admin("config", { ip_cap: 1 });
    await settle();
    const other = await vidOf();
    assert.equal((await vote("B1", 1, other)).status, 429);
    assert.equal((await vote("B1", 2, vid)).status, 200, "existing voter can still change");
    await admin("config", { ip_cap: 300 });
  });

  await t.test("reset poll bumps epoch and zeroes counts", async () => {
    const before = await state();
    await admin("reset", { poll: "B1" });
    await settle();
    const after = await state();
    assert.equal(after.epoch, before.epoch + 1);
    assert.equal((await results("BC")).polls.B1.total, 0);
  });

  await t.test("export csv", async () => {
    const r = await get("/api/admin/export.csv", auth);
    assert.equal(r.status, 200);
    const lines = (await r.text()).trim().split("\n");
    assert.equal(lines[0], "run,poll,opt,option,voter,ts");
    assert.ok(lines.length >= 3);
  });

  await t.test("new run isolates votes", async () => {
    const r = await admin("run", { kind: "rehearsal", label: "test-2" });
    await settle();
    const res = await results("warm,BC");
    assert.equal(res.run, r.run);
    assert.equal(res.voters, 0);
    assert.equal((await state()).mode, "idle");
  });

  await t.test("pages", async () => {
    const home = await get("/");
    assert.equal(home.status, 200);
    assert.match(await home.text(), /window\.__S=/);
    assert.equal((await get("/links")).status, 200);
    assert.equal((await get("/admin")).status, 200);
    assert.equal((await get("/whatever")).status, 302);
  });
});
