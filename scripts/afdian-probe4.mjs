import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const FF = '/Users/zsy/Library/Caches/ms-playwright/firefox-1542/firefox/Nightly.app/Contents/MacOS/firefox';
const ctx = await firefox.launchPersistentContext(PROFILE, { executablePath: FF, headless: true, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
try {
  await page.goto('https://afdian.com/dashboard/shop', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  const s = await page.evaluate(() => ({
    url: location.href,
    loggedIn: !!(document.querySelector('.avatar') || document.body.innerText.includes('商品') && !document.body.innerText.includes('登录')),
    body: document.body.innerText.slice(0, 200).replace(/\s+/g, ' '),
  }));
  console.log('STATE=' + JSON.stringify(s));
} catch (e) { console.log('ERR=' + (e.message || '').slice(0, 200)); }
await ctx.close();
