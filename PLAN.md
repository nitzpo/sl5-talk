# PLAN: Ctrl+C, Ctrl+V a Fighter Jet

Mirror of the Notion plan, **draft v7 (Nov 13 2026)**: https://app.notion.com/p/41158933bf32810aaf6dc2cc614e2954
Notion is the source of truth; this file is re-synced when Nitzan says "plan updated".
**On screen** = what the audience sees. **Say** = speaker notes (never on screen). **Notes** = facts, branches, build hints.

Subtitle (Claude's pick for now): *What it takes to stop a superpower from stealing frontier AI*

## Spine
1. The weights *are* the weapon, and stealing them is silent.
2. By voting, the room rebuilds RAND's attacker ladder and learns that labs sit well below where they'd need to be.
3. SL5 is huge. RAND and Security Level 5 laid out the building blocks, but nobody put a price or a schedule on them.
4. The polls set a trap: most people will choose "wait until it looks dangerous", but the defenses take ≈4 years to build and the theft sends no signal.

Close: this is an engineering fight, and this room knows how to win it.

Anchors: SL5 is complex · Reactive isn't enough · Starting early is what works (kept vague, no scenario numbers) · The simulator builds intuition; it's not a plan · "I'd rather fix a number than defend it."

## Visual language
- Near-black background, off-white text, one accent (signal amber) plus alarm red reserved for "stolen" moments. Monospace for files and terminals; a heavy grotesk for statements.
- Recurring character: the file icon `weights.bin · 2.0 TB`. Born in S1, copied in S2, cloned in S3, buried under 47 tiles in S10, locked in a vault in S21.
- Real artifacts over designed graphics (Nov 13): news screenshots, photos and real document excerpts beat boxes, arrows and text cards. Less text on screen.
- Rhythm: alternate 🎬 CINEMATIC → 😄 FUNNY → ⬛ PLAIN (+ 📱 POLL). The plain slides are deliberate: they earn trust from a cynical room and make the jokes land.

## Run-of-show (≈17:50 with v6 additions)
| Part | Time | Slides | Job |
|---|---|---|---|
| 0 Pre-show | before start | S0 | Warm-up poll; gets phones onto the page |
| 1 The heist | 0:00–3:20 | S1a–S3c | Stakes: weights = the weapon; theft is silent |
| 2 Who's talking | 3:20–4:05 | S4 | Warm-up results + credential line |
| 3 How hard is it to steal? | 4:05–6:50 | S5–S7 | Poll A → RAND ladder (S8 cut) |
| 4 Why SL5 is so hard | 6:50–9:50 | S9–S12 | Wall of text, two-person gag, credit to RAND + Security Level 5 |
| 5 When do you lock the doors? | 9:50–14:35 | S13–S17 | Polls B1/B2/C → calendar trap + RAND quote → silent-twin callback |
| 6 Call to arms | 14:35–16:50 | S18–S21 | Bridge, this room, links, thank you |

Per-slide times below are from before S8 was cut.
Length ≈18:00 with everything (v7 +≈10s). **15-min cut**: dropping S9 and S19 and trimming S16 now gets to only ≈16:20. To reach 15:00, also drop S16 entirely and S11 (the LGTM gag). S1c stays in the cut. (v6, Nov 13: v6 added ≈60s; slide times below not shifted. Nitzan: handle the cut after finalization.)

---

## Part 0: Pre-show

### S0 · before start · 📱 POLL (warm-up)
- **On screen:** the title slide itself, up during changeover / MC intro: title, subtitle, speaker's name. In the corner, a QR with the call to action **"Scan → pick a side"** and a live counter ("143 in the room"). The question appears only on phones: "Which side are you on?" A dimmed datacenter loop (#01) behind; under the title, `$ scp weights.bin` types itself out.
- **Poll `warm`:** Red team (I break in) · Blue team (I keep them out) · **Both, depends on the contract** · AI (research, safety, security) · None of the above (on phones only).
- **Say:** nothing (the MC is talking). If a holding slide isn't allowed, use the first 20s of the talk: "Scan this now, you'll need it later. One question, five seconds."
- **Notes:** one scan covers the whole talk; the phone auto-advances to each later poll. Needs organizer OK to put it up before the talk. "(on phones only)" = the question is shown on phones only; all 5 options get bars on S4/S19 (Nitzan, Nov 7). "N in the room" = phones that answered the warm-up.

## Part 1: The heist

### S1a · 0:00 · 🎬 #01 datacenter (+ optional Veo loop) + 😄 kiss-cam clip (Nitzan's upload)
- **On screen:** black → a datacenter at night fades up, slow push-in. Amber counters tick in one by one: "Billions of dollars" · "100,000 GPUs" · "6 months".
  - **Nvidia gag (click on "buy the chips"):** a kiss-cam frame built in code pops up top-right. Banner "♥ ~~KISS CAM~~ EXPORT CONTROL CAM ♥"; inside it the clip plays (muted, 6s, `kisscam-clip.mp4`); ticker "MEGASPEED · SINGAPORE · 240,000 GPUs (ALLEGED) · ✅ APPROVED"; corner credit "AI video: @dedene". ≈6s, then fades. Counters stay visible.
  - Deck (Nov 13): built as click 4 on S1a (Nitzan's call after Claude flagged the risk of an AI-made intimate depiction of real people; he judged it widely seen and recognizable). Clip muted, "AI video: @dedene" credit always visible.
- **Say:** "Put on your offensive hat for sixty seconds. Imagine your unit is given a target: a frontier AI lab in California. To build their latest AI model (what we call **pre-training**), that lab had to spend billions of dollars, build a massive power station, and run 100,000 export-controlled GPUs for six months straight. Your country doesn't have the billions, and because of sanctions, you aren't allowed to buy the chips."
  - (On the click; pick one at rehearsal.) Gemini: "...Well, unless you meet the CEO of Nvidia at a bar in Taipei, in which case getting 100,000 export-controlled GPUs is surprisingly affordable." Claude: "…Well, unless your data-center executive has dinner with the CEO of Nvidia in Taipei. Then, allegedly, you get access to 240,000 of them."
- **Notes:** on-screen GPU count matches the script. **Nvidia gag facts:** Jensen Huang resigned Nov 12, 2026, so on Nov 22 say "last week". Alice Huang, a Megaspeed (Singapore) executive, is suspected by US intelligence of spying for China but has not been charged. Megaspeed is under investigation in the US and Singapore for allegedly smuggling access to 240,000 restricted chips. The Taipei meeting was a restaurant dinner (May 2025), not a bar. The clip is an AI edit by Peter Dedene: label it, keep it muted. Re-check the news on Nov 21. Only Nvidia reference in the talk.

### S1b · 0:40 · 😄 (+ #02 microSD)
- **On screen:**
  - Click 1: everything collapses into one small glowing file icon `model_weights.bin · 2.0 TB`.
  - Click 2: a microSD on a fingertip with a "$160" tag. A copy progress bar stalls → OS dialog **"Not enough space. Delete 'Call of Duty' to continue?"** [Cancel] [Delete] → the cursor clicks Delete.
- **Say:** "But here is the crazy thing about AI: when that training run finishes, what actually comes out the other end? A single 2-terabyte file of numbers. That file is the **model weights**: the actual trained brain of the AI. And 2 terabytes is nothing. You can fit a multi-billion-dollar superintelligence on a $160 SD card the size of your fingernail. You just have to delete Call of Duty first."
- **Notes:** $160 = a 2TB SanDisk microSD. A 2TB file fills a 2TB card (hence "delete Call of Duty first").

### S1c · 1:15 · ⬛ "What's in the file?" (target package)
- **On screen:** a paper "target package" slides in: TARGET Frontier AI lab, California · OBJECTIVE `model_weights.bin` (2.0 TB) · FITS ON One $160 microSD. Under "WHAT WE GET", three blacked-out lines.
  - Clicks 1–3: each line is un-redacted: **1. Cyber offense** · **2. Bio & chem weapons uplift** · **3. A head start on the next model** (highlighted, + a PRIORITY stamp).
  - Footer: "Payoff list = risks tracked in the labs' own safety frameworks".
- **Say:** "So what's actually in that file? Picture the target package your unit just got. [click] One: cyber offense. A model that helps your hackers. [click] Two: help with biological and chemical weapons. [click] And three, the one a superpower wants most: a head start on the next model. Steal this one, and it helps you build the one after it. And that's not my list. Those are the risks the labs' own safety frameworks track."
- **Notes:** new (Nov 8): states the impact before S2, so "national security target" is earned; sets up S3b's guardrails. ≈20s; stays in the 15-min cut. "FITS ON", not "cost": a cost line would prime Poll A. Fact: bio/chem + AI R&D tracked by Anthropic, OpenAI, Google DeepMind; cyber by OpenAI + Google DeepMind only (no cyber threshold in Anthropic RSP v3.4). Say "the labs'" (together), not "every lab".

### S2 · 1:35 · 😄 (+ #08 jet)
- **On screen:** split screen.
  - Top, "Old espionage": `F35_Blueprints.pdf` → Ctrl+C, Ctrl+V → `F35_Blueprints (Copy).pdf` → giant red stamp "10 YEARS + FACTORIES REQUIRED".
  - Bottom, "AI espionage": `frontier_weights.bin` → Ctrl+C, Ctrl+V → a fully built jet pops onto the screen, engines running, and flies off.
- **Say:** "Think about how different that is from every other national security target in history. In the old world, if your spies broke into Lockheed Martin and stole the complete plans for an F-35 fighter jet, what did you actually have? You had a great PDF. You still didn't have an air force. To turn that PDF into an airplane, you still needed giant factories, rare materials, and ten years of hard engineering. And this actually happened: in 2016, a man pleaded guilty to helping China steal F-35 data. China still had to build its own plane. With AI, 99% of the time and money goes into *creating* the weights; *running* them is cheap. Once someone steals that 2-terabyte file, they can run it the next morning on a few racks of servers. For the first time in history, stealing the file isn't stealing the plans for the jet. It's hitting Ctrl+C, Ctrl+V on the finished jet itself."
- **Notes:** "servers", not "ordinary servers" (a 2TB model needs GPU servers). Real case: DOJ (fact sheet). "99%" is true for the attacker running one copy.

### S3a · 2:30 · 🎬 #03 + #04 (split)
- **On screen:** left, a sunny San Francisco server room with green lights: "API Online · Safety Evals: PASSED ✅". Click: on the right, a dark air-gapped rack 6,000 miles away fades in, running an identical glowing brain.
- **Say:** "And here is the part that should scare every defender: if someone steals physical weapons or sabotages a machine, something is missing or an alarm goes off. When a nation-state steals AI model weights, *nothing breaks*. The lab's servers keep humming. Meanwhile, 6,000 miles away, an identical twin wakes up on an air-gapped cluster."
- **Notes:** the "silent twin" comes back in S17. Plant it clearly here.

### S3b · 2:55 · 😄 overlay on S3a
- **On screen:** on the dark side, a progress bar: `Removing_Safety_Guardrails.py... 100%` → "1 GPU · under $200".
- **Say:** "And what about all the millions of dollars the lab spent on 'AI Safety' and alignment, so the model refuses to help hackers or build bioweapons? All of that safety lives inside those same weights. The moment an attacker has the file on their own servers, a researcher can strip out the safety guardrails with one GPU and under $200 of fine-tuning."
- **Notes:** source gives cost + one GPU, no time (Lermen, Rogers-Smith, Ladish 2023, Palisade).

### S3c · 3:10 · ⬛
- **On screen:** black. One line: **"AI alignment without nation-state cybersecurity is just free R&D for your adversary."**
- **Say:** "Spending $50 million aligning a model on a breachable server is like putting a 'Do Not Steal' sticker on a suitcase full of cash. AI alignment without nation-state cybersecurity is just free R&D for your adversary."
- **Notes:** the banner line is on screen; the sticker line is spoken just before it.

## Part 2: Who's talking

### S4 · 3:20 · 📱 warm-up results
- **On screen:** warm-up result bars animate in. The speaker's name in small type in the corner.
- **Say:** "Quick look at who's here… Hi, I'm Nitzan. For years I led security architecture for critical infrastructure here in Israel, the kind of place where developers and researchers work on the inside of the air gap. Mostly, that meant being the guy who says no to the researcher with the USB stick."
- **Notes:** sets up the KSP callback in S16. Optional branch if offense > defense: "Okay. I'll keep an eye on my laptop." If the warm-up is dropped: same line on a plain name slide.

## Part 3: How hard is it to steal?

### S5 · 4:05 · 📱 Poll A vote
- **On screen:** the question, big, in plain English: **"You need to steal the flagship model weights from a top-3 AI lab today. What is the MINIMUM attacker needed to pull it off?"** Four options. "It's already on your phone" + a small QR + live counter. **No SL labels.**
- **Poll `A`:** A $1M budget: a top-tier crime syndicate or one insider · A $10M budget: a standard state cyber operation · A $1B budget: a superpower's top-priority operation · Impossible, even for a superpower.
- **Say (while voting, ≈60s):** "No jargon yet, just your gut… And no, the insiders in the room don't get to vote twice."
- **Notes:** budgets = RAND tiers (OC3 $1M · OC4 $10M · OC5 $1B).

### S6 · 5:05 · 📱 Poll A results
- **On screen:** the bars animate in; the leading bar glows amber.
- **Say:** "Look at the screen. Most of you voted that [leading option] could steal the weights today, and almost nobody voted for #4." (Say the #4 part only if it's true.)
- **Branches:**
  - "Impossible" > 10%: "To the X% who said impossible: I'd love to buy you a drink after. I also have a bridge to sell you."
  - Most pick 3 ($1B): "You're generous to the labs. Let's see if they agree."
- **Notes:** never pre-script the result; rehearse all the branches.

### S7 · 5:35 · ⬛ RAND ladder (animated build)
- **Deck:** S6 + S7 are one view: the Poll A bars morph into the rungs ($1B → SL5, $10M → SL4, $1M → SL3, Impossible above SL5); the room's % stays on each rung (Nitzan, Nov 7).
- **On screen:** the bars morph into a 5-rung ladder.
  - Click 1: SL1→SL5 rungs, each with who it stops (people icons, budget, time).
  - Click 2: a marker at SL3: "Frontier labs: roughly here, or below".
  - Click 3: a quote under SL4: "Top cyber nations run these more than 100 times per year." (RAND)
  - Footer: RAND RR-A2849-1 (Nevo et al., 2024).
- **Say:** "Without knowing it, you just recreated the exact framework that defines our field. Two years ago, researchers at RAND published the foundational report on **Securing AI Model Weights**. Instead of defining security by compliance checklists, they defined **5 Security Levels, SL1 through SL5**, based purely on who can break into your lab: SL1 & SL2 stop amateurs and professional hackers. SL3 stops cybercrime syndicates and insiders (≈$1M). **This is roughly where top frontier labs sit today, or below.** SL4 stops a standard operation by a state cyber unit (≈$10M), the kind top cyber nations run more than a hundred times a year. SL5 defends model weights against a **≈$1B, multi-year priority campaign by the world's top cyber superpower.**"
- **Notes:** RAND: OC3 = crime/insider ≤$1M → SL3; OC4 = standard state op ≤$10M, ≈1 yr → SL4; OC5 ≤$1B, years → SL5.

### ~~S8~~ · CUT (Nov 7)
- Was: black, "Achieving SL5 is currently not possible." (RAND, 2024). Cut because it spoiled poll B2 and the S15 reveal. **The RAND quote moves to S15's last click.**

## Part 4: Why SL5 is so hard

### S9 (optional, first to cut) · 7:20 · 😄 #05 fortress + terminal
- **On screen:** a fortress wall of enterprise security labels (SSO · EDR · Zero Trust · SOC 2) with a wide-open side door, where a researcher types `pip install turbo-weights-v2` (Author: `dark_wizard_99`, Created: 14 mins ago). Optional click: stamp "REAL: torchtriton, Dec 2022".
- **Say:** "Why can't top Silicon Valley security (Okta, Zero Trust, SOC-2) stop an SL5 attacker? Because enterprise security is built to stop ransomware gangs while letting employees work fast. And try telling a PhD machine learning researcher making $2 million a year that he can't `pip install` a random Python package written yesterday by an anonymous guy on GitHub named `dark_wizard_99`, because it makes his training curve converge 2% faster." Optional: "And `dark_wizard_99` is real. In December 2022 his name was torchtriton: PyTorch's own nightly build pulled in a malicious package that read people's SSH keys."
- **Notes:** text labels, no real vendor logos.

### S10 · 8:05 · 😄 wall of text
- **On screen:**
  - Click 1: 3 clean cards: `1. Network Air-Gaps` · `2. Secure Hardware` · `3. Insider Controls`. New click (on "That's not theoretical"): the cards fade and two real news clippings land on top: ABC News ("OpenAI employee arrested for listening device communicated with Saudi royal, feds say") and Al Jazeera ("OpenAI engineer charged after listening device found in meeting room"). Screenshots, outlet names visible (`assets/news/`).
  - Click 2: they split into **47 boxes** in 6 colored groups, with real names from the catalog (`nitzpo/sl5` `app/public/data/blocks-*.json`).
  - Click 3: rapid zoom-out flood: hundreds of tiny SL5 sub-clauses fill the whole screen; the weights.bin icon is buried in the middle.
- **Say:** "When people first hear about SL5, they think it's just three bullet points: isolate the network, lock down the hardware, and watch for insiders. That's not theoretical. Last month an OpenAI engineer, a Saudi national, was arrested for hiding a listening device in the TV of an executive conference room. Prosecutors say he was in touch with a member of the Saudi royal family. Then you open the actual RAND report and the SL5 Standard. RAND maps 38 attack vectors, and the defenses turn into 47 major engineering programs. And underneath those are hundreds of brutal physical, silicon, and operational requirements. I am not going to read this slide. No human can hold this list in their head at once."
- **Notes:** 38 attack vectors in 9 categories (RAND). 47 programs: Network 7 · Machine 9 · Physical 7 · Personnel 9 · Supply chain 7 · AI-specific 8. Snippets from `research/sl5_standard.txt` + `rand_full.txt`. OpenAI case: arrested ≈Oct 9, charges unsealed Oct 13, 2026; the Saudi-royal contact is a prosecutors' allegation, keep "prosecutors say". OpenAI says no weights were taken (Q&A). It sits here, not at S7's SL4 rung, so it doesn't imply a proven state operation.

### S11 · 9:05 · 😄
- **On screen:** split. Left, "SL5 Two-Person Rule": two people, two keys, a vault. Right, "Startup Two-Person Rule": a PR at "+4,012 −0", review "LGTM 👍" posted "12 seconds later", reviewer's Slack status "🚽".
- **Say:** "It goes all the way down to real Two-Person Rules, where two people physically authorize every sensitive action together. Not the startup version, where one engineer writes a 4,000-line pull request and another engineer types 'LGTM 👍' twelve seconds later from the bathroom."

### S12 · 9:35 · ⬛ credit cards
- **On screen:** two cards: **"RAND · Securing AI Model Weights (2024): the attacker tiers"** and **"Security Level 5 · SL5 Standard (2026): the building blocks"**. Click: a third card fades in, **"Price? Schedule?"**
- **Say:** "The good news: nobody has to start from zero. RAND and Security Level 5, a nonprofit that grew out of the SL5 Task Force, did the hard part, in the open. They coined the terminology, those attacker tiers, and laid out the building blocks of a defense. Nobody had done that before. What they don't do is put a price or a schedule on any of it. And the schedule turns out to be the whole story."
- **Notes:** rewritten Nov 7 in Nitzan's blog wording. Credits RAND + Security Level 5 (sl5.org) and leads into Part 5 (time) without simulator numbers.

## Part 5: When do you lock the doors?

### S13 · 10:20 · 📱 Polls B1 + B2 + C vote (chained on the phone)
- **On screen:** "3 quick questions, on your phone now". The three question cards, each with its own live counter. QR in the corner.
- **Poll `B1`:** "If you lock an AI lab inside that wall of SL5 controls today (strict air-gaps, no open internet, real two-person rules for every action), how much does it slow down AI research?" → Barely (<10%) · Painful (10–30%) · Very painful (30–50%) · Crippling (>50%, top researchers quit)
- **Poll `B2`:** "Given that slowdown and the billions it costs, if you are a lab CEO racing competitors toward AGI, when do you actually lock down to SL5?" → Start right now · Wait until models start looking dangerous ("Just-in-Time") · Never, winning the race matters more
- **Poll `C`:** "What is the probability that the raw weights of at least one frontier model have ALREADY been silently stolen by a foreign intelligence service?" → High (>70%) · Moderate (30–70%) · Low (<30%)
- **Say (≈90s):** read each question once. "Be honest on the CEO one."
- **Notes:** the phone chains B1 → B2 → C. Results are revealed after all three.

### S14 · 11:50 · 📱 B1 + B2 results
- **On screen:** B1 and B2 bars side by side, with the "heavy slowdown" share and the "Just-in-Time" bar highlighted together.
- **Say:** "So X% of you think SL5 hurts research a lot, and Y% would wait until the models look dangerous. That's the pragmatic answer. It's what I'd have said. It's also the answer that loses."
- **Branches:**
  - "Start right now" wins: "Most of you would start now. Your future CFO disagrees. Let's see why you're right."
  - "Never" > 15%: "And to the X% who said never: at least you're honest."
- **Notes:** publishable stat: "X% of security practitioners expect SL5 to slow research by more than 30%, yet Y% would wait for dangerous capabilities before locking down."

### S15 · 12:35 · ⬛ calendar Gantt (#06 dimmed behind)
- **On screen:** a timeline from 2026 to 2032.
  - Click 1: a marker "Models look dangerous" drops in at 2028.
  - Click 2: bars grow from the marker: "Classified facility: up to 4 years" and "Custom silicon: 4+ years". They end around 2032.
  - Click 3: one line: **"The bottleneck isn't money. It's the calendar."**
  - Click 4: the RAND quote, **"Achieving SL5 is currently not possible."** (RAND, 2024)
- **Say:** "Here's why 'Just-in-Time' fails. **The bottleneck isn't money; it's the calendar.** Building a shielded facility enclave or custom hardware takes **up to 4 years**. The clock starts when you decide, not when you break ground. No budget compresses a 4-year calendar." Optional on click 4: "RAND said it back in 2024: achieving SL5 is currently not possible. Now you know why."
- **Notes:** no scenario numbers ($1.7B etc. dropped). Facility takes up to 4 yrs, partly on a government's calendar.

### S16 (trim in the 15-min cut) · 13:20 · 😄 simulator GIF + USB gag
- **On screen:**
  - Click 1: the simulator GIF plays, with no numbers on screen; caption `nitzpo.github.io/sl5`.
  - Click 2: an air-gap wall animation: a researcher hops over it holding a USB stick tagged "$12 · KSP".
- **Say:** "You can't hold 47 interacting controls in your head to see what being two years late costs. So I vibe-coded an open-source interactive simulator, the **SL5 Explorable**, to build some intuition. Every run says the same thing: the programs that do worse fail on timing, not on money. And it taught me that controls don't work alone: if you put up an air-gap with no sanctioned way to move files, your smartest researcher just buys a $12 USB stick at KSP and becomes your new network router." "Remember, I used to be the guy saying no to him."
- **Notes:** last line is a callback to S4.

### S17 · 14:05 · 📱 C results → 🎬 silent-twin callback
- **On screen:**
  - Click 1: C bars.
  - Click 2: the silent-twin split from S3 returns, dimmed.
  - Click 3: a real news clipping: The Hacker News, "Anthropic Says Seven China-Based AI Labs Ran Industrial-Scale Claude Distillation Attacks" (headline + the article's illustration).
  - Click 4: back to the silent twin, no text (Nov 13: on-screen line "Just-in-Time needs a warning…" removed, Nitzan didn't like it; the closer is spoken).
- **Say:** "And X% of you think it may already have happened. Remember the silent twin. If it had, what would we see? Nothing. Maybe it hasn't happened yet, because right now there's a cheaper way: distillation. You copy a model by asking it millions of questions. Anthropic says it caught seven Chinese labs doing that this year, and there's no clean fix. That's why the most capable models will probably never get a public API. They'll stay inside the lab, and a model that stays inside can't be distilled. It can only be stolen. 'Wait until it looks dangerous' assumes you'll get a warning. The theft doesn't send one. And the building takes four years."
- **Branch:** C mostly "Low": "Most of you think it hasn't happened yet. Good. Then the clock is still running."
- **Notes:** the core trap linking B2 and C. Distillation: Anthropic reported seven China-based distillation campaigns in 2026 (Sept report; the largest, Alibaba-affiliated, ≈151M exchanges). "The most capable models stay off public APIs" comes from the Security Level 5 interview (unverified word for word), so say it as your own view. The SL5 Standard lists model outputs as assets to protect because they "could be used to distill".

## Part 6: Call to arms

### S18 · 15:05 · ⬛
- **On screen:** two lines, one after the other: "Alignment: an unsolved *science* problem." / "Securing the weights: a *systems-engineering* fight." Click 3: a real excerpt from the SL5 Standard site (standard.sl5.org → Threat Model), with the insider-threat sentence highlighted.
- **Say:** "Most of AI safety is trying to solve an unsolved science problem: how do you align a superintelligence so it doesn't turn on humanity? Nobody actually knows how to solve that yet. Securing the model weights is *not* an unsolved science problem. It is a brutal, messy systems-engineering fight against a nation-state adversary. And unlike alignment, **this is a fight the people in this room actually know how to win.**" (C, on click 3) "One more reason the AI-safety people here should care. The SL5 Standard already treats the model itself as a possible insider: a misaligned model that tries to sabotage research or copy itself out. The walls that keep a spy agency out are the same walls that keep the model in."
- **Notes:** the click-3 line is new in v6. Source: the SL5 Standard v0.1 counts misaligned AI that may "sabotage research or exfiltrate themselves" as "a distinct form of insider threat".

### S19 (optional) · 15:45 · 📱 warm-up callback
- **On screen:** the warm-up bars return: "Red team", "Blue team" and "AI (research, safety, security)" light up together.
- **Say:** "Half this room spent years getting into air-gapped networks. The other half spent years building them. And the AI people here know what's inside, and what might try to get out. This needs all of you."
- **Notes:** if the warm-up is dropped: plain text version.

### S20 · 16:15 · ⬛ links
- **On screen:** "It's on your phone now": phones have already switched to the links page. On screen, the key links and names, plus a small QR in the corner for latecomers:
  1. Understand it in 5 min: the intro (works on a phone)
  2. Break my simulator: GitHub
  3. Go deeper: the RAND report · the SL5 Standard
  4. Talk to me: LinkedIn / after the talk

  Small strip: "Already working on this: RAND · Security Level 5 · Irregular · Heron · Palisade · FAR.AI · UK AI Security Institute · US CAISI" (text, no logos).
- **Say:** "If any of this got under your skin, here's where to start. I would rather fix a number than defend it. Everything is open-sourced on GitHub. If you disagree with a number or an attack path, it's a one-file JSON change."
- **Notes:** phones still on the vote page switch to the links page automatically. Irregular is Israeli-founded; its CEO Dan Lahav co-wrote the RAND report.

### S21 · 17:00 · 🎬 #07 vault
- **On screen:** the weights.bin icon slides into a vault, the door closes, black. Then the name, the QR and "Thank you" stay up for Q&A. **No quote.**
- **Say:** pick at rehearsal:
  - Option B: "I started this to understand the problem myself. I'd love help from people who know parts of it better than I do, and a lot of you do. Thank you."
  - Option D: no extra line; end on the S20 ask, then "Thank you."

---

## Polls: final set
| ID | Where | Question | Options |
|---|---|---|---|
| warm | S0 → S4, S19 | Which side are you on? | Red team (I break in) · Blue team (I keep them out) · Both, depends on the contract · AI (research, safety, security) · None of the above |
| A | S5 → S6/S7 | You need to steal the flagship model weights from a top-3 AI lab today. What is the MINIMUM attacker needed? | $1M crime syndicate / insider · $10M standard state op · $1B superpower priority op · Impossible |
| B1 | S13 → S14 | Lock an AI lab inside SL5 today: how much does it slow research? | <10% · 10–30% · 30–50% · >50% |
| B2 | S13 → S14 | As a lab CEO racing toward AGI, when do you lock down to SL5? | Start right now · Wait until models look dangerous · Never |
| C | S13 → S17 | Probability the weights of a frontier model were ALREADY silently stolen by a foreign intelligence service? | High (>70%) · Moderate (30–70%) · Low (<30%) |

## Poll mechanics
- One QR for the whole talk. The phone page follows a server-side "current poll" pointer that the deck sets when it enters a vote slide. B1 → B2 → C are chained on the phone. At the end, phones land on the links page.
- Admin with a secret token: reset all (after rehearsal), open/close, set current, export CSV. Separate rehearsal and live namespaces so test votes can never leak.
- Pre-talk checklist: reset → confirm 0 votes on every poll → open the warm-up → put up S0.
- Any laptop: the deck runs from a URL in Chrome; a clicker works as the arrow keys. Backup on a USB stick: a local HTML copy + a PDF (no live polls).
- Fallback: if the network dies, each poll has a show-of-hands version. Never show fake numbers.
- Anonymous, counts only. The export feeds the post-talk stats.

## Image prompts (Nitzan generates in Nano Banana Pro / Veo)
Style block prepended to every prompt: "Cinematic film still, 16:9, low-key lighting, teal-and-amber color grade, anamorphic lens, shallow depth of field, subtle film grain, photorealistic. No text, no logos, no recognizable faces." Deliver ≥1920×1080, named `01-datacenter` … `08-jet` (#3 and #4 are 1:1; the rest are 16:9).

| # | Used in | Brief | Loop |
|---|---|---|---|
| 1 | S0, S1a | Aerial night view of a vast hyperscale AI datacenter campus in a desert: rows of long windowless halls glowing from within, a large electrical substation and power plant beside it, steam rising from the cooling towers, a line of headlights in the distance. Campus fills the lower two-thirds; dark empty sky in the upper third for the title. | Veo 6s: slow push-in |
| 2 | S1b | Extreme macro close-up of a fingertip holding a tiny unbranded black microSD card against pure black. Rim light on the card's edge, card in sharp focus, fingerprint ridges visible, lots of empty black space on the right. | – |
| 3 | S3a | Bright, clean, modern server room in soft California daylight from high windows: white floors, neat racks with calm green LEDs, airy, optimistic. 1:1, subject centered. | Veo 6s: LEDs blinking |
| 4 | S3a, S17 | Dark windowless server room in an unknown location: one isolated rack lit cold blue from within, faint haze, disconnected cables on the floor, one monitor glowing, ominous. 1:1, subject centered. | Veo 6s: LEDs + fan haze |
| 5 | S9 | Massive ancient stone fortress wall at dusk with a small modern side door wide open at its base, warm yellow light spilling out. Wall fills the frame left to right. | – |
| 6 | S15 | Early-stage construction site of a large windowless reinforced-concrete secure facility under heavy overcast: exposed rebar, cranes, mud, no workers. Slow and bureaucratic. Muted colors, wide shot, empty sky at the top. | – |
| 7 | S21 | Heavy circular steel vault door, almost closed, inside a dark data hall, a thin vertical strip of cold light escaping through the gap. Centered, deep shadows. | Veo 4s: door closing |
| 8 | S2 | Modern stealth fighter jet in side view on pure black: afterburners glowing orange, slight heat shimmer, no markings/insignia/numbers. Whole jet visible, centered, black space around it. | – |

## Fact sheet (only these claims; sources for verification)
| Claim | Source |
|---|---|
| OC/SL ladder: OC3 ≤$1M/months (+ insiders) → SL3 · OC4 ≤$10M/≈1 yr → SL4 · OC5 ≤$1B/years → SL5 | RAND RR-A2849-1 https://www.rand.org/pubs/research_reports/RRA2849-1.html |
| Top cyber nations run OC4-level ops "more than 100 times per year" | RAND |
| "Achieving SL5 is currently not possible" | RAND |
| 38 attack vectors in 9 categories | RAND |
| Labs roughly SL3 or below | Nitzan's article; Anthropic RSP (ASL-3 excludes sophisticated insiders, May 2025) https://www.anthropic.com/rsp |
| SL5 Standard v0.1 (Mar 2026): built on IL6 / ICD 705 / NIST 800-53, ≈20% novel AI-datacenter controls | Security Level 5's v0.1 post https://sl5taskforce.substack.com/p/releasing-the-sl5-standard-v01 |
| Safety fine-tuned away: <$200, one GPU (Llama 2-Chat 70B) | Lermen, Rogers-Smith, Ladish 2023 https://arxiv.org/abs/2310.20624 |
| Labs' own safety frameworks track bio/chem weapons uplift + AI that accelerates AI R&D (all three labs); cyber offense (OpenAI, Google DeepMind; not a threshold in Anthropic RSP v3.4) | Anthropic RSP v3.4 (Jul 2026) https://www.anthropic.com/rsp · OpenAI Preparedness Framework v2 (Apr 2025) https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf · Google DeepMind FSF v3.1 (Apr 2026) https://deepmind.google/frontier-safety/ |
| torchtriton malicious dependency in PyTorch nightly, Dec 25–30 2022 | https://pytorch.org/blog/compromised-nightly-dependency/ · https://www.reversinglabs.com/blog/pytorch-supply-chain-attack-dependency-confusion-burns-devops |
| Su Bin pleaded guilty (2016) to helping steal F-35/F-22/C-17 data for China; 46 months | https://www.justice.gov/opa/pr/chinese-national-who-conspired-hack-us-defense-contractors-systems-sentenced-46-months |
| 2TB microSD ≈ $160 | https://slickdeals.net/f/18883417-159-99-2tb-sandisk-extreme-microsdxc-uhs-i-memory-card-with-adapter-sdsqxav-2t00-gn6ma-at-amazon |
| Irregular (ex-Pattern Labs): CEO Dan Lahav co-authored the RAND report | https://www.irregular.com/news/securing-ai-model-weights |
| Event: Tel Aviv Frontier AI Security Forum '26, Nov 22, Tel Aviv Museum of Art, ≈300 people | https://aisecurity.forum/events/events/tlv-26 |

### Added in v6 (sources)
| Claim | Source |
|---|---|
| OpenAI engineer (Saudi national) arrested ≈Oct 9, 2026 (charges unsealed Oct 13) for hiding a listening device in an exec conference-room TV. Prosecutors allege contact with a member of the Saudi royal family. OpenAI: no sign weights were accessed | ABC News https://abcnews.com/Politics/open-ai-employee-arrested-listening-device-communicated-saudi/story?id=137385420 · CNBC https://www.cnbc.com/2026/10/13/openai-employee-arrested-recording-device.html |
| Anthropic: seven distillation campaigns by China-based labs in 2026; the largest (Alibaba-affiliated) ≈151M exchanges | The Hacker News, Sep 2026 https://thehackernews.com/2026/09/anthropic-says-seven-china-based-ai.html |
| The SL5 Standard covers misaligned AI that may "sabotage research or exfiltrate themselves" as "a distinct form of insider threat", and lists model outputs as assets because they "could be used to distill" | SL5 Standard v0.1 (`research/sl5_standard.txt`) |
| Security Level 5 is a 501(c)(3) nonprofit; CEO Lisa Thiergart | https://sl5.org |
| Jensen Huang resigned as Nvidia CEO on Nov 12, 2026 (Colette Kress interim). Alice Huang (Megaspeed, Singapore) is suspected by US intelligence of spying for China, not charged. Megaspeed is under investigation in the US and Singapore over 240,000 restricted chips. The Taipei photo is from a dinner, May 22, 2025 | CBS News https://www.cbsnews.com/news/nvidia-ceo-jensen-huang-resigns/ · Al Jazeera https://www.aljazeera.com/news/2026/11/12/why-did-nvidia-ceo-jensen-huang-resign-and-who-is-colette-kress |
| Kiss-cam clip: an AI video by Peter Dedene (@dedene), circulated on X | Nitzan's upload |

## Decided
17-min plan + 15-min cut (slot unknown) · deck runs on any laptop · no reliance on the workshop or Heron · naming torchtriton and Su Bin is OK · the simulator stays vague · keep the "depends on the contract" joke · hype words OK · working title = Ctrl+C, Ctrl+V a Fighter Jet.
