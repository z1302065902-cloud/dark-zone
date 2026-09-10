import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[form]', ...a);

try {
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const forms = Array.from(document.querySelectorAll('form')).map(f => ({
      action: f.getAttribute('action'),
      method: f.method,
      id: f.id,
      cls: (f.className || '').slice(0, 60),
      inputs: Array.from(f.querySelectorAll('input, select, textarea')).map(el => ({
        tag: el.tagName, name: el.name, type: el.type, id: el.id,
        val: el.type === 'checkbox' ? (el.checked ? 'CHECKED' : '') : (el.value || ''),
        cls: (el.className || '').slice(0, 30),
      })),
    }));
    return { nForms: forms.length, forms };
  });
  log('FORMS:', JSON.stringify(info, null, 1).slice(0, 6000));
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
