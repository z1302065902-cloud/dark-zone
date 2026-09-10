import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-afdian2-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[pub2]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);

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

  // Add version (delivery)
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button,a,div[class*=btn]')).find(e => (e.innerText||'').trim().match(/Add version/i));
    b.click();
  });
  await sleep(3000);
  log('add-version clicked');

  // upload zip to the LAST file input (delivery)
  const fileInputs = page.locator('input[type=file]');
  const n = await fileInputs.count();
  log('file inputs:', n);
  await fileInputs.nth(n - 1).setInputFiles('/tmp/dark-zone.zip');
  log('zip uploaded, waiting for server upload...');
  await sleep(15000); // wait for zip upload (9MB)

  // probe upload status: look for file name / uploading indicator / error
  const probe = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasZip: body.includes('dark-zone.zip') || body.includes('dark-zone'),
      uploading: body.includes('Uploading') || body.includes('上传中') || body.includes('Loading'),
      err: body.match(/fail|error|错误|失败|超过|too large/i)?.[0] || null,
      aroundVersion: (body.match(new RegExp('.{60}dark-zone.{60}')) || [''])[0]
    };
  });
  log('UPLOAD PROBE:', JSON.stringify(probe));
  await page.screenshot({ path: '/tmp/dz-afdian-zip.png' });

  // Publish button
  const pub = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('button,[class*=btn]')).filter(e => e.offsetParent !== null && /Publish|Save and/.test(e.innerText||''));
    return els.map(e => (e.innerText||'').trim() + '|' + (e.className||'').slice(0,50) + '|' + (e.disabled ? 'DISABLED' : 'enabled'));
  });
  log('PUBLISH BTNS:', JSON.stringify(pub));
} catch (e) { log('ERROR:', e.message); await page.screenshot({ path: '/tmp/dz-afdian-err2.png' }).catch(()=>{}); }
await ctx.close();
