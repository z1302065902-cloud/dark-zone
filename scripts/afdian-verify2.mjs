import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://afdian.com/item/170b3b9caced11f197865254001e7c00', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
// scroll to trigger lazy render
await page.mouse.wheel(0, 1200);
await page.waitForTimeout(3000);
await page.mouse.wheel(0, 2000);
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const t = document.body.innerText;
  return {
    title: document.title,
    hasDARKZONE: t.includes('DARK ZONE'),
    hasSku: t.includes('完整版'),
    hasFreeLinks: /github\.io|itch\.io/.test(t),
    hasDescText: /恐怖潜行|钥匙卡|keycard/.test(t),
    hasSponsor: /Sponsor|赞助|Support/.test(t),
    price: (t.match(/¥\s*7|7\.00/) || [null])[0],
    full: t.replace(/\n+/g, ' | ').slice(0, 700)
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
