import { firefox } from 'playwright';
const ctx = await firefox.launchPersistentContext('/tmp/dz-afdian2-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
try {
  await page.goto('https://afdian.com/item/170b3b9caced11f197865254001e7c00', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(3000);
  const t = await page.evaluate(() => document.body.innerText);
  console.log('ITEM PAGE:\n', t.replace(/\n+/g, ' | ').slice(0, 900));
} catch (e) { console.log('ERR', e.message); }
await ctx.close();
