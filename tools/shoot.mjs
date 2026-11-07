// Screenshot every slide × step at 1920×1080 (+ optional washed-out "projector" pass).
//   node tools/shoot.mjs [--url http://localhost:8080/] [--out shots] [--only s7,s10] [--projector] [--cut]
// Writes <out>/<slide>.<step>.png and <out>/sheet.png (contact sheet).
import { createRequire } from "node:module";
// playwright is preinstalled globally in the cloud env (CommonJS resolution finds it)
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const url = opt("--url", "http://localhost:8080/");
const out = opt("--out", "shots");
const only = opt("--only", "");
const projector = args.includes("--projector");
const cut = args.includes("--cut");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); });
const missing = new Set(); // expected while assets are pending (e.g. img/sim.webp)
page.on("response", (r) => { if (r.status() >= 400) missing.add(`${r.status()} ${new URL(r.url()).pathname}`); });

const base = url + (url.includes("?") ? "&" : "?") + (cut ? "cut=15" : "cut=17");
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => window.Deck && Deck.current().el);
const slides = await page.evaluate(() =>
  [...document.querySelectorAll(".slide")].map((el) => ({
    id: el.id,
    clicks: +((document.body.classList.contains("cut") && el.dataset.clicksCut !== undefined ? el.dataset.clicksCut : el.dataset.clicks) || 0),
    drop: document.body.classList.contains("cut") && el.dataset.cut === "drop",
  })),
);
if (projector) await page.addStyleTag({ content: "#stage{filter:contrast(.62) brightness(1.25) saturate(.8)}" });

const files = [];
for (const s of slides) {
  if (s.drop || (only && !only.split(",").includes(s.id))) continue;
  for (let st = 0; st <= s.clicks; st++) {
    await page.evaluate(([id, st]) => { location.hash = `#${id}.${st}`; }, [s.id, st]);
    await page.waitForTimeout(st === 0 ? 900 : 2600); // let step animations finish
    const f = `${out}/${s.id}.${st}${projector ? ".proj" : ""}.png`;
    await page.screenshot({ path: f });
    files.push(f);
  }
}

// contact sheet: 4 columns of 480×270 thumbs
const cols = 4, tw = 480, th = 270;
const sheet = await browser.newPage({ viewport: { width: cols * tw, height: Math.ceil(files.length / cols) * (th + 24) } });
const { readFileSync } = await import("node:fs");
const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString("base64")}"><figcaption>${f.split("/").pop()}</figcaption></figure>`).join("");
await sheet.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(${cols},${tw}px);background:#333}figure{margin:0}img{width:${tw}px;height:${th}px;display:block}figcaption{font:12px monospace;color:#ddd;height:24px;padding:4px}</style>${imgs}`);
await sheet.screenshot({ path: `${out}/sheet${projector ? ".proj" : ""}.png`, fullPage: true });
await browser.close();
console.log(`${files.length} shots → ${out}/sheet.png`);
if (missing.size) console.log("missing (HTTP >= 400): " + [...missing].join(", "));
if (errors.length) { console.log("PAGE ERRORS:\n" + errors.join("\n")); process.exitCode = 1; }
