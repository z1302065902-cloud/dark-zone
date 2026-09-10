import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
await page.goto('http://localhost:5174/?debug=1', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await new Promise(r => setTimeout(r, 6000));
await page.getByRole('button', { name: /设置/ }).first().click();
await new Promise(r => setTimeout(r, 1000));
// interact via playwright fill-like: set value through native setter then dispatch input
await page.evaluate(() => {
  const el = document.querySelector('input[type=range]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, '0.35');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise(r => setTimeout(r, 600));
const after = await page.evaluate(() => {
  const ls = localStorage.getItem('dark-zone-settings');
  return { ls, inputValue: document.querySelector('input[type=range]').value };
});
console.log('AFTER=' + JSON.stringify(after));
await browser.close();
