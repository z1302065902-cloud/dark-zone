import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const id of ['1965172', '1964591']) {
  const url = `https://html-classic.itch.zone/html/19177149-${id}/index.html?debug=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await sleep(9000);
  const ok = await page.evaluate(() => {
    const title = document.querySelector('.game-title')?.textContent || '';
    const menu = !!document.querySelector('.menu-btn');
    const dz = !!(window.__dz && window.__dz.getState);
    return { title, menu, dz, hasSettings: !!document.querySelector('.menu-buttons') };
  }).catch(() => ({}));
  console.log(id + ' ' + JSON.stringify(ok));
}
await browser.close();
