# Talk-day checklist (Nov 22)

URLs: deck `https://sl5-deck.nitzpo.workers.dev` · phones `vote.nitzpo.workers.dev` · admin `vote.nitzpo.workers.dev/admin` · presenter `https://sl5-deck.nitzpo.workers.dev/presenter.html` · offline `…/offline.html`. Token: the admin token.

## Before (≥1 day)
- [ ] PR merged → `vote` (live) + `sl5-deck` deployed; live `ADMIN_TOKEN` set; `/admin` login works.
- [ ] Real-phone test on live: rehearsal run → scan S0 QR, vote all 5 polls, see bars move, reset.
- [ ] `offline.html` saved to USB stick + laptop desktop; opened once from the file (no network) → slides OK.
- [ ] Ask organizers: slot length (17 or 15 min), clicker model, laptop (own or venue), second screen?, Wi-Fi for audience.
- [ ] No load tests on talk day (free tier: 100k requests/day per account; a talk ≈ 40k).

## At the venue (T−45 min)
- [ ] Chrome → deck URL → `F` fullscreen. Add the key: `K` (or open the deck with `#key=<token>`). Status dot (bottom-right, shows only while the mouse moves): green = OK, red = poll-server problem; press `N` to read the reason.
- [ ] Slot is 15 min? Press `C` (15-min cut: drops S9, S19). HUD `N` shows "15-MIN CUT".
- [ ] Clicker: next / back / black (`B` or `.`) all work. If not: phone remote.
- [ ] Presenter view: `S` on the laptop (drag window to the laptop screen) and/or phone → presenter URL → token. Tap Next on phone → deck moves (≈1s).
- [ ] Admin (phone): **New LIVE run** → all counts 0 → back to deck, `#s0` (sets phones to warm-up; `P` re-pushes if needed).
- [ ] Own phone: scan the S0 QR → warm-up question shows. Don't vote (it would count), or vote "None of the above".

## During
- Network dies → poll slides switch to show of hands after 5s (automatic). `H` forces show-of-hands mode.
- Phones stuck on an old question → `P` on the current slide re-pushes poll state.
- Deck/laptop dies → `offline.html` from USB (no polls; show of hands).
- Lost place → presenter: tap slide id → jump list. Deck: `G` + slide id.
- Timer starts when you leave S0; presenter shows ahead/behind vs plan.

## After
- [ ] Admin → Export CSV (live run). Screenshot results. Optional: share stats.
