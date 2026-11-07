# PLAN: Ctrl+C, Ctrl+V a Fighter Jet

Exported from the Notion plan (draft v3, Nov 7 2026): https://app.notion.com/p/41158933bf32810aaf6dc2cc614e2954
**On screen** = what the audience sees. **Say** = speaker notes (never on screen). **Notes** = facts, branches, build hints.

## Spine
1. The weights *are* the weapon, and stealing them is silent.
2. By voting, the room rebuilds RAND's attacker ladder and learns that labs sit well below where they'd need to be.
3. SL5 is huge, but mostly made of things this room already knows.
4. The polls set a trap: most will pick "wait until it looks dangerous", but the defenses take ≈4 years to build and the theft sends no signal.

Close: this is an engineering fight, and this room knows how to win it.

## Visual language
- Near-black background, off-white text, one accent (signal amber) plus alarm red reserved for "stolen" moments. Monospace for files and terminals; a heavy grotesk for statements.
- Recurring character: the file icon `weights.bin · 2.0 TB`. Born in S1, copied in S2, cloned in S3, buried under 47 tiles in S10, locked in a vault in S21.
- Styles: 🎬 CINEMATIC (photo/loop) · 😄 FUNNY (code animation) · ⬛ PLAIN (calm type/data) · 📱 POLL. Alternate them; the plain slides are deliberate.

## Run-of-show (≈17:00)
| Part | Time | Slides |
|---|---|---|
| 0 Pre-show | before start | S0 |
| 1 The heist | 0:00–3:00 | S1a–S3c |
| 2 Who's talking | 3:00–3:45 | S4 |
| 3 How hard is it to steal? | 3:45–7:00 | S5–S8 |
| 4 Why SL5 is so hard | 7:00–10:00 | S9–S12 |
| 5 When do you lock the doors? | 10:00–14:45 | S13–S17 |
| 6 Call to arms | 14:45–17:00 | S18–S21 |

**15-min cut** (a toggle): drop S9, merge S8 into S7 (as its last click), trim S12 and S16, drop S19.

---

## Part 0: Pre-show

### S0 · before start · 📱 POLL (warm-up vote)
- **On screen:** holding slide shown during changeover / MC intro: the title + subtitle, the speaker's name, a big QR + short URL, the question "Before we start: which side were you on?", and a live counter ("143 phones in"). A dimmed datacenter loop (#01) behind. Under the title, `$ scp weights.bin` types itself out with a blinking cursor.
- **Poll `warm`:** Breaking in (offense) · Keeping out (defense) · Building AI · Building companies · Both, depends on the contract.
- **Say:** nothing (the MC is talking). Fallback if no holding slide is allowed: "Scan this now, you'll need it later. One question, five seconds."
- **Notes:** one scan covers the whole talk; phones auto-advance to each later poll.

## Part 1: The heist

### S1a · 0:00 · 🎬 #01 datacenter
- **On screen:** black → the datacenter fades up with a slow push-in. Amber counters tick in one by one: "Billions of dollars" · "100,000 GPUs" · "6 months".
- **Say:** "Put on your offensive hat for sixty seconds. Imagine your unit is given a target: a frontier AI lab in California. To build their latest AI model (what we call pre-training), that lab had to spend billions of dollars, build a massive power station, and run 100,000 export-controlled GPUs for six months straight. Your country doesn't have the billions, and because of sanctions, you aren't allowed to buy the chips."

### S1b · 0:40 · 😄 (+ #02 microSD)
- **On screen:**
  - Click 1: everything collapses into one small glowing file icon `model_weights.bin · 2.0 TB`.
  - Click 2: a microSD on a fingertip with a "$160" tag. A copy progress bar stalls → OS-style dialog "Not enough space. Delete 'Call of Duty' to continue?" [Cancel] [Delete] → the cursor clicks Delete.
- **Say:** "But here is the crazy thing about AI: when that training run finishes, what actually comes out the other end? A single 2-terabyte file of numbers. That file is the model weights: the actual trained brain of the AI. And 2 terabytes is nothing. You can fit a multi-billion-dollar superintelligence on a $160 SD card the size of your fingernail. You just have to delete Call of Duty first."

