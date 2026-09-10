/* Verify offline ZIP served via localhost launcher = full version (no wall). */
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
await page.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await sleep(9000);
const title = await page.evaluate(() => document.querySelector('.game-title')?.textContent || '');
console.log('LOCAL_TITLE=' + JSON.stringify(title));
await page.getByRole('button', { name: /开始|Start/ }).first().click().catch(() => console.log('LOCAL_START_NOT_FOUND'));
await sleep(5000);
const wall = await page.evaluate(() => !!document.querySelector('.unlock-overlay'));
const canvas = await page.evaluate(() => !!document.querySelector('canvas'));
console.log('LOCAL_WALL=' + wall + ' CANVAS=' + canvas);
await browser.close();
