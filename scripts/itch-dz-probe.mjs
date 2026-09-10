import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR=' + (e.message || '').slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE=' + m.text().slice(0, 150)); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const url = process.argv[2];
await page.goto(url, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
for (let i = 0; i < 8; i++) {
  await sleep(3000);
  const s = await page.evaluate(() => ({
    dz: typeof window.__dz,
    dzKeys: window.__dz ? Object.keys(window.__dz) : [],
    camera: !!(window.__dz && window.__dz.camera),
    title: document.querySelector('.game-title')?.textContent || '',
    canvas: !!document.querySelector('canvas'),
  })).catch(e => ({ err: e.message.slice(0, 100) }));
  console.log(`t=${(i + 1) * 3}s ` + JSON.stringify(s));
}
await browser.close();
