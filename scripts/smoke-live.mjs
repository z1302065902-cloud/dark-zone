import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
for (const url of ['https://z1302065902-cloud.github.io/dark-zone/', 'https://dark-zone-pi.vercel.app/']) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await sleep(9000);
  const title = await page.evaluate(() => document.querySelector('.game-title')?.textContent || 'EMPTY');
  const hasStart = await page.getByRole('button', { name: /开始|Start/ }).count();
  const isDemo = await page.evaluate(() => !!document.querySelector('.menu-btn'));
  console.log(url.split('/')[2] + ' TITLE=' + JSON.stringify(title) + ' START=' + hasStart + ' MENU=' + isDemo);
}
console.log('ERRS=' + JSON.stringify(errs));
await browser.close();
