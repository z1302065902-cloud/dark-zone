/* Verify: intro overlay (non-debug) + touch controls (hasTouch context) */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- 1. Intro overlay: non-debug URL, first run ---
const page = await browser.newPage();
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await sleep(6000);
await page.getByRole('button', { name: /开始|Start/ }).first().click();
await sleep(2500);
const introVisible = await page.evaluate(() => !!document.querySelector('.intro-overlay'));
console.log('INTRO_VISIBLE=' + introVisible);
await page.evaluate(() => document.querySelector('.intro-overlay')?.querySelector('button')?.click());
await sleep(500);
const introGone = await page.evaluate(() => !document.querySelector('.intro-overlay'));
console.log('INTRO_GONE_AFTER_CLOSE=' + introGone);
const touchShown = await page.evaluate(() => !!document.querySelector('.touch-controls'));
console.log('TOUCH_ON_DESKTOP=' + touchShown);
await page.close();

// --- 2. Touch controls: hasTouch context ---
const tctx = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
const tpage = await tctx.newPage();
await tpage.goto('http://localhost:5174/?debug=1', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await sleep(7000);
await tpage.getByRole('button', { name: /开始|Start/ }).first().click();
await sleep(2500);
const touchVisible = await tpage.evaluate(() => !!document.querySelector('.touch-controls'));
console.log('TOUCH_ON_MOBILE=' + touchVisible);
const btns = await tpage.evaluate(() => document.querySelectorAll('.touch-btn').length);
console.log('TOUCH_BTNS=' + btns);
await tctx.close();

await browser.close();
