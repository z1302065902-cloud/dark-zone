import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[itch]', ...a);

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const selects = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('select').forEach((el, i) => {
      out.push({
        i, name: el.name, id: el.id,
        cur: el.value,
        options: Array.from(el.options).map(o => o.value + '=' + o.textContent.trim().slice(0, 40)),
      });
    });
    return out;
  });
  log('SELECTS:', JSON.stringify(selects, null, 1));

  const radios = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('input[type=radio], input[type=checkbox]').forEach((el, i) => {
      out.push({ i, name: el.name, val: el.value, checked: el.checked, label: (el.closest('label')?.innerText || '').slice(0, 40) });
    });
    return out;
  });
  log('RADIOS/CHECKBOXES:', JSON.stringify(radios, null, 1));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, input[type=submit], a.btn'))
      .map((b, i) => ({ i, tag: b.tagName, type: b.type || '', txt: (b.innerText || b.value || '').trim().slice(0, 40) }));
  });
  log('BUTTONS:', JSON.stringify(buttons, null, 1));
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
