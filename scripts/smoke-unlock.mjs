/* Unlock wall verification: demo mode (no ?debug) gates after restore_power.
   Full E2E already covers ?debug=1 (full chain, no wall). */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Demo URL — no debug flag
await page.goto('http://localhost:5174/?demo=1', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await sleep(6000);
await page.getByRole('button', { name: /开始|Start/ }).first().click();
await sleep(4000); // skip intro overlay
await page.evaluate(() => document.querySelector('.intro-overlay')?.querySelector('button')?.click());
await sleep(1000);

const tp = (x, y, z, ay) => page.evaluate(({ x, y, z, ay }) => {
  window.__dz.camera.position.set(x, y, z);
  window.__dz.camera.rotation.set(0, ay, 0);
  window.__dz.getState().setPlayerPosition({ x, y, z });
  window.__dz.rotationOverride = { x: 0, y: ay, z: 0 };
}, { x, y, z, ay: ay || 0 });
const pressE = () => page.keyboard.press('KeyE');

// keycard
await tp(-3, 1.6, -2); await sleep(1200); await pressE(); await sleep(800);
// emergency door
await tp(0, 1.6, -13, Math.PI); await sleep(1200); await pressE(); await sleep(1200);
// fuse
await tp(-5, 1.6, -18); await sleep(1200); await pressE(); await sleep(800);
// fusebox → restore_power
await tp(-18, 1.6, -20.5, -Math.PI / 2); await sleep(1200); await pressE(); await sleep(2000);

const wallUp = await page.evaluate(() => !!document.querySelector('.unlock-overlay'));
console.log('WALL_AFTER_RESTORE=' + wallUp);

// invalid code
await page.evaluate(() => {
  const input = document.querySelector('.unlock-input');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'DZ-XXXX-XXXX-XXXX');
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(300);
await page.getByRole('button', { name: /解锁/ }).click();
await sleep(400);
const badMsg = await page.evaluate(() => document.querySelector('.unlock-msg')?.textContent || '');
console.log('BAD_CODE_MSG=' + JSON.stringify(badMsg));

// valid code DZ-8K2P-9QXW-4M7C
await page.evaluate(() => {
  const input = document.querySelector('.unlock-input');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'DZ-8K2P-9QXW-4M7C');
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(300);
await page.getByRole('button', { name: /解锁/ }).click();
await sleep(800);
const wallGone = await page.evaluate(() => !document.querySelector('.unlock-overlay'));
const licStored = await page.evaluate(() => !!localStorage.getItem('dz_license'));
console.log('WALL_GONE_AFTER_VALID=' + wallGone + ' LIC_STORED=' + licStored);

// reload → license persists → no wall on next entry
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await sleep(6000);
await page.getByRole('button', { name: /开始|Start/ }).first().click();
await sleep(3000);
const noWallOnReload = await page.evaluate(() => !document.querySelector('.unlock-overlay'));
console.log('NO_WALL_AFTER_RELOAD_LICENSED=' + noWallOnReload);

await browser.close();
