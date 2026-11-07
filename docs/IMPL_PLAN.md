# Implementation plan (approved Nov 7 2026, with user answers)

## Decisions
- **Stack:** vanilla HTML/CSS/JS, no framework, classic scripts (works from `file://`). Custom engine: 1920×1080 stage scaled to viewport; each slide = `<section>` with N steps; state per step is deterministic (back/jump/reload/PDF safe). Hash URL `#/s7/2`.
- **Tools:** Python for asset/data/offline builds; Node Playwright (preinstalled) for screenshots/PDF; wrangler for local dev.
- **Hosting:**
  - `vote` Worker (API + phone pages: vote, links, admin, remote) on `vote.nitzpo.workers.dev` (short enough; no spare short domain on the account).
  - `sl5-deck` Worker: deck as static assets (separate host: audience can't stumble into slides).
  - Deploy = Workers Builds (git push): `main` → live `vote` (+ D1 migrations) and `sl5-deck`; other branches → `vote-dev` (D1 `ted-polls-dev`) and a deck Preview URL (`<branch>-sl5-deck.nitzpo.workers.dev`). Merging to `main` = going live.
- **Free tier, ≈150 phones.** Phones poll `GET /api/state` every 5s (server-tunable `poll_ms`), only while page visible; B1→B2→C chain is client-side (no server lag). Budget ≈ 150×12/min×25min ≈ 45k + deck/admin ≈ 5k → ~50k of 100k/day. No full-scale rehearsal on talk day (quota resets 00:00 UTC = 02:00 IL).
- **Polls:** results update live while on results slides; a poll closes when the deck **leaves its topic** (warm → entering S5, A → entering S9/S10, B1/B2/C → entering S18).
- **Rehearsal vs live:** votes keyed by `run`. New live run = zeros by construction. Rehearsal data kept, never shown.
- **Anti-stuffing (light):** server-signed voter ids; per-IP vote cap per poll (generous for venue NAT); admin reset.
- **Clicker:** unknown → keyboard clicker keys + phone `/remote` page as backup. Ask organizers (checklist).
- **Slot length unknown** → 17-min build + 15-min cut toggle. Cut = drop S9, S19 (S8 removed in plan v4). S16 trim: Nitzan decides later (keep the simulator GIF).

## Poll API v2
- Public: `GET /api/state` · `POST /api/hello` (signed voter id) · `POST /api/vote/<id>` · `GET /api/results?grp=<g>`.
- Admin (`Authorization: Bearer <ADMIN_TOKEN>`): `GET /api/admin/status` · `POST /api/admin/current` · `POST /api/admin/open` · `POST /api/admin/run` · `POST /api/admin/activate` · `POST /api/admin/reset` · `POST /api/admin/config` · `GET /api/admin/export.csv`.
- Later (M4): laptop pairing via 6-digit code; `/remote` notes + next/prev.
- Pages: `/` vote (follows current) · `/links` · `/admin`.

## Milestones
- **M1** Nov 8–10: poll v2 on dev, phone/links/admin pages, deck engine + all slides stubbed, poll slides working → real-phone test.
- **M2** Nov 11–13: Parts 0–2 visuals/animations.
- **M3** Nov 14–17: Parts 3–6.
- **M4** Nov 18–19: notes, presenter window + phone remote + pairing, 15-min cut, offline HTML + PDF, projector contrast pass.
- **M5** Nov 20–21: load test (150 phones vs dev), promote to live `vote`, dress-rehearsal checklist.
