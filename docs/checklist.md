# Talk-day checklist (Nov 22)

URLs: deck `https://sl5-deck.nitzpo.workers.dev` · phones `vote.nitzpo.workers.dev` · admin `vote.nitzpo.workers.dev/admin` · presenter `https://sl5-deck.nitzpo.workers.dev/presenter.html` · offline `…/offline.html`. Token: the admin token.

## Before (≥1 day)
- [ ] PR merged → `vote` (live) + `sl5-deck` deployed; live `ADMIN_TOKEN` set; `/admin` login works.
- [ ] Real-phone test on live: rehearsal run → scan S0 QR, vote all 5 polls, see bars move, reset.
- [ ] `offline.html` saved to USB stick + laptop desktop; opened once from the file (no network) → slides OK.
- [ ] Ask organizers: slot length (17 or 15 min), clicker model, laptop (own or venue), second screen?, Wi-Fi for audience.
- [ ] No load tests on talk day (free tier: 100k requests/day per account; a talk ≈ 40k).

## At the venue (T−45 min)
- [ ] Chrome → deck URL. **Before the projector shows the laptop:** `K` → type the admin key (hidden field; or open the deck with `#key=<token>`). Toast "Phones → warm" = phones on the warm-up. Status dot (bottom-right, shows only while the mouse moves): green = OK, red = poll-server problem; press `N` to read the reason.
- [ ] Slot is 15 min? Press `C` (15-min cut: drops S9). HUD `N` shows "15-MIN CUT".
- [ ] Clicker: next / back / black (`B` or `.`) all work. If not: phone remote.
- [ ] Presenter view: `S` on the laptop (drag window to the laptop screen) and/or phone → presenter URL → token. Tap Next on phone → deck moves (≈1s). In the presenter window, `H` `P` `N` `T` act on the deck too.
- [ ] Back to the deck window with Alt+Tab / Cmd+` (a click on the slide would advance it), then `F` (fullscreen) **last**: pop-ups (S, A) leave fullscreen.
- [ ] Admin (phone): **New LIVE run** → all counts 0 → deck on S0 → press `P` (toast "Phones → warm").
- [ ] Own phone: scan the S0 QR → warm-up question shows. Don't vote (it would count), or vote "None of the above".

## During
- Network dies → poll slides switch to show of hands after 5s (automatic). `H` forces show-of-hands mode.
- Phones stuck on an old question → `P` re-pushes what phones should show at the current slide (toast says where they went, or that it failed). Going forward (→, `G`, presenter jump list) moves phones automatically; going back never does.
- Deck/laptop dies → `offline.html` from USB (no polls; show of hands). It has no presenter window and no phone remote; `N` would show the notes on the big screen.
- Lost place → presenter: tap slide id → jump list. Deck: `G` + slide id (e.g. `s10` or `s10.2`; a typo stays put).
- Timer starts when you leave S0; presenter shows ahead/behind vs plan.
- Phones: a phone that was in another app catches up the moment it comes back. Once a phone reaches the links page (S20) it stays there for good (its URL becomes `/links`), even if you go back to an earlier slide in Q&A; to bring it back, scan the QR again.

## After
- [ ] Admin → Export CSV (live run). Screenshot results. Optional: share stats.
- [ ] Venue laptop: `K` → empty → Enter (removes the admin key from that browser). Later: rotate `ADMIN_TOKEN` if it was typed on a borrowed laptop.
