// Single source of truth for poll content. The deck gets a generated copy (tools/gen_deck_polls.mjs).
// Text comes from PLAN.md; don't edit wording here without updating PLAN.md.

export const TALK = {
  title: "Ctrl+C, Ctrl+V a Fighter Jet",
  subtitle: "What it takes to stop a superpower from stealing frontier AI",
  speaker: "Nitzan Pomerantz",
};

// q = full question (phones), short = deck card label, o = options
export const POLLS = [
  {
    id: "warm", grp: "warm",
    short: "Which side are you on?",
    q: "Which side are you on?",
    o: ["Red team (I break in)", "Blue team (I keep them out)", "Both, depends on the contract", "AI (research, safety, security)", "None of the above"],
  },
  {
    id: "A", grp: "A",
    short: "Minimum level of attacker to steal the weights today?",
    q: "You need to steal the flagship model weights from a top-3 AI lab today. What is the minimum level of attacker needed to pull it off?",
    o: [
      "A $1M budget: a top-tier crime syndicate or one insider",
      "A $10M budget: a standard state cyber operation",
      "A $1B budget: a superpower's top-priority operation",
      "Impossible, even for a superpower",
    ],
  },
  {
    id: "B1", grp: "BC",
    short: "How much does SL5 slow down research?",
    q: "If you lock an AI lab inside that wall of SL5 controls today (strict air-gaps, no open internet, real two-person rules for every action), how much does it slow down AI research?",
    o: ["Barely (<10%)", "Painful (10–30%)", "Very painful (30–50%)", "Crippling (>50%, top researchers quit)"],
  },
  {
    id: "B2", grp: "BC",
    short: "As a lab CEO, when do you lock down?",
    q: "Given that slowdown and the billions it costs, if you are a lab CEO racing competitors toward AGI, when do you actually lock down to SL5?",
    o: ["Start right now", "Wait until models start looking dangerous (\"Just-in-Time\")", "Never, winning the race matters more"],
  },
  {
    id: "C", grp: "BC",
    short: "Already silently stolen?",
    q: "What is the probability that the raw weights of at least one frontier model have ALREADY been silently stolen by a foreign intelligence service?",
    o: ["High (>70%)", "Moderate (30–70%)", "Low (<30%)"],
  },
];

// Phone shows a group's polls in order (B1 → B2 → C chain).
export const GROUPS = { warm: ["warm"], A: ["A"], BC: ["B1", "B2", "C"] };

export const LINKS = [
  { t: "Understand it in 5 min", s: "The SL5 intro (works on a phone)", u: "https://nitzpo.github.io/sl5/intro/" },
  { t: "Play with the simulator", s: "Open it on a computer: it's not built for phones.", u: "https://nitzpo.github.io/sl5/" },
  { t: "Break my simulator", s: "Open source. Disagree with a number? It's a one-file JSON change.", u: "https://github.com/nitzpo/sl5" },
  { t: "Go deeper: the RAND report", s: "Securing AI Model Weights (RR-A2849-1)", u: "https://www.rand.org/pubs/research_reports/RRA2849-1.html" },
  { t: "Go deeper: the SL5 Standard", s: "Security Level 5", u: "https://sl5.org" },
  { t: "Talk to me", s: "LinkedIn, or find me after the talk", u: "https://www.linkedin.com/in/nitzan-pomerantz/" },
];

export const ALREADY = ["RAND", "Security Level 5", "Irregular", "Heron", "Palisade", "FAR.AI", "UK AI Security Institute", "US CAISI"];
