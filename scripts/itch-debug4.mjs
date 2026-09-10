import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const resp = await page.goto('https://html-classic.itch.zone/html/19177149-1965172/index.html?debug=1', { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => null);
console.log('HTTP=' + (resp ? resp.status() : 'ERR'));
const html = await page.evaluate(() => document.documentElement.outerHTML.slice(0, 500));
console.log('HTML_HEAD=' + JSON.stringify(html));
await browser.close();
