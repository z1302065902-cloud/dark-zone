import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[dbg]', ...a);

page.on('console', m => { if (m.type() === 'error') log('CONSOLE-ERR:', m.text().slice(0, 200)); });
page.on('pageerror', e => log('PAGEERR:', e.message.slice(0, 200)));

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  await page.fill('input[name="game[title]"]', 'DARK ZONE');
  await page.fill('input[name="game[slug]"]', 'dark-zone');
  await page.fill('input[name="game[short_text]"]', 'First-person 3D horror stealth game. 中英双语');
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

  // wait for slug availability check
  await page.waitForTimeout(3500);

  // dump state
  const state = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map(b => ({
      txt: (b.innerText || '').trim().slice(0, 25), type: b.type, dis: b.disabled, visible: !!(b.offsetParent),
    }));
    const errs = Array.from(document.querySelectorAll('.form_error, .error, .form_errors, [class*="error"], [role="alert"]')).map(e => (e.innerText || '').trim().slice(0, 120)).filter(Boolean);
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ n: i.name, v: i.value.slice(0, 30), cls: (i.className || '').slice(0, 40) })).filter(x => x.n.startsWith('game'));
    return { btns, errs, inputs };
  });
  log('BUTTONS:', JSON.stringify(state.btns, null, 1));
  log('ERRORS:', JSON.stringify(state.errs));
  log('INPUTS:', JSON.stringify(state.inputs, null, 1));

  // try requestSubmit
  const sub = await page.evaluate(() => {
    const f = document.querySelector('form');
    if (f) {
      try { f.requestSubmit(); return 'requestSubmit-ok'; } catch (e) { return 'requestSubmit-err: ' + e.message; }
    }
    return 'no-form';
  });
  log('submit attempt:', sub);
  await page.waitForTimeout(5000);
  log('URL after submit:', page.url());
  const errs2 = await page.evaluate(() => Array.from(document.querySelectorAll('.form_error, .form_errors, [class*="error"], [role="alert"]')).map(e => (e.innerText || '').trim().slice(0, 150)).filter(Boolean));
  log('ERRORS after submit:', JSON.stringify(errs2));
  await page.screenshot({ path: '/tmp/dz-itch-dbg.png' });
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