### S2 · 1:15 · 😄 (+ #08 jet)
- **On screen:** split.
  - Top, "Old espionage": `F35_Blueprints.pdf` → Ctrl+C, Ctrl+V → `F35_Blueprints (Copy).pdf` → giant red stamp "10 YEARS + FACTORIES REQUIRED".
  - Bottom, "AI espionage": `frontier_weights.bin` → Ctrl+C, Ctrl+V → the jet (#08) pops in with its afterburner glowing and flies off screen (it faces left).
- **Say:** "Think about how different that is from every other national security target in history. In the old world, if your spies broke into Lockheed Martin and stole the complete plans for an F-35 fighter jet, what did you actually have? You had a great PDF. You still didn't have an air force. To turn that PDF into an airplane, you still needed giant factories, rare materials, and ten years of hard engineering. And this actually happened: in 2016, a man pleaded guilty to helping China steal F-35 data. China still had to build its own plane. With AI, 99% of the time and money goes into creating the weights; running them is cheap. Once someone steals that 2-terabyte file, they can run it the next morning on a few racks of servers. For the first time in history, stealing the file isn't stealing the plans for the jet. It's hitting Ctrl+C, Ctrl+V on the finished jet itself."

### S3a · 2:10 · 🎬 #03 + #04 (split)
- **On screen:** left, the bright server room with green lights and the overlay "API Online · Safety Evals: PASSED ✅". Click: on the right, the dark rack fades in, "6,000 miles away", running an identical glowing brain.
- **Say:** "And here is the part that should scare every defender: if someone steals physical weapons or sabotages a machine, something is missing or an alarm goes off. When a nation-state steals AI model weights, nothing breaks. The lab's servers keep humming. Meanwhile, 6,000 miles away, an identical twin wakes up on an air-gapped cluster."
- **Notes:** the "silent twin" returns in S17.

### S3b · 2:35 · 😄 overlay on S3a
- **On screen:** on the dark side, a progress bar `Removing_Safety_Guardrails.py... 100%` → "1 GPU · under $200".
- **Say:** "And what about all the millions of dollars the lab spent on 'AI Safety' and alignment, so the model refuses to help hackers or build bioweapons? All of that safety lives inside those same weights. The moment an attacker has the file on their own servers, a researcher can strip out the safety guardrails with one GPU and under $200 of fine-tuning."

### S3c · 2:50 · ⬛
- **On screen:** black, one line: *A "Do Not Steal" sticker on a suitcase full of cash.*
- **Say:** "Spending $50 million aligning a model on a breachable server is like putting a 'Do Not Steal' sticker on a suitcase full of cash."

## Part 2: Who's talking

### S4 · 3:00 · 📱 warm-up results
- **On screen:** warm-up bars animate in; the speaker's name small in a corner.
- **Say:** "Quick look at who's here… Hi, I'm Nitzan. For years I led security architecture for critical infrastructure: the kind of networks people in this room got paid to break into. Mostly, that meant being the guy who says no to the researcher with the USB stick."
- **Notes:** optional branch if offense > defense: "Okay. I'll keep an eye on my laptop." Sets up the S16 callback.

## Part 3: How hard is it to steal?

### S5 · 3:45 · 📱 Poll A vote
- **On screen:** "You need to steal the flagship model weights from a top-3 AI lab today. What is the MINIMUM attacker needed to pull it off?", the 4 options, "It's already on your phone", a small QR, and a live counter. No SL/OC labels.
- **Poll `A`:** $1M budget: a top-tier crime syndicate or one insider · $10M budget: a standard state cyber operation · $1B budget: a superpower's top-priority operation · Impossible, even for a superpower.
- **Say (while voting, ≈60s):** "No jargon yet, just your gut… And no, the insiders in the room don't get to vote twice."

### S6 · 4:45 · 📱 Poll A results
- **On screen:** the bars animate in; the leading bar glows amber.
- **Say:** "Look at the screen. Most of you voted that [leading option] could steal the weights today[, and almost nobody voted for #4]." Say the bracketed part only if it's true.
- **Branches:**
  - "Impossible" > 10%: "To the X% who said impossible: I'd love to buy you a drink after. I also have a bridge to sell you."
  - Most picked $1B: "You're generous to the labs. Let's see if they agree."

### S7 · 5:15 · ⬛ RAND ladder (animated)
- **On screen:** the bars morph into a 5-rung ladder.
  - Click 1: SL1→SL5 rungs, each showing who it stops (people icons 1 · 1 · 10 · 100 · 1,000; budget $1K · $10K · $1M · $10M · $1B; time days · weeks · months · ≈1 year · years).
  - Click 2: a marker at SL3: "Frontier labs: roughly here, or below".
  - Click 3: a quote under SL4: "Top cyber nations run these more than 100 times per year." (RAND)
  - Footer: RAND RR-A2849-1 (Nevo et al., 2024).
- **Say:** "Without knowing it, you just recreated the exact framework that defines our field. Two years ago, researchers at RAND published the foundational report on Securing AI Model Weights. Instead of defining security by compliance checklists, they defined 5 Security Levels, SL1 through SL5, based purely on who can break into your lab. SL1 and SL2 stop amateurs and professional hackers. SL3 stops cybercrime syndicates and insiders, about a million dollars. This is roughly where top frontier labs sit today, or below. SL4 stops a standard operation by a state cyber unit, about ten million dollars, the kind top cyber nations run more than a hundred times a year. SL5 defends model weights against a roughly billion-dollar, multi-year priority campaign by the world's top cyber superpower."

### S8 · 6:30 · ⬛
- **On screen:** black, a big quote: "Achieving SL5 is currently not possible." (RAND, 2024)
- **Say:** "And as RAND puts it: right now, achieving SL5 is not possible. Not for any lab on earth."
- **Notes:** in the 15-min cut, this becomes the last click of S7.

## Part 4: Why SL5 is so hard

### S9 (optional, first to cut) · 7:00 · 😄 #05 fortress + terminal
- **On screen:** a fortress wall with text labels (SSO · EDR · Zero Trust · SOC 2) and a wide-open side door, where a terminal shows `pip install turbo-weights-v2` (Author: dark_wizard_99 · Created: 14 mins ago). Optional click: stamp "REAL: torchtriton, Dec 2022".
- **Say:** "Why can't top Silicon Valley security (Okta, Zero Trust, SOC-2) stop an SL5 attacker? Because enterprise security is built to stop ransomware gangs while letting employees work fast. And try telling a PhD machine learning researcher making $2 million a year that he can't pip install a random Python package written yesterday by an anonymous guy on GitHub named dark_wizard_99, because it makes his training curve converge 2% faster." Optional: "And dark_wizard_99 is real. In December 2022 his name was torchtriton: PyTorch's own nightly build pulled in a malicious package that read people's SSH keys."

### S10 · 7:45 · 😄 wall of text
- **On screen:**
  - Click 1: 3 clean cards: `1. Network Air-Gaps` · `2. Secure Hardware` · `3. Insider Controls`, with the weights.bin icon in the middle.
  - Click 2: the cards split into **47 tiles** in 6 colored groups, with real block names from `nitzpo/sl5` `app/public/data/blocks-*.json`.
  - Click 3: rapid zoom-out flood: hundreds of tiny real clause snippets (from `research/sl5_standard.txt` and `rand_full.txt`) fill the screen; the weights.bin icon is buried.
- **Say:** "When people first hear about SL5, they think it's just three bullet points: isolate the network, lock down the hardware, and watch for insiders. Then you open the actual RAND report and the SL5 Standard. RAND maps 38 attack vectors, and the defenses turn into 47 major engineering programs. And underneath those are hundreds of brutal physical, silicon, and operational requirements. I am not going to read this slide. No human can hold this list in their head at once."

### S11 · 8:45 · 😄
- **On screen:** split. Left, "SL5 Two-Person Rule": two people, two keys, a vault. Right, "Startup Two-Person Rule": a PR at "+4,012 −0", review "LGTM 👍" posted "12 seconds later", the reviewer's Slack status 🚽.
- **Say:** "It goes all the way down to real Two-Person Rules, where two people physically authorize every sensitive action together. Not the startup version, where one engineer writes a 4,000-line pull request and another engineer types 'LGTM 👍' twelve seconds later from the bathroom."

### S12 · 9:15 · ⬛ 80/20
- **On screen:** one bar, "SL5 Standard v0.1 (Mar 2026)": ≈80% amber, "Built on IL6 · ICD 705 · TEMPEST · NIST 800-53: you've seen this before"; ≈20% red, "New, specific to AI datacenters".
- **Say:** "Here's the good news hiding in that wall. Most of SL5 isn't new. The SL5 Task Force built its standard on classified-grade practice that already exists: SCIFs, TEMPEST, NIST controls. About a fifth is new. If you've served in the right places, you've seen most of this list. What nobody has done is run it at hyperscale, at startup speed."

## Part 5: When do you lock the doors?

### S13 · 10:00 · 📱 Polls B1 + B2 + C vote (chained on the phone)
- **On screen:** "3 quick questions, on your phone now". Three question cards, each with its own live counter; QR in a corner. The full question text appears only on the phones.
- **Poll `B1`:** "If you lock an AI lab inside that wall of SL5 controls today (strict air-gaps, no open internet, real two-person rules for every action), how much does it slow down AI research?" → Barely (<10%) · Painful (10–30%) · Very painful (30–50%) · Crippling (>50%, top researchers quit)
- **Poll `B2`:** "Given that slowdown and the billions it costs, if you are a lab CEO racing competitors toward AGI, when do you actually lock down to SL5?" → Start right now · Wait until models start looking dangerous ("Just-in-Time") · Never, winning the race matters more
- **Poll `C`:** "What is the probability that the raw weights of at least one frontier model have ALREADY been silently stolen by a foreign intelligence service?" → High (>70%) · Moderate (30–70%) · Low (<30%)
- **Say (≈90s):** read each question once. "Be honest on the CEO one."

### S14 · 11:30 · 📱 B1 + B2 results
- **On screen:** B1 and B2 bars side by side, with the heavy-slowdown share and the "Just-in-Time" bar highlighted together.
- **Say:** "So X% of you think SL5 hurts research a lot, and Y% would wait until the models look dangerous. That's the pragmatic answer. It's what I'd have said. It's also the answer that loses."
- **Branches:**
  - "Start right now" wins: "Most of you would start now. Your future CFO disagrees. Let's see why you're right."
  - "Never" > 15%: "And to the X% who said never: at least you're honest."

### S15 · 12:15 · ⬛ calendar Gantt (#06 dimmed behind)
- **On screen:** a timeline from 2026 to 2032.
  - Click 1: a marker "Models look dangerous" drops in at 2028.
  - Click 2: bars grow from the marker: "Classified facility: up to 4 years" and "Custom silicon: 4+ years", ending around 2032.
  - Click 3: "The bottleneck isn't money. It's the calendar."
- **Say:** "Here's why 'Just-in-Time' fails. Above $200 million, the bottleneck isn't money; it's the calendar. Building a shielded facility enclave or custom hardware takes up to 4 years. The clock starts when you decide, not when you break ground. No budget compresses a 4-year calendar."

### S16 (trim in the 15-min cut) · 13:00 · 😄 simulator GIF + USB gag
- **On screen:**
  - Click 1: the simulator GIF plays, with no numbers on screen; caption `nitzpo.github.io/sl5`.
  - Click 2: an air-gap wall; a researcher hops over it holding a USB stick tagged "$12 · KSP".
- **Say:** "You can't hold 47 interacting controls in your head to see what being two years late costs. So I vibe-coded an open-source interactive simulator, the SL5 Explorable, to build some intuition. Every run says the same thing: the programs that do worse fail on timing, not on money. And it taught me that controls don't work alone: if you put up an air-gap with no sanctioned way to move files, your smartest researcher just buys a $12 USB stick at KSP and becomes your new network router. Remember, I used to be the guy saying no to him."

### S17 · 13:45 · 📱 C results → silent-twin callback
- **On screen:**
  - Click 1: C bars.
  - Click 2: the S3a split returns, dimmed.
  - Click 3: "Just-in-Time needs a warning. Theft doesn't send one."
- **Say:** "And X% of you think it may already have happened. Remember the silent twin. If it had, what would we see? Nothing. 'Wait until it looks dangerous' assumes you'll get a warning. The theft doesn't send one. And the building takes four years."
- **Branch:** C mostly Low: "Most of you think it hasn't happened yet. Good. Then the clock is still running."

## Part 6: Call to arms

### S18 · 14:45 · ⬛
- **On screen:** two lines, one after the other: "Alignment: an unsolved *science* problem." / "Securing the weights: a *systems-engineering* fight."
- **Say:** "Most of AI safety is trying to solve an unsolved science problem: how do you align a superintelligence so it doesn't turn on humanity? Nobody actually knows how to solve that yet. Securing the model weights is not an unsolved science problem. It is a brutal, messy systems-engineering fight against a nation-state adversary. And unlike alignment, this is a fight the people in this room actually know how to win."

### S19 (optional) · 15:25 · 📱 warm-up callback
- **On screen:** the warm-up bars return; "Breaking in" and "Keeping out" light up together.
- **Say:** "Half this room spent years figuring out how to get into air-gapped networks. The other half spent years building them. Remember: you've already seen 80% of SL5. Frontier AI needs both halves. Now."

### S20 · 15:55 · ⬛ links
- **On screen:** one QR → the links page.
  1. Understand it in 5 min: the intro (works on a phone)
  2. Break my simulator: GitHub
  3. Go deeper: the RAND report · the SL5 Standard
  4. Talk to me: LinkedIn / after the talk

  Small strip: "Already working on this: RAND · SL5 Task Force · Irregular · Heron · Palisade · FAR.AI · UK AI Security Institute · US CAISI" (text, no logos).
- **Say:** "If any of this got under your skin, here's where to start. I would rather fix a number than defend it. Everything is open-sourced on GitHub. If you disagree with a number or an attack path, it's a one-file JSON change."
- **Notes:** phones still on the vote page switch to the links page.

### S21 · 16:40 · 🎬 #07 vault
- **On screen:** the weights.bin icon slides into the vault, the door closes, black. One line: "Frontier AI doesn't just need better math. It needs the people who know how systems break when nation-states want them to break." Then the name + QR stay up for Q&A.
- **Say:** the line. "Thank you."

---

## Image prompts (the user generates these in Gemini)
Style suffix (in every prompt): "Cinematic film still, photorealistic, low-key lighting, teal-and-amber color grade, anamorphic lens, shallow depth of field, subtle film grain. No text, no letters, no logos, no recognizable faces." All are 16:9 except #03 and #04 (1:1).

| File | Slide | Brief |
|---|---|---|
| 01-datacenter | S0, S1a | Aerial night view of a desert hyperscale AI datacenter campus, glowing halls, substation + power plant, steam; dark sky in the top third |
| 02-microsd | S1b | Macro of a fingertip holding an unbranded microSD on pure black; empty right half |
| 03-bright-servers (1:1) | S3a | Bright, clean daylight server room, green LEDs, optimistic |
| 04-dark-rack (1:1) | S3a, S17 | Dark windowless room, a single rack glowing cold blue, haze, ominous |
| 05-fortress | S9 | A huge stone fortress wall at dusk with a tiny modern door wide open, warm light |
| 06-construction | S15 | Early-stage windowless concrete secure facility, overcast, cranes, bureaucratic |
| 07-vault | S21 | A circular steel vault door almost closed, a thin strip of light |
| 08-jet | S2 | Stealth fighter in side view on black, afterburner, no markings |

Optional Veo loops (16:9, ≈8s, muted): 01 slow push-in · 03 LEDs blink · 04 flicker + haze · 07 door closes to black.

## Fact sheet (only these claims; sources for verification)
| Claim | Source |
|---|---|
| OC/SL ladder: OC3 ≤$1M, months, ≈10 ppl (+ insiders) → SL3 · OC4 ≤$10M, ≈1 yr, ≈100 ppl → SL4 · OC5 ≤$1B, years, ≈1,000 ppl → SL5 | RAND RR-A2849-1 https://www.rand.org/pubs/research_reports/RRA2849-1.html |
| Top cyber nations run OC4-level ops "more than 100 times per year" | RAND |
| "Achieving SL5 is currently not possible" | RAND |
| 38 attack vectors in 9 categories | RAND |
| Labs roughly SL3 or below | The speaker's own estimate; Anthropic RSP (ASL-3 excludes sophisticated insiders) https://www.anthropic.com/rsp |
| SL5 Standard v0.1 (Mar 2026): built on IL6 / ICD 705 / NIST 800-53, ≈20% novel AI-datacenter controls | https://sl5taskforce.substack.com/p/releasing-the-sl5-standard-v01 |
| Safety fine-tuned away for <$200 on one GPU (Llama 2-Chat 70B) | https://arxiv.org/abs/2310.20624 |
| torchtriton malicious PyTorch-nightly dependency, Dec 25–30 2022 | https://pytorch.org/blog/compromised-nightly-dependency/ |
| Su Bin pleaded guilty (2016) to helping steal F-35/F-22/C-17 data for China | https://www.justice.gov/opa/pr/chinese-national-who-conspired-hack-us-defense-contractors-systems-sentenced-46-months |
| 2TB microSD ≈ $160 | retail listings (SanDisk Extreme 2TB) |
| Irregular (ex-Pattern Labs) CEO Dan Lahav co-authored the RAND report | https://www.irregular.com/news/securing-ai-model-weights |
| Event: TLV Frontier AI Security Forum '26, Nov 22, Tel Aviv Museum of Art, ≈300 people | https://aisecurity.forum/events/events/tlv-26 |
