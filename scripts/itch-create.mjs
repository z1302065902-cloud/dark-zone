import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[create]', ...a);

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  // 1. inspect type select options
  const typeOpts = await page.evaluate(() => {
    const s = document.querySelector('select[name="game[type]"]');
    return s ? Array.from(s.options).map(o => o.value) : 'NO SELECT';
  });
  log('type select options:', JSON.stringify(typeOpts));

  // 2. fill title
  await page.fill('input[name="game[title]"]', 'DARK ZONE');
  log('title filled:', await page.inputValue('input[name="game[title]"]'));

  // 3. fill slug
  await page.fill('input[name="game[slug]"]', 'dark-zone');
  log('slug filled:', await page.inputValue('input[name="game[slug]"]'));

  // 4. short text
  await page.fill('input[name="game[short_text]"]', 'First-person 3D horror stealth game. Survive a dark abandoned hospital: find the keycard, restore power, defeat the boss, escape alive. 中英双语');
  log('short_text filled');

  // 5. set type = html via selectOption or JS
  const setHtml = await page.evaluate(() => {
    const s = document.querySelector('select[name="game[type]"]');
    if (!s) return 'NO SELECT';
    if (!Array.from(s.options).some(o => o.value === 'html')) {
      const opt = document.createElement('option');
      opt.value = 'html';
      opt.text = 'HTML';
      s.appendChild(opt);
    }
    s.value = 'html';
    s.dispatchEvent(new Event('change', { bubbles: true }));
    return s.value;
  });
  log('type set to:', setHtml);

  // 6. publish status: keep draft (default). Optionally force published? keep draft.
  // 7. ai disclosure: No (game contains no generative-AI output)
  const ai = await page.evaluate(() => {
    const r = document.querySelector('input[name="ai_disclosure[ai_generated]"][value="no"]');
    if (r) { r.click(); return 'clicked-no'; }
    return 'no-radio-found';
  });
  log('ai disclosure:', ai);

  // 8. screenshot before submit
  await page.screenshot({ path: '/tmp/dz-itch-form.png' });

  // 9. submit
  log('submitting...');
  const btnCount = await page.locator('button[type="submit"]').count();
  log('submit buttons found:', btnCount);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => log('no navigation event (may still submit)')),
    page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn && !btn.disabled) { btn.click(); return 'clicked'; }
      const f = document.querySelector('form');
      if (f) { f.requestSubmit(); return 'requestSubmit'; }
      return 'nothing';
    }),
  ]);
  await page.waitForTimeout(4000);
  log('after submit URL:', page.url());
  log('after submit TITLE:', await page.title());

  // 10. verify
  const url = page.url();
  if (url.includes('dark-zone') && !url.includes('/game/new')) {
    log('RESULT: GAME PAGE CREATED');
    const body = await page.evaluate(() => document.body.innerText.slice(0, 300));
    log('body:', body.replace(/\n+/g, ' | ').slice(0, 300));
    await page.screenshot({ path: '/tmp/dz-itch-created.png', fullPage: false });
  } else {
    log('RESULT: STILL ON FORM (or redirected elsewhere)');
    const body = await page.evaluate(() => document.body.innerText.slice(0, 500));
    log('body:', body.replace(/\n+/g, ' | ').slice(0, 500));
    await page.screenshot({ path: '/tmp/dz-itch-form-error.png' });
  }
} catch (e) {
  log('ERROR:', e.message);
  await page.screenshot({ path: '/tmp/dz-itch-error.png' }).catch(() => {});
}
await ctx.close();
