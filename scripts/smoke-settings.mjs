/* Settings smoke test: volume slider, sensitivity slider, lang toggle, persistence */
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5174/?debug=1';
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.message || '').slice(0, 200)));

await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await sleep(6000);

// Open settings from main menu
const settingsBtn = page.getByRole('button', { name: /设置|Settings/ }).first();
if (await settingsBtn.count()) { await settingsBtn.click(); await sleep(800); } else { console.log('SETTINGS_BTN=MISSING'); }

// Volume slider
const vol = await page.$('input[type=range]');
if (vol) { await vol.evaluate((el) => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '0.35');
  el.dispatchEvent(new Event('input', { bubbles: true }));
}); await sleep(500); }
const volNow = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('dark-zone-settings') || '{}');
  return s?.state?.masterVolume;
});
console.log('VOLUME_PERSISTED=' + volNow);

// Sensitivity = 2nd slider
const sliders = await page.$$('input[type=range]');
if (sliders[1]) { await sliders[1].evaluate((el) => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '1.7');
  el.dispatchEvent(new Event('input', { bubbles: true }));
}); await sleep(500); }
const sensNow = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('dark-zone-settings') || '{}');
  return s?.state?.sensitivity;
});
console.log('SENS_PERSISTED=' + sensNow);

// Lang toggle → English, verify persists
const langBtn = page.getByRole('button', { name: /语言|Language/ }).first();
if (await langBtn.count()) { await langBtn.click(); await sleep(500); }
const langNow = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('dark-zone-settings') || '{}');
  return s?.state?.lang;
});
console.log('LANG_PERSISTED=' + langNow);

// Reload → settings restore from storage
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await sleep(6000);
const restored = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('dark-zone-settings') || '{}');
  return s?.state;
});
console.log('RESTORED=' + JSON.stringify(restored));
console.log('ERRORS=' + JSON.stringify(errors));

await browser.close();
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
