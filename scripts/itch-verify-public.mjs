import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext('/tmp/dz-anon-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[anon]', ...a);
try {
  await page.goto('https://zsy2026.itch.io/dark-zone', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  log('TITLE:', await page.title());
  const info = await page.evaluate(() => {
    const txt = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => (b.innerText||'').trim()).filter(t => t && t.length<40).slice(0,10);
    const hasDraft = txt.includes('DRAFT') || txt.includes('draft');
    const hasRun = txt.includes('Run game');
    const hasSupport = txt.includes('Support This Game');
    return { hasDraft, hasRun, hasSupport, buttons };
  });
  log('INFO:', JSON.stringify(info, null, 1));
  await page.screenshot({ path: '/tmp/dz-itch-public.png' });
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
