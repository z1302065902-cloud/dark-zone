import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[candy]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  // CandyHop edit page (existing product with digital file delivery)
  await page.goto('https://afdian.com/edit/shop?plan_id=6f3448f4ab8f11f1b5665254001e7c00&product_type=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);
  log('URL:', page.url());

  const dump = await page.evaluate(() => {
    // find the Ways to provide region
    const all = Array.from(document.querySelectorAll('*'));
    const host = all.find(e => e.children.length > 0 &&
      Array.from(e.childNodes).some(n => n.nodeType === 3 && /Ways to provide|提供商品/.test(n.textContent||'')));
    // walk up a few levels and capture structure
    let el = host, out = [];
    for (let d = 0; d < 4 && el; d++) {
      el = el.parentElement;
      if (!el) break;
      const items = [];
      const walk = (n, dep) => {
        if (dep > 3) return;
        for (const c of n.children) {
          const cls = String(c.className || '');
          if (c.tagName === 'INPUT' || c.tagName === 'SELECT' || c.tagName === 'TEXTAREA' || /upload|file|choose|deliver|zip|attachment/i.test(cls)) {
            items.push(c.tagName + '|' + (c.type||'') + '|' + cls.slice(0, 60) + '|' + (c.value||'').slice(0,30));
          }
          walk(c, dep + 1);
        }
      };
      walk(el, 0);
      if (items.length) out.push({ depth: d, cls: (el.className||'').slice(0,60), items: items.slice(0, 12) });
    }
    return { out, txt: document.body.innerText.match(/[^\n]{0,60}(zip|Zip|文件|下载|夸克|pan\.quark|数字)[^\n]{0,60}/g)?.slice(0,8) };
  });
  log('CANDY STRUCTURE:', JSON.stringify(dump, null, 1).slice(0, 1800));
  await page.screenshot({ path: '/tmp/dz-candy-edit.png' });
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
