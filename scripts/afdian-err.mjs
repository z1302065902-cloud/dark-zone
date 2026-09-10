import { firefox } from 'playwright';
const ctx = await firefox.launchPersistentContext('/tmp/dz-afdian2-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
try {
  await page.goto('https://afdian.com/setting/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await page.getByText('Add Product', { exact: false }).first().click({ timeout: 8000 });
  await sleep(4000);
  // check for error toast/limit text right away
  const probe = await page.evaluate(() => {
    const m = document.body.innerText.match(/[^\n]{0,80}(Limit|limit|Error|error|失败|错误|最大|限制|size|Size|MB|上传)[^\n]{0,80}/g);
    return m ? m.slice(0, 8) : null;
  });
  console.log('LIMIT CTX:', JSON.stringify(probe));

  // fill name+price, upload cover, wait, publish, then capture errors
  await page.locator('input[placeholder="Name of Product"]').fill('DARK ZONE 完整版');
  await page.locator('input[placeholder="00.00"]').first().fill('7');
  await page.locator('input[type=file]').first().setInputFiles('/tmp/dz-cover-square.png');
  await sleep(4000);
  // check cover upload status
  const cover = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => s.includes('afdian') || s.includes('cdn') || s.includes('blob'));
    return { imgs: imgs.slice(0,3), txt: document.body.innerText.match(/[^\n]{0,60}(Limit|size|MB|上传|cover|Cover)[^\n]{0,60}/g)?.slice(0,5) };
  });
  console.log('COVER:', JSON.stringify(cover));

  // check cover image actual file info
  const fs = require('fs');
  const st = fs.statSync('/tmp/dz-cover-square.png');
  console.log('cover file bytes:', st.size);
} catch (e) { console.log('ERR', e.message); }
await ctx.close();
