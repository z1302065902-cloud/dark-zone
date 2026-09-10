import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[create]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3500);
  // open Add Product
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  log('FORM URL:', page.url());

  // 1. name
  const nameInput = page.locator('input[placeholder="Name of Product"]');
  await nameInput.fill('DARK ZONE 完整版');
  // 2. price
  const priceInput = page.locator('input[placeholder="00.00"]').first();
  await priceInput.fill('7');
  log('name+price done');

  // 3. cover upload
  const fileInput = page.locator('input[type=file]').first();
  await fileInput.setInputFiles('/tmp/dz-cover-square.png');
  await sleep(3000);
  log('cover uploaded');

  // 4. Froala editor body
  const fr = await page.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]');
    return ed ? ed.outerHTML.slice(0, 200) : 'NOT FOUND';
  });
  log('FROALA:', fr.replace(/\s+/g, ' ').slice(0, 150));

  // set description via Froala API if available
  const bodyHTML = [
    '<h2>DARK ZONE 黑暗禁区</h2>',
    '<p>第一人称 3D 恐怖潜行游戏。找到钥匙卡、恢复电力、击败最终 Boss，逃出黑暗医院。</p>',
    '<p>免费试玩：<a href="https://z1302065902-cloud.github.io/dark-zone/" target="_blank" rel="nofollow">GitHub Pages</a> · <a href="https://zsy2026.itch.io/dark-zone" target="_blank" rel="nofollow">itch.io</a></p>',
    '<p>本商品为完整版离线包（HTML5，解压后双击 index.html 即可游玩），含全部关卡与最终 Boss。支持中英双语。</p>',
    '<p>虚拟商品售出不退；付款后请私信「补发」获取下载。</p>'
  ].join('');
  const ok = await page.evaluate((html) => {
    const ed = document.querySelector('[contenteditable="true"]');
    if (!ed) return false;
    ed.innerHTML = html;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }, bodyHTML);
  log('body set:', ok);
  await sleep(1500);
  await page.screenshot({ path: '/tmp/dz-afdian-filled.png' });
  // verify rendered values
  const check = await page.evaluate(() => ({
    name: document.querySelector('input[placeholder="Name of Product"]')?.value,
    price: document.querySelector('input[placeholder="00.00"]')?.value,
    body: (document.querySelector('[contenteditable="true"]')?.innerText||'').slice(0, 120)
  }));
  log('CHECK:', JSON.stringify(check));
} catch (e) { log('ERROR:', e.message); await page.screenshot({ path: '/tmp/dz-afdian-err.png' }).catch(()=>{}); }
await ctx.close();
