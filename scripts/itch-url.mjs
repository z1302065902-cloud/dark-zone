import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { executablePath: '/Users/zsy/Library/Caches/ms-playwright/firefox-1542/firefox/Nightly.app/Contents/MacOS/firefox', headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[url]', ...a);
try {
  await page.goto('https://zsy2026.itch.io/dark-zone', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  // click Run game button
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => (b.innerText || '').trim().includes('Run game'));
    if (btns.length) { btns[0].click(); return 'clicked'; }
    return 'no run button';
  });
  log('click:', clicked);
  await page.waitForTimeout(5000);
  const iframes = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, id: f.id, cls: (f.className||'').slice(0,40) })));
  log('IFRAMES:', JSON.stringify(iframes));
  const url = iframes.find(f => f.src && (f.src.includes('embed-upload') || f.src.includes('dark-zone')));
  if (url) log('GAME_URL:', url.src);
  await page.screenshot({ path: '/tmp/dz-itch-run.png' });
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
