import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[types]', ...a);

try {
  await page.goto('https://itch.io/game/edit/4993039', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);

  const found = await page.evaluate(() => {
    const hits = [];
    const scan = (obj, path, depth) => {
      if (depth > 4 || !obj || typeof obj !== 'object') return;
      try {
        const s = JSON.stringify(obj);
        if (s && s.includes('html5') && s.includes('Downloadable')) {
          hits.push(path + ' => ' + s.slice(0, 400));
        }
      } catch {}
      if (depth < 3) {
        for (const k of Object.keys(obj).slice(0, 40)) {
          if (typeof obj[k] === 'object' && obj[k] !== null) scan(obj[k], path + '.' + k, depth + 1);
        }
      }
    };
    scan(window, 'window', 0);
    // also check DOM data attributes on the select wrapper
    const sel = document.querySelector('select[name="game[type]"]');
    if (sel) {
      hits.push('select attrs: ' + JSON.stringify(Array.from(sel.attributes).map(a => a.name + '=' + a.value.slice(0, 80))));
      const opts = sel.querySelectorAll('option');
      hits.push('options in DOM: ' + Array.from(opts).map(o => o.value + ':' + o.textContent.trim()).join(' | '));
    }
    return hits.slice(0, 6);
  });
  log('FOUND:', JSON.stringify(found, null, 1));
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
