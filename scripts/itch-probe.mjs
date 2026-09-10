import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const HEADLESS = process.env.HEADLESS !== '0';

const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: HEADLESS,
  firefoxUserPrefs: {
    'dom.disable_open_during_load': false,
  },
  viewport: { width: 1440, height: 1000 },
});

const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[itch]', ...a);

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  log('URL:', page.url());
  log('TITLE:', await page.title());
  const body = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 400) : '');
  log('BODY:', body.replace(/\n+/g, ' | ').slice(0, 400));
  // login check
  const loggedIn = await page.evaluate(() => !!document.querySelector('.user_avatar, .userbar, .header_userbox'));
  log('loggedIn (by userbar):', loggedIn);
  const hasTitle = await page.locator('input[name="title"], #new_game_title, input[placeholder*="Title"], input.form-control').count();
  log('input count:', await page.locator('input').count());
  // dump form field names
  const inputs = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('input, select, textarea').forEach(el => {
      out.push({ tag: el.tagName, name: el.name, id: el.id, type: el.type, ph: (el.placeholder||'').slice(0,30), val: (el.value||'').toString().slice(0,30) });
    });
    return out;
  });
  log('FIELDS:', JSON.stringify(inputs, null, 1));
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
