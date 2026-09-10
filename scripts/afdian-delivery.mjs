import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[publish]', ...a);
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
    '<p>免费试玩：<a href="https://z1302065902-cloud.github.io/dark-zone/" target="_blank" rel="nofollow">GitHub Pages</a> · <a href="https://zsy2026.itch.io/dark-zone" target="_blank" rel="nofollow">itch.io</a></p>',
    '<p>本商品为完整版离线包（HTML5，解压后双击 index.html 即可游玩），含全部关卡与最终 Boss。支持中英双语。</p>',
    '<p>虚拟商品售出不退；付款后请私信「补发」获取下载。</p>'
  ].join('');
  await page.evaluate((html) => {
    const ed = document.querySelector('[contenteditable="true"]');
    ed.innerHTML = html;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
  }, bodyHTML);
  await sleep(1000);
  log('main form done');

  // === delivery: Ways to provide contents ===
  // probe the "Add version" / delivery section
  const del = await page.evaluate(() => {
    const txt = document.body.innerText;
    const hasWays = txt.includes('Ways to provide contents');
    // find any button/link near "Add version"
    const btns = Array.from(document.querySelectorAll('button,a,div[class*=btn]')).filter(e => (e.innerText||'').trim() === 'Add version' || (e.innerText||'').trim().match(/Add version/i));
    return { hasWays, btns: btns.slice(0,3).map(b => b.tagName+'|'+(b.className||'').slice(0,50)) };
  });
  log('DELIVERY:', JSON.stringify(del));

  if (del.btns.length) {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button,a,div[class*=btn]')).find(e => (e.innerText||'').trim().match(/Add version/i));
      b.click();
    });
    await sleep(3000);
    // probe upload area now
    const probe = await page.evaluate(() => {
      const fileInputs = Array.from(document.querySelectorAll('input[type=file]')).map(f => ({ n: f.name||'', cls: (f.className||'').slice(0,40), parent: (f.closest('div')?.innerText||'').slice(0,60) }));
      const visibleBtns = Array.from(document.querySelectorAll('button,[class*=btn]')).filter(e => e.offsetParent !== null).map(b => (b.innerText||'').trim()).filter(t => t && t.length < 25).slice(-15);
      return { fileInputs, visibleBtns, txt: document.body.innerText.match(/Upload|upload|File|file|link|Link|数字|文件|网盘|链接/g)?.slice(0,10) };
    });
    log('AFTER ADD VERSION:', JSON.stringify(probe, null, 1).slice(0, 900));
    await page.screenshot({ path: '/tmp/dz-afdian-delivery.png' });
  } else {
    log('No Add version btn found; text has ways?', del.hasWays);
    await page.screenshot({ path: '/tmp/dz-afdian-delivery2.png' });
  }
} catch (e) { log('ERROR:', e.message); await page.screenshot({ path: '/tmp/dz-afdian-err.png' }).catch(()=>{}); }
await ctx.close();
