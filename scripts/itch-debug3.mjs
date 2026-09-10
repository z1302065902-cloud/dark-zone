import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const consoleMsgs = [];
page.on('console', m => consoleMsgs.push(m.type() + ': ' + m.text().slice(0, 160)));
page.on('pageerror', e => consoleMsgs.push('PAGEERROR: ' + (e.message || '').slice(0, 200)));
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto('https://html-classic.itch.zone/html/19177149-1965172/index.html?debug=1', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
await sleep(12000);
const state = await page.evaluate(() => ({
  dz: typeof window.__dz,
  dzHasStore: !!(window.__dz && window.__dz.getState),
  url: location.href,
  scripts: Array.from(document.scripts).map(s => s.src.split('/').pop()).slice(0, 6),
})).catch(e => ({ err: e.message }));
console.log('STATE=' + JSON.stringify(state));
console.log('MSG=' + JSON.stringify(consoleMsgs.slice(0, 12)));
await browser.close();
