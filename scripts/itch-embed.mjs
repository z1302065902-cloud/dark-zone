import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { executablePath: '/Users/zsy/Library/Caches/ms-playwright/firefox-1542/firefox/Nightly.app/Contents/MacOS/firefox', headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[embed]', ...a);
try {
  await page.goto('https://itch.io/game/edit/4993039', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  // probe embed select options in DOM
  const embedOpts = await page.evaluate(() => {
    const out = {};
    ['embed[embed_type]', 'embed[size_type]'].forEach(name => {
      const s = document.querySelector(`select[name="${name}"]`);
      out[name] = s ? Array.from(s.options).map(o => o.value + ':' + o.textContent.trim()) : 'NO SELECT';
    });
    const emb = document.querySelector('input[name="embed[embed_type]"]');
    out.typeInput = emb ? emb.value : 'none';
    return out;
  });
  log('EMBED DOM:', JSON.stringify(embedOpts));

  // try submit with guesses
  const result = await page.evaluate(async () => {
    const form = document.querySelector('form.game_edit_form');
    if (!form) return { err: 'no form' };
    const fd = new FormData(form);
    fd.set('embed[embed_type]', 'frame');
    fd.set('embed[size_type]', 'manual');
    fd.set('embed[width]', '960');
    fd.set('embed[height]', '540');
    const resp = await fetch('https://itch.io/game/edit/4993039', { method: 'POST', body: fd, credentials: 'include' });
    const bodyText = await resp.text();
    return { status: resp.status, body: bodyText.replace(/\s+/g, ' ').slice(0, 600) };
  });
  log('RESULT:', JSON.stringify(result, null, 1));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
