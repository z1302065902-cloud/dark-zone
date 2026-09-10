import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const [label, url] of [['CANDY', 'https://afdian.com/item/6f3448f4ab8f11f1b5665254001e7c00'], ['DARKZONE', 'https://afdian.com/item/170b3b9caced11f197865254001e7c00']]) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  const t = await page.evaluate(() => document.body.innerText);
  console.log('=====', label, '=====');
  console.log(t.replace(/\n+/g, ' | ').slice(0, 500));
  await page.close();
}
await browser.close();
