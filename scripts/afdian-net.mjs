import { firefox } from 'playwright';
const ctx = await firefox.launchPersistentContext('/tmp/dz-afdian2-profile', { headless: false, viewport: { width: 1440, height: 1000 } });
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[net]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// capture network + console
page.on('console', m => { if (m.type() !== 'debug') log('CONSOLE:', m.text().slice(0, 200)); });
page.on('response', async r => {
  const u = r.url();
  if (/api|plan|sku|shop|upload|save/i.test(u) && !/static/.test(u)) {
    const status = r.status();
    if (status >= 400 || /save|upload|plan/i.test(u)) {
      let body = '';
      try { body = (await r.text()).slice(0, 400); } catch {}
      log('RESP', status, u.split('?')[0].slice(-80), '|', body.replace(/\s+/g,' ').slice(0, 250));
    }
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
  await sleep(6000); // longer wait for cover upload

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
    ed.dispatchEvent(new Event('keyup', { bubbles: true }));
  }, bodyHTML);
  await sleep(1000);

  // click Publish via DOM (find exact text button, force)
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button,[class*=btn]')).filter(e => e.offsetParent !== null && (e.innerText||'').trim() === 'Publish');
    if (btns.length) { btns[0].click(); return btns.length; }
    return 0;
  });
  log('publish click (dom):', clicked);
  await sleep(9000);

  const after = await page.evaluate(() => ({
    url: location.href,
    hasForm: !!document.querySelector('input[placeholder="Name of Product"]'),
    toasts: Array.from(document.querySelectorAll('[class*=toast],[class*=message],[class*=tip],[class*=notice]')).filter(e => e.offsetParent!==null && (e.innerText||'').trim()).map(e => (e.innerText||'').trim().slice(0,80)),
  }));
  log('AFTER:', JSON.stringify(after));
  await page.screenshot({ path: '/tmp/dz-afdian-net.png' });
} catch (e) { log('ERROR:', e.message); }
await ctx.close();
