import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[dprobe3]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  await page.locator('input[placeholder="Name of Product"]').fill('X');
  await sleep(800);

  // locate the arrow-down that belongs to Ways to provide (skip froala arrows)
  const arrow = await page.evaluate(() => {
    const arrows = Array.from(document.querySelectorAll('i[class*=afd-arrow]')).filter(a => a.offsetParent !== null);
    // pick the one NOT inside froala (fr-*) 
    const good = arrows.filter(a => !a.closest('.fr-'));
    return good.map(a => ({ cls: a.className, parent: (a.parentElement?.className||'').slice(0,50), text: (a.parentElement?.innerText||'').slice(0,40) }));
  });
  log('ARROWS:', JSON.stringify(arrow));

  // click the first non-froala arrow
  const clicked = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll('i[class*=afd-arrow]')).find(a => a.offsetParent !== null && !a.closest('.fr-'));
    if (a) { a.click(); return true; }
    return false;
  });
  log('clicked arrow:', clicked);
  await sleep(2500);
  // dump any newly visible menu/dropdown/panel
  const menu = await page.evaluate(() => {
    const vis = Array.from(document.querySelectorAll('*')).filter(e => {
      const c = e.className || '';
      return e.offsetParent !== null && /dropdown|select|menu|popup|option|choose|upload/i.test(c) && e.children.length <= 8;
    }).slice(0, 12).map(e => e.tagName + '|' + String(e.className).slice(0, 55) + '|' + (e.innerText||'').slice(0, 40));
    const added = Array.from(document.querySelectorAll('input[type=file],input[type=text]')).filter(e => e.offsetParent !== null && /upload|file|link/i.test((e.closest('div')?.className||''))).length;
    const bodyHas = /File|link|数字|文件|网盘|夸克|Upload/i.test(document.body.innerText);
    return { vis, bodyHas, sample: document.body.innerText.match(/[^\n]{0,50}(File|link|数字|文件|网盘|夸克|Upload)[^\n]{0,50}/gi)?.slice(0,6) };
  });
  log('MENU:', JSON.stringify(menu, null, 1).slice(0, 1200));
  await page.screenshot({ path: '/tmp/dz-afdian-arrow.png' });
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
