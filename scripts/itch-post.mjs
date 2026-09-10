import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[post]', ...a);

page.on('console', m => { if (m.type() === 'error') log('CONSOLE-ERR:', m.text().slice(0, 200)); });

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // fill real inputs (sync React state)
  await page.fill('input[name="game[title]"]', 'DARK ZONE');
  await page.fill('input[name="game[slug]"]', 'dark-zone');
  await page.fill('input[name="game[short_text]"]', 'First-person 3D horror stealth game. Survive a dark abandoned hospital: find the keycard, restore power, defeat the boss, escape alive. 中英双语');
  await page.waitForTimeout(1500);

  // set type=html in DOM
  await page.evaluate(() => {
    const s = document.querySelector('select[name="game[type]"]');
    if (s) {
      if (!Array.from(s.options).some(o => o.value === 'html')) {
        const opt = document.createElement('option');
        opt.value = 'html'; opt.text = 'HTML';
        s.appendChild(opt);
      }
      s.value = 'html';
      s.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const result = await page.evaluate(async () => {
    const form = document.querySelector('form.game_edit_form');
    if (!form) return { err: 'no form' };
    const fd = new FormData(form);
    // explicit overrides (ensure correct values even if React state diverged)
    fd.set('game[title]', 'DARK ZONE');
    fd.set('game[slug]', 'dark-zone');
    fd.set('game[short_text]', 'First-person 3D horror stealth game. Survive a dark abandoned hospital: find the keycard, restore power, defeat the boss, escape alive. 中英双语');
    fd.set('game[type]', 'html');
    fd.set('game[user_classification]', 'game');
    fd.set('game[release_status]', 'released');
    fd.set('game[published]', 'draft');
    // ai disclosure: no
    fd.set('ai_disclosure[ai_generated]', 'no');
    // dump keys for debug
    const keys = Array.from(fd.keys());
    const resp = await fetch('https://itch.io/game/new', {
      method: 'POST',
      body: fd,
      credentials: 'include',
      headers: { 'Accept': 'application/json, text/html, */*' },
    });
    const ct = resp.headers.get('content-type') || '';
    let bodyText = '';
    try { bodyText = (await resp.text()).slice(0, 1000); } catch {}
    return {
      status: resp.status,
      ct,
      finalUrl: resp.url,
      keys,
      bodyPreview: bodyText.replace(/\s+/g, ' ').slice(0, 600),
    };
  });
  log('RESULT:', JSON.stringify(result, null, 1));

  // after post, navigate to see if game exists
  await page.waitForTimeout(2000);
  await page.goto('https://zsy2026.itch.io/dark-zone', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(2000);
  log('probe URL:', page.url());
  log('probe TITLE:', await page.title());
  const body = await page.evaluate(() => document.body.innerText.slice(0, 200));
  log('probe body:', body.replace(/\n+/g, ' | ').slice(0, 200));
  await page.screenshot({ path: '/tmp/dz-itch-post.png' });
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
