import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[edit]', ...a);

try {
  await page.goto('https://itch.io/game/edit/4993039', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  log('URL:', page.url());
  log('TITLE:', await page.title());

  const info = await page.evaluate(() => {
    const form = document.querySelector('form.game_edit_form');
    if (!form) return { err: 'no form' };
    const out = {};
    const typeSel = form.querySelector('select[name="game[type]"]');
    if (typeSel) {
      out.typeOptions = Array.from(typeSel.options).map(o => ({ v: o.value, t: o.textContent.trim().slice(0, 30) }));
      out.typeCur = typeSel.value;
    }
    const short = form.querySelector('input[name="game[short_text]"]');
    if (short) out.shortCur = short.value;
    const title = form.querySelector('input[name="game[title]"]');
    if (title) out.titleCur = title.value;
    out.csrf = (form.querySelector('input[name="csrf_token"]') || {}).value;
    return out;
  });
  log('INFO:', JSON.stringify(info, null, 1));
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
