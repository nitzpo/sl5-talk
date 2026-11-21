const { chromium } = require('playwright');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/index.html?thumb&api=off&cut=full#s0', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2500);
  const slides = await p.evaluate(() => [...document.querySelectorAll('section.slide')].map(el => ({ id: el.id, clicks: +(el.dataset.clicks || 0) })));
  let n = 0;
  for (const s of slides) for (let st = 0; st <= s.clicks; st++) {
    await p.evaluate(h => { location.hash = h; }, `#${s.id}.${st}`);
    await p.waitForTimeout(st === 0 ? 1400 : 900);
    await p.screenshot({ path: `${out}/${s.id}.${st}.jpg`, type: 'jpeg', quality: 72 }); n++;
  }
  console.log('shots', n, 'errors', errs);
  await b.close();
})();
