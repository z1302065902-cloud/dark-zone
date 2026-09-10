import { firefox } from 'playwright';
const ctx = await firefox.launchPersistentContext('/tmp/dz-afdian2-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
try {
  await page.goto('https://afdian.com/edit/shop?plan_id=6f3448f4ab8f11f1b5665254001e7c00&product_type=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);
  const info = await page.evaluate(() => {
    const host = Array.from(document.querySelectorAll('*')).find(e => e.children.length > 0 &&
      Array.from(e.childNodes).some(n => n.nodeType === 3 && /Ways to provide/.test(n.textContent||'')));
    // walk up to find the full sku block, dump its text
    let el = host;
    for (let d = 0; d < 3; d++) el = el.parentElement;
    const texts = [];
    const walk = (n, dep) => {
      if (dep > 4) return;
      for (const c of n.children) {
        if (c.children.length === 0 && (c.innerText||'').trim()) texts.push((c.innerText||'').trim().slice(0,80));
        walk(c, dep+1);
      }
    };
    walk(el, 0);
    return { blockText: el.innerText.slice(0, 900), texts: texts.filter(t => !/设置|Settings|Dashboard/.test(t)).slice(0, 30) };
  });
  console.log('BLOCK TEXT:', info.blockText.replace(/\n+/g,' | '));
  console.log('LEAF TEXTS:', JSON.stringify(info.texts));
} catch (e) { console.log('ERR', e.message); }
await ctx.close();
