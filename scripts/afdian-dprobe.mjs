import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[dprobe]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  await page.locator('input[placeholder="Name of Product"]').fill('DARK ZONE 完整版');
  await page.locator('input[placeholder="00.00"]').first().fill('7');
  await sleep(1000);

  // find & click Add version
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button,a,div[class*=btn]')).find(e => (e.innerText||'').trim().match(/Add version/i));
    b.click();
  });
  await sleep(3000);
  // dump the delivery region: find element whose class has 'sku' or text 'Ways to provide'
  const region = await page.evaluate(() => {
    const out = {};
    // find parent of Add version
    const addBtn = Array.from(document.querySelectorAll('div[class*=btn]')).find(e => (e.innerText||'').trim().match(/Add version/i));
    let el = addBtn, depth = 0;
    while (el && depth < 6) {
      el = el.parentElement; depth++;
      if (el && /sku|deliver|version|Sku/i.test(el.className||'') && el.className.includes('sku')) break;
    }
    if (el) {
      const walk = (n, acc, d) => {
        if (d > 5 || !n || acc.length > 60) return;
        if (n.tagName === 'INPUT') acc.push('INPUT:' + (n.type||'') + ':' + (n.name||'') + ':' + (n.id||'') + ' cls=' + (n.className||'').slice(0,30));
        if (n.tagName === 'DIV' && (n.className||'').match(/upload|uploader|choose|file/i)) acc.push('DIV:' + n.className.slice(0,50));
        for (const c of n.children) walk(c, acc, d+1);
      };
      const acc = [];
      walk(el, acc, 0);
      out.inputs = acc;
      out.html = el.outerHTML.slice(0, 1200);
    }
    // also dump section text after 'Ways to provide'
    const m = document.body.innerText.match(/Ways to provide[\s\S]{0,300}/);
    out.sectionText = m ? m[0].replace(/\n+/g, ' | ') : null;
    return out;
  });
  log('REGION INPUTS:', JSON.stringify(region.inputs));
  log('SECTION TEXT:', region.sectionText);
  log('REGION HTML:', (region.html||'').slice(0, 800));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
