import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const SHORT = 'First-person 3D horror stealth. Find the keycard, restore power, defeat the boss and escape a dark hospital.';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[editpost]', ...a);

try {
  await page.goto('https://itch.io/game/edit/4993039', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  log('short len:', SHORT.length);

  const result = await page.evaluate(async (short) => {
    const form = document.querySelector('form.game_edit_form');
    if (!form) return { err: 'no form' };
    const fd = new FormData(form);
    fd.set('game[type]', 'html');
    fd.set('game[short_text]', short);
    const resp = await fetch('https://itch.io/game/edit/4993039', {
      method: 'POST',
      body: fd,
      credentials: 'include',
      headers: { 'Accept': 'application/json, text/html, */*' },
    });
    const ct = resp.headers.get('content-type') || '';
    let bodyText = '';
    try { bodyText = (await resp.text()).slice(0, 1200); } catch {}
    return { status: resp.status, ct, bodyPreview: bodyText.replace(/\s+/g, ' ').slice(0, 700) };
  }, SHORT);
  log('RESULT:', JSON.stringify(result, null, 1));
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
