// Real-time walkthrough recorder: plays the deck forward like a presenter (every click), wiggles the mouse,
// steps back a few clicks, and records a video + a 2 fps frame contact sheet for review.
//   node tools/walk.mjs [--url http://localhost:8080/?api=dev] [--from s0] [--to s6] [--pace 2600] [--back 4] [--out walk]
// Outputs: <out>/walk.webm, <out>/walk.mp4 (if ffmpeg), <out>/frames-*.png (contact sheets, if ffmpeg), path log on stdout.
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, renameSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const url = opt("--url", "http://localhost:8080/?api=dev");
const from = opt("--from", "s0"), to = opt("--to", "");
const pace = +opt("--pace", 2600), back = +opt("--back", 4), out = opt("--out", "walk");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url + "#" + from, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(pace);
await page.mouse.move(300, 300); await page.mouse.move(900, 600, { steps: 10 }); // mouse must not break anything
const path = [];
for (let i = 0; i < 200; i++) {
  const before = await page.evaluate(() => location.hash);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(pace);
  const now = await page.evaluate(() => location.hash);
  path.push(now);
  if (now === before) break; // end of deck
  if (to && now.slice(1).split(".")[0] !== to && path.some((h) => h.slice(1).split(".")[0] === to)) break; // passed --to
}
for (let i = 0; i < back; i++) { await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(1200); path.push("←" + (await page.evaluate(() => location.hash))); }
await ctx.close(); await browser.close();

const webm = readdirSync(out).filter((f) => f.endsWith(".webm") && f !== "walk.webm").map((f) => `${out}/${f}`)[0];
if (webm) renameSync(webm, `${out}/walk.webm`);
console.log(path.join(" "));
let ffmpeg = true;
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { ffmpeg = false; }
if (ffmpeg) {
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${out}/walk.webm`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${out}/walk.mp4`]);
  mkdirSync(`${out}/f`, { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${out}/walk.webm`, "-vf", "fps=2,scale=480:-1", `${out}/f/%04d.png`]);
  const frames = readdirSync(`${out}/f`).sort();
  const b2 = await chromium.launch(), per = 48;
  for (let s = 0; s * per < frames.length; s++) {
    const chunk = frames.slice(s * per, (s + 1) * per);
    const pg = await b2.newPage({ viewport: { width: 6 * 480, height: 800 } });
    const html = chunk.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(`${out}/f/${f}`).toString("base64")}"><figcaption>t=${((+f.slice(0, 4) - 1) / 2).toFixed(1)}s</figcaption></figure>`).join("");
    await pg.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(6,480px);background:#333}figure{margin:0}img{display:block;width:480px}figcaption{font:12px monospace;color:#ddd;padding:2px 4px}</style>${html}`);
    await pg.screenshot({ path: `${out}/frames-${s + 1}.png`, fullPage: true });
  }
  await b2.close();
}
if (errors.length) { console.log("PAGE ERRORS:\n" + errors.join("\n")); process.exitCode = 1; }
console.log(`video: ${out}/walk.${ffmpeg ? "mp4" : "webm"}${existsSync(`${out}/frames-1.png`) ? `, frames: ${out}/frames-*.png` : ""}`);
