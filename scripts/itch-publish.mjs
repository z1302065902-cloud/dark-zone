import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { executablePath: '/Users/zsy/Library/Caches/ms-playwright/firefox-1542/firefox/Nightly.app/Contents/MacOS/firefox', headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[pub]', ...a);
try {
  await page.goto('https://itch.io/game/edit/4993039', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  const result = await page.evaluate(async () => {
    const form = document.querySelector('form.game_edit_form');
    if (!form) return { err: 'no form' };
    const fd = new FormData(form);
    fd.set('game[published]', 'published');
    const resp = await fetch('https://itch.io/game/edit/4993039', { method: 'POST', body: fd, credentials: 'include' });
    const bodyText = await resp.text();
    return { status: resp.status, body: bodyText.replace(/\s+/g, ' ').slice(0, 400) };
  });
  log('RESULT:', JSON.stringify(result));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
