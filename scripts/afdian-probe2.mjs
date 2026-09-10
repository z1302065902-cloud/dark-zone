import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[probe2]', ...a);
try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3500);
  // Try real click on Add Product via text locator
  const loc = page.getByText('Add Product', { exact: false }).first();
  const n = await loc.count();
  log('AddProduct locators:', n);
  if (n > 0) {
    await loc.click({ timeout: 8000 }).catch(e => log('click err', e.message));
    await page.waitForTimeout(5000);
  }
  log('URL now:', page.url());
  await page.screenshot({ path: '/tmp/dz-afdian-form2.png' });
  const dump = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input,textarea,select')).map(i => ({
      tag: i.tagName, type: i.type||'', name: i.name||'', id: i.id||'', ph: i.placeholder||'', val: (i.value||'').slice(0,40)
    }));
    // check if any modal/dialog visible
    const modals = Array.from(document.querySelectorAll('[class*=modal],[class*=dialog],[class*=popup]')).filter(m => m.offsetParent !== null).length;
    return { inputs, modals, text: document.body.innerText.slice(0,900) };
  });
  log('INPUTS:', JSON.stringify(dump.inputs));
  log('MODALS:', dump.modals);
  log('TEXT:', dump.text.replace(/\n+/g,' | ').slice(0,700));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
