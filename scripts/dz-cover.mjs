import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5174/?debug=1', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(9000); // let game render
// ensure not in menu - if menu, start game
const menu = await page.evaluate(() => !!document.querySelector('[class*=menu],[class*=Menu]'));
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/dz-cover.png' });
await browser.close();
console.log('cover saved');
