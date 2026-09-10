import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://afdian.com/item/170b3b9caced11f197865254001e7c00', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const t = document.body.innerText;
  return {
    url: location.href,
    title: document.title,
    hasName: t.includes('DARK ZONE'),
    hasPrice: /¥|￥|\b7\.00\b/.test(t),
    priceCtx: (t.match(/[^\n]{0,40}7\.00[^\n]{0,40}/) || [null])[0],
    hasDesc: t.includes('钥匙卡') || t.includes('keycard') || t.includes('恐怖潜行'),
    hasBuy: /支持|赞助|购买|Buy|Support/i.test(t),
    head: t.slice(0, 350).replace(/\n+/g, ' | ')
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: '/tmp/dz-afdian-public.png' });
await browser.close();
