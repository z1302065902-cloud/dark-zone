import { firefox } from 'playwright';
const ctx = await firefox.launchPersistentContext('/tmp/dz-afdian2-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[pub2x]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
page.on('response', async r => {
  const u = r.url();
  if (/api\/creator\/(edit|save|new)-plan/.test(u)) {
    try { log('RESP', r.status(), u.split('?')[0].slice(-40), (await r.text()).slice(0, 250)); } catch {}
  }
});
try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  await page.locator('input[placeholder="Name of Product"]').fill('DARK ZONE 完整版');
  await page.locator('input[placeholder="00.00"]').first().fill('7');
  await page.locator('input[type=file]').first().setInputFiles('/tmp/dz-cover-square.png');
  await sleep(5000);
  const bodyHTML = [
    '<h2>DARK ZONE 黑暗禁区</h2>',
    '<p>第一人称 3D 恐怖潜行游戏。找到钥匙卡、恢复电力、击败最终 Boss，逃出黑暗医院。</p>',
    '<ul><li>全 3D 第一人称恐怖潜行</li><li>9 大目标：钥匙卡→恢复电力→击败 Boss→逃离医院</li><li>中英双语，PC/手机双端</li></ul>',
    '<p>免费试玩：<a href="https://z1302065902-cloud.github.io/dark-zone/" target="_blank">GitHub Pages</a> · <a href="https://zsy2026.itch.io/dark-zone" target="_blank">itch.io</a></p>',
    '<p>付款后请私信「补发」获取下载链接。虚拟商品售出不退。</p>'
  ].join('');
  await page.evaluate((html) => {
    const ed = document.querySelector('[contenteditable="true"]');
    ed.innerHTML = html;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, bodyHTML);
  await sleep(800);
  // SKU1: fill 型号名称 + 型号价格
  const sku = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[placeholder]'));
    const name = inputs.find(i => i.placeholder === 'Required, fill in the name');
    const price = inputs.find(i => i.placeholder.includes('Optional, default'));
    const stock = inputs.find(i => i.placeholder === 'Stock(optional)');
    if (name) { name.focus(); name.value = '完整版'; name.dispatchEvent(new Event('input', { bubbles: true })); name.dispatchEvent(new Event('change', { bubbles: true })); }
    if (price) { price.value = '7'; price.dispatchEvent(new Event('input', { bubbles: true })); price.dispatchEvent(new Event('change', { bubbles: true })); }
    return { nameFound: !!name, priceFound: !!price, stockFound: !!stock };
  });
  log('SKU fill:', JSON.stringify(sku));
  await sleep(800);
  // also blur the inputs so Vue registers
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el) el.blur();
  });
  await sleep(500);
  // click Publish
  const n = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button,[class*=btn]')).find(e => e.offsetParent !== null && (e.innerText||'').trim() === 'Publish');
    if (b) { b.click(); return true; }
    return false;
  });
  log('Publish clicked:', n);
  await sleep(9000);
  const after = await page.evaluate(() => ({
    url: location.href,
    hasForm: !!document.querySelector('input[placeholder="Name of Product"]'),
    toast: Array.from(document.querySelectorAll('[class*=toast]')).filter(e => e.offsetParent!==null).map(e => (e.innerText||'').trim()).filter(Boolean).slice(0,3)
  }));
  log('AFTER:', JSON.stringify(after));
  await page.screenshot({ path: '/tmp/dz-afdian-pub2.png' });
  // check shop list
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded' });
  await sleep(3500);
  const body = await page.evaluate(() => document.body.innerText);
  log('LIST has DARK ZONE:', body.includes('DARK ZONE'));
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
