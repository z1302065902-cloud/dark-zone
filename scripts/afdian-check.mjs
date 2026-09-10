import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[afd]', ...a);

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  log('URL:', page.url());
  log('TITLE:', await page.title());
  const body = await page.evaluate(() => document.body.innerText.slice(0, 600));
  log('BODY:', body.replace(/\n+/g, ' | ').slice(0, 500));

  if (page.url().includes('login')) {
    log('>>> NOT LOGGED IN (redirected to login)');
  } else {
    log('>>> LOGGED IN - shop page');
    // probe: find 上架新商品 button
    const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button, a, .btn')).map(b => (b.innerText||'').trim()).filter(t => t && t.length < 30).slice(0, 25));
    log('BUTTONS:', JSON.stringify(btns));
    await page.screenshot({ path: '/tmp/dz-afdian-shop.png' });
  }
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
