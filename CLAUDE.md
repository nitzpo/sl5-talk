# SL5 talk deck: "Ctrl+C, Ctrl+V a Fighter Jet"

Subtitle (provisional): *What it takes to stop a superpower from stealing frontier AI*

## What this is
- 15–20 min TED-style talk by Nitzan (GitHub `nitzpo`) at **Tel Aviv Frontier AI Security Forum '26**, Sun **Nov 22 2026**, Tel Aviv Museum of Art. ≈300 people: cyber offense/defense veterans, intel alumni, AI researchers, founders. Talk in English. Slot length unknown → build the 17-min version with a marked 15-min cut.
- **Content source of truth: the Notion plan page** https://app.notion.com/p/41158933bf32810aaf6dc2cc614e2954 (Notion MCP). `PLAN.md` is its mirror; build from PLAN.md.
- **Rule:** when Nitzan says "plan updated": re-fetch the Notion page, sync `PLAN.md`, then tell him what changed (concise diff by slide) and what code it affects. If code and PLAN.md disagree, ask.
- Deliverables:
  1. HTML slide deck: cinematic images + code animations + embedded live polls + speaker notes.
  2. Poll backend upgrade: existing Cloudflare Worker `vote` + D1 `ted-polls` (see `poll/`).
  3. Phone pages: vote page (follows current poll), links page (end of talk).
  4. Admin page (phone-friendly) + offline backup (local HTML + PDF, no live polls).

## User preferences
- Extremely concise in all interactions and commits; sacrifice grammar.
- Plans end with a list of unresolved questions (concise).
- When you find a root cause, state it.
- User is an expert Python dev. Learn from corrections; record learnings in this file.

## Hard constraints
- **Any laptop.** The speaker may not present from his own laptop. Deck = URL in Chrome; keys: →/Space/PageDown next, ←/PageUp back (clickers send these), `F` fullscreen. Non-poll slides must also work offline (backup copy).
- **16:9**, designed at 1920×1080, scales to any resolution. Projectors wash out darks: check contrast.
- **Never fake poll numbers.** If the network fails, each poll slide has a show-of-hands fallback.
- **Facts:** use only claims from PLAN.md (fact sheet has sources). Don't add numbers. The simulator stays vague: no scenario numbers (no $1.7B, SL3.5, "two-thirds", etc.).
- No real vendor logos; use text labels.
- Words on slides: no hard limit, but slides are visual. The script lives in speaker notes, not on screen.

## Decisions (Nov 7) → details in `docs/IMPL_PLAN.md`
- Cloudflare **free tier**; plan for ≈150 phones; phones poll every 5s (tunable).
- Polls stay open while results show (live updates); close when the deck leaves the topic.
- Phone URL: `vote.nitzpo.workers.dev`. Light anti-stuffing only.
- LinkedIn: https://www.linkedin.com/in/nitzan-pomerantz/
- Slot length + venue clicker unknown → 15-min cut toggle + phone remote backup.
- Git: `main` = reviewed baseline; work on feature branches → PRs. Repo is **public**: never commit secrets (ADMIN_TOKEN etc.).

## Existing infrastructure
- Cloudflare account id `620b3af8dcc6de07dc551f2122052551` (subdomain `nitzpo`). Worker `vote` → https://vote.nitzpo.workers.dev (compat date 2026-10-01). Code in `poll/worker.js` (copy of what's deployed). D1 `ted-polls`, id `c2271dd0-641c-4e21-a3ea-4724de98905f`, bound as `DB`.
- Schema (current):
  - `polls(id TEXT PK, question TEXT, options TEXT /*JSON array*/, open INT DEFAULT 1, created_at INT)`
  - `votes(poll_id, voter, opt, ts, PK(poll_id, voter))`, one vote per phone (localStorage voter id), changeable
  - `counts(poll_id, opt, n, PK(poll_id, opt))`
- Routes: `GET /<id>` vote page · `GET /` newest open poll · `GET /api/poll/<id>` · `POST /api/vote/<id> {opt, voter}`.
- No `wrangler.toml` existed (it was deployed via the API). One is drafted in `poll/wrangler.toml`; verify it against the account before deploying. The DB holds one leftover `test` poll, which is safe to delete.
- An old prototype deck generator (`build_deck.py`: QR + live bars) lives in the claude.ai project "SL5 etc."; for reference only.

