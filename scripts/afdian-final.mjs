import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[final]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  log('FORM URL:', page.url());

  // main form
  await page.locator('input[placeholder="Name of Product"]').fill('DARK ZONE 完整版');
  await page.locator('input[placeholder="00.00"]').first().fill('7');
  await page.locator('input[type=file]').first().setInputFiles('/tmp/dz-cover-square.png');
  await sleep(2500);

  const bodyHTML = [
    '<h2>DARK ZONE 黑暗禁区</h2>',
    '<p>第一人称 3D 恐怖潜行游戏。找到钥匙卡、恢复电力、击败最终 Boss，逃出黑暗医院。</p>',
    '<p>🎮 游戏特色：</p>',
    '<ul><li>全 3D 第一人称恐怖潜行，暗黑医院场景</li><li>9 大目标：钥匙卡→恢复电力→击败 Boss→逃离医院</li><li>手电筒+武器战斗，潜入与击杀双路线</li><li>中英双语切换，PC 键鼠 / 手机双端适配</li><li>本地文件离线即玩，无广告无内购</li></ul>',
    '<p>🆓 免费试玩：<a href="https://z1302065902-cloud.github.io/dark-zone/" target="_blank" rel="nofollow">GitHub Pages</a> · <a href="https://zsy2026.itch.io/dark-zone" target="_blank" rel="nofollow">itch.io</a></p>',
    '<p>📦 包含内容：完整版 HTML5 离线包（解压后双击 index.html 即可游玩），含全部关卡与最终 Boss。</p>',
    '<p>⬇️ 获取方式：付款后请私信「补发」获取下载链接。</p>',
    '<p>虚拟商品售出不退。</p>'
  ].join('');
  await page.evaluate((html) => {
    const ed = document.querySelector('[contenteditable="true"]');
    ed.innerHTML = html;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, bodyHTML);
  await sleep(1500);
  log('form filled');

  // === Publish ===
  const pubBtn = page.getByText('Publish', { exact: true }).first();
  const n = await pubBtn.count();
  log('Publish buttons:', n);
  await pubBtn.click({ timeout: 8000 });
  log('Publish clicked, waiting...');
  await sleep(8000);

  // result: check URL / errors / success
  const result = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      url: location.href,
      err: (t.match(/fail|error|错误|必填|Required|too long|超过|limit/i) || [])[0] || null,
      hasSave: t.includes('Save and Unpublish'),
      toast: (t.match(/成功|Success|已上架|Published/i) || [])[0] || null,
    };
  });
  log('RESULT:', JSON.stringify(result));
  await page.screenshot({ path: '/tmp/dz-afdian-published.png' });

  // go back to shop list to see the new product + extract link
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded' });
  await sleep(3500);
  const list = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('*')).filter(e => {
      const t = (e.innerText||'');
      return e.children.length > 0 && t.includes('DARK ZONE') && t.length < 400;
    });
    return rows.slice(0,2).map(r => r.innerText.replace(/\n+/g,' | ').slice(0,200));
  });
  log('LIST:', JSON.stringify(list));
  // find item link in the list (View/Share hrefs)
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="item"]')).map(a => a.href).filter(h => !h.includes('edit')).slice(0,5);
  });
  log('ITEM LINKS:', JSON.stringify(links));
} catch (e) { log('ERROR:', e.message); await page.screenshot({ path: '/tmp/dz-afdian-final-err.png' }).catch(()=>{}); }
await ctx.close();
