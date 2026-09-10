import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[probe]', ...a);
try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  log('URL:', page.url());
  // find Add Product link
  const hit = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a,button,div,[class*=btn]')).filter(e => (e.innerText||'').trim().match(/上架新商品|Add Product/i));
    return els.slice(0,3).map(e => e.tagName + '|' + (e.className||'').slice(0,60) + '|' + (e.getAttribute('href')||''));
  });
  log('ADD BTN:', JSON.stringify(hit));
  // try navigate via matching link or click
  if (hit.length && hit[0].split('|')[2].startsWith('/')) {
    const href = hit[0].split('|')[2];
    log('navigating to', href);
    await page.goto('https://afdian.com' + href, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  } else {
    const ok = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('a,button,div,[class*=btn]')).find(e => (e.innerText||'').trim().match(/上架新商品|Add Product/i));
      if (el) { el.click(); return true; }
      return false;
    });
    log('clicked:', ok);
    await page.waitForTimeout(4000);
  }
  log('FORM URL:', page.url());
  await page.screenshot({ path: '/tmp/dz-afdian-form.png' });
  const dump = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input,textarea,select')).map(i => ({
      tag: i.tagName, type: i.type||'', name: i.name||'', id: i.id||'', ph: i.placeholder||'', val: (i.value||'').slice(0,40)
    }));
    return { inputs, text: document.body.innerText.slice(0,700) };
  });
  log('INPUTS:', JSON.stringify(dump.inputs, null, 0));
  log('TEXT:', dump.text.replace(/\n+/g,' | ').slice(0,500));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