## Environment: Claude Code on the web (cloud)
- Sessions run in a cloud container on this GitHub repo. Nothing local; the user previews via deployed URLs.
- **Deploying to Cloudflare:** prefer the Cloudflare MCP connector if the session has it (the worker was originally deployed via the API). Otherwise use wrangler non-interactively with the `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env vars (token scopes: Workers Scripts:Edit, D1:Edit) set in the cloud environment settings. `wrangler login` won't work here.
- Use a separate preview worker or route for work in progress (e.g. `vote-dev`), so the live `vote` worker stays stable.
- **Assets** arrive via commits to `assets/` (the user uploads through the GitHub web UI) or as chat attachments; commit attachments into `assets/`.
- Visual checks: Playwright + Chromium screenshots at 1920×1080. Send the user the deployed preview URL after each milestone.
- The claude.ai project "SL5 etc." holds the same CLAUDE.md/PLAN.md under `claude/sl5-talk-handoff/` (if this session is attached to it).

## Required poll upgrades (from PLAN.md, "Poll mechanics")
- **One QR for the whole talk.** Phones open `/` and follow a server-side **current poll pointer** set by the deck when it enters a vote slide. Group B1→B2→C chains on the phone. At the end, phones land on the links page.
- **Admin token** (`wrangler secret put ADMIN_TOKEN`): set current, open/close, reset all/one, export CSV. Phone-friendly admin page.
- **Rehearsal vs live separation**, so test votes can never leak into the talk.
- Pre-talk checklist: reset → confirm 0 votes everywhere → open warm-up → show S0.
- ⚠️ **Request volume:** Workers Free = 100k requests/day. 300 phones polling every 1.5s ≈ 200 req/s ≈ 240k requests in 20 min, which **exceeds the free tier**. Choose one: Workers Paid ($5/mo; simplest), slower polling only while the page is visible, or Durable Object WebSockets. Decide with the user.

## Related sources
- SL5 simulator repo `nitzpo/sl5` (public): `app/public/data/blocks-*.json` (the 47 block names for S10 tiles; 6 categories: network 7, machine 9, physical 7, personnel 9, supply-chain 7, ai-specific 8); `research/sl5_standard.txt` + `research/rand_full.txt` (clause snippets for the S10 "flood").
- Simulator GIF: the user will provide the original file (fallback: the Medium post copy, or record https://nitzpo.github.io/sl5/ with Playwright).
- Links page targets: https://nitzpo.github.io/sl5/intro/ · https://github.com/nitzpo/sl5 · RAND report https://www.rand.org/pubs/research_reports/RRA2849-1.html · SL5 Standard https://sl5.org · LinkedIn https://www.linkedin.com/in/nitzan-pomerantz/.
- Notion (if a Notion MCP is connected): talk page https://app.notion.com/p/40b58933bf32804392acf9d8821a17c8 · plan https://app.notion.com/p/41158933bf32810aaf6dc2cc614e2954 · titles https://app.notion.com/p/41158933bf328102b582e1bd066fec2b

## Assets (`assets/`)
The user generates the photoreal images in Gemini (Nano Banana Pro); prompts are in PLAN.md. Expected files: `01-datacenter.jpg` ✅ · `02-microsd.jpg` ✅ · `03-bright-servers.jpg` (1:1) ✅ · `04-dark-rack.jpg` (1:1) ✅ · `05-fortress.png` · `06-construction.png` · `07-vault.png` · `08-jet.png`. Optional Veo loops: `01/03/04/07-*.mp4` (muted, looped).
- `08-jet.screenshot.png` is a 1518×786 screenshot placeholder with black bars and a near-black (not pure black) background. Feather its edges into the slide; don't use a screen blend (the jet body is dark).
- Use placeholders until the real files arrive; images are not blocking.

## Dev commands
- Poll worker local: `cd poll && printf 'ADMIN_TOKEN=devtoken123\n' > .dev.vars && npx wrangler d1 migrations apply DB --local --env dev && npx wrangler dev --env dev --port 8787`
- Poll API tests (local/dev only, mutate state): `npm run test:poll` (BASE, ADMIN_TOKEN env).
- Deck local: `python3 -m http.server 8080 -d deck/public` → `http://localhost:8080/?api=http://localhost:8787`
- Screenshots + contact sheet: `node tools/shoot.mjs --url <deck url> --out <dir> [--only s7,s10] [--projector] [--cut]`
- Poll content lives in `poll/src/polls.js`; after editing run `node tools/gen_deck_polls.mjs` (deck copy).
- Admin page: `<poll host>/admin` (dev: https://vote-dev.nitzpo.workers.dev/admin). Reset = per-poll Reset, "Reset all votes in run", or "New rehearsal run" (clean slate, history kept). Talk day: "New LIVE run".
- Deck keys: →/Space/PgDn next · ←/PgUp back · F fullscreen · B/. black · N notes HUD · T start timer · C 15-min cut · H show-of-hands · K admin key · A open admin page · P re-push poll state · G go to slide.
- Deploy = Workers Builds (git push):
  - `vote` ← `main` only (live; runs D1 migrations on `ted-polls`). Merging to `main` = going live.
  - `vote-dev` ← every branch (+ `main`), `--env dev`, D1 `ted-polls-dev`. Admin token: ask Nitzan / set via API.
  - `sl5-deck` ← `main` = production; other branches = Worker Previews (`<branch>-sl5-deck.nitzpo.workers.dev`, uses `vote-dev`).
- ⚠️ Learning: CSS class collision blacked out the deck (`body.cursor` state flag vs S1b's `.cursor` SVG with `opacity:0`). Body/state classes use `show-*`/`is-*`; slide-local classes get a slide-specific name.
  - ⚠️ Learning: Workers Builds overrides the Worker name with the connected Worker, so `wrangler deploy --env dev` in `vote`'s branch trigger deployed to **live `vote`**. Never deploy another worker from a build trigger; each worker gets its own build config.

## Workflow
1. **First task:** read this file + PLAN.md, then propose an implementation plan: stack (plain HTML/JS vs a framework), file layout, milestones, poll API/schema changes, request-volume choice, speaker-notes approach (presenter window via a second screen, and/or a phone notes+clicker page, since a second screen isn't guaranteed). End with unresolved questions. **No code until approved.**
2. Suggested milestones: M1 poll backend + phone/admin pages + deck skeleton with all poll slides (test early with real phones) → M2 Parts 0–2 → M3 Parts 3–6 → M4 polish, speaker notes, 15-min cut toggle, offline backup → M5 dress-rehearsal checklist.
3. After each slide, verify with Playwright screenshots at 1920×1080 (plus one low-contrast "projector" check: `tools/shoot.mjs --projector`).
   - ⚠️ Learning: static screenshots miss motion/interaction bugs (black page on mouse move, S6 entry flash, crash when first live slide ≠ S0). Before reporting UI work, run `tools/walk.mjs` (real-time video: forward clicks, mouse moves, back nav), review its frame sheets, and send Nitzan the mp4. Also test a reload mid-deck.
4. Commit small; concise messages.
