import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[dprobe2]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  await page.locator('input[placeholder="Name of Product"]').fill('X');
  await sleep(800);

  // find the element containing "Ways to provide" text and walk up/down
  const info = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const host = all.find(e => e.children.length > 0 && e.childNodes.length > 0 &&
      Array.from(e.childNodes).some(n => n.nodeType === 3 && /Ways to provide/.test(n.textContent||'')));
    if (!host) return { found: false };
    // walk up to 4 parents, find container with upload/select/radio children
    let el = host;
    const results = [];
    for (let d = 0; d < 5; d++) {
      el = el.parentElement; if (!el) break;
      const interact = [];
      const walk = (n, dep) => {
        if (dep > 4) return;
        for (const c of n.children) {
          const cls = c.className || '';
          if (c.tagName === 'INPUT' || c.tagName === 'SELECT' || c.tagName === 'TEXTAREA' || /upload|choose|drop|select|radio|arrow/i.test(cls)) {
            interact.push(c.tagName + '|' + (c.type||'') + '|' + cls.slice(0, 55));
          }
          walk(c, dep + 1);
        }
      };
      walk(el, 0);
      if (interact.length) {
        results.push({ depth: d, cls: (el.className||'').slice(0,60), elems: interact.slice(0, 14) });
      }
    }
    return { found: true, results };
  });
  log('PROBE:', JSON.stringify(info, null, 1).slice(0, 1400));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
