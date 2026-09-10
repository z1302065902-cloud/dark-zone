import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto('https://zsy2026.itch.io/dark-zone', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await sleep(6000);
const clicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button')).filter(b => (b.innerText || '').includes('Run game'));
  if (btns.length) { btns[0].click(); return 'clicked'; }
  return 'no run button';
});
console.log('RUN_CLICK=' + clicked);
await sleep(8000);
const frames = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map(f => f.src).filter(Boolean));
console.log('IFRAMES=' + JSON.stringify(frames.slice(0, 3)));
await browser.close();
