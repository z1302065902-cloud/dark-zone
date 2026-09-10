import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[dbg2]', ...a);

page.on('console', m => { if (m.type() === 'error') log('CONSOLE-ERR:', m.text().slice(0, 250)); });
page.on('pageerror', e => log('PAGEERR:', e.message.slice(0, 250)));

const posts = [];
page.on('response', async r => {
  if (r.request().method() === 'POST') {
    let body = '';
    try { body = (await r.text()).slice(0, 200); } catch {}
    posts.push({ url: r.url().slice(0, 80), status: r.status(), body: body.replace(/\s+/g, ' ').slice(0, 150) });
  }
});

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  await page.fill('input[name="game[title]"]', 'DARK ZONE');
  await page.fill('input[name="game[slug]"]', 'dark-zone');
  await page.fill('input[name="game[short_text]"]', 'First-person 3D horror stealth game. Survive a dark abandoned hospital: find the keycard, restore power, defeat the boss, escape alive. 中英双语');
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

  await page.waitForTimeout(3500);

  // slug hint text
  const slugHint = await page.evaluate(() => {
    const slug = document.querySelector('input[name="game[slug]"]');
    let hint = '';
    if (slug) {
      const box = slug.closest('.form_row') || slug.parentElement;
      if (box) hint = (box.innerText || '').slice(0, 200);
    }
    return hint;
  });
  log('SLUG HINT:', JSON.stringify(slugHint));

  // click first visible submit
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[type="submit"]')).filter(b => b.offsetParent);
    if (btns.length) { btns[0].click(); return 'clicked visible submit #' + btns.length; }
    return 'no visible submit';
  });
  log('click:', clicked);
  await page.waitForTimeout(8000);
  log('URL after click:', page.url());
  log('TITLE:', await page.title());
  log('POSTS:', JSON.stringify(posts, null, 1));

  const errs = await page.evaluate(() => Array.from(document.querySelectorAll('.form_error, .form_errors, [class*="error"], [role="alert"]')).map(e => (e.innerText || '').trim().slice(0, 200)).filter(Boolean));
  log('ERRORS:', JSON.stringify(errs));
  await page.screenshot({ path: '/tmp/dz-itch-dbg2.png' });

  if (page.url().includes('dark-zone') && !page.url().includes('/game/new')) {
    log('====> GAME PAGE CREATED!');
    const body = await page.evaluate(() => document.body.innerText.slice(0, 400));
    log('body:', body.replace(/\n+/g, ' | ').slice(0, 400));
    await page.screenshot({ path: '/tmp/dz-itch-created2.png' });
  }
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
