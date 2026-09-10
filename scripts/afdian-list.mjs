import { firefox } from 'playwright';
const ctx = await firefox.launchPersistentContext('/tmp/dz-afdian2-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  const body = await page.evaluate(() => document.body.innerText);
  console.log('FULL BODY:\n', body.slice(0, 2500));
} catch (e) { console.log('ERR', e.message); }
await ctx.close();
