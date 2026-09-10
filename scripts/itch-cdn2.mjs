import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (const [label, url] of [
  ['1965172-plain', 'https://html-classic.itch.zone/html/19177149-1965172/index.html'],
  ['1965172-v', 'https://html-classic.itch.zone/html/19177149-1965172/index.html?v=1789046046'],
]) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await sleep(10000);
  const ok = await page.evaluate(() => ({
    title: document.querySelector('.game-title')?.textContent || '',
    menu: !!document.querySelector('.menu-btn'),
  })).catch(() => ({}));
  console.log(label + ' ' + JSON.stringify(ok));
}
await browser.close();
