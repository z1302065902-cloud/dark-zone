/* Generate screenshot pack for store listings (1920x1080). */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

mkdirSync('/Users/zsy/dark-zone/screenshots', { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

// 1. Main menu (no debug — clean title screen)
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await sleep(7000);
await page.screenshot({ path: '/Users/zsy/dark-zone/screenshots/01-menu.png' });
console.log('shot 01-menu');

// Game scenes via debug bridge
await page.goto('http://localhost:5174/?debug=1', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await sleep(7000);
await page.getByRole('button', { name: /开始|Start/ }).first().click();
await sleep(5000);

const tp = (x, y, z, ay) => page.evaluate(({ x, y, z, ay }) => {
  window.__dz.camera.position.set(x, y, z);
  window.__dz.camera.rotation.set(0, ay, 0);
  window.__dz.getState().setPlayerPosition({ x, y, z });
  window.__dz.rotationOverride = { x: 0, y: ay, z: 0 };
}, { x, y, z, ay: ay || 0 });

// 2. Lobby — reception desk + neon
await tp(0, 1.8, 4, 0); await sleep(2500);
await page.screenshot({ path: '/Users/zsy/dark-zone/screenshots/02-lobby.png' });
console.log('shot 02-lobby');

// 3. Emergency corridor
await tp(-8, 1.8, -14, Math.PI / 2); await sleep(2500);
await page.screenshot({ path: '/Users/zsy/dark-zone/screenshots/03-emergency.png' });
console.log('shot 03-emergency');

// 4. FuseBox / power junction
await tp(-18, 1.8, -20.5, -Math.PI / 2); await sleep(2500);
await page.screenshot({ path: '/Users/zsy/dark-zone/screenshots/04-fusebox.png' });
console.log('shot 04-fusebox');

// 5. Surgery room
await tp(0, 1.8, 10, 0); await sleep(2500);
await page.screenshot({ path: '/Users/zsy/dark-zone/screenshots/05-surgery.png' });
console.log('shot 05-surgery');

// 6. Underground lab (boss arena)
await tp(12, 1.8, 10, -Math.PI / 2); await sleep(2500);
await page.screenshot({ path: '/Users/zsy/dark-zone/screenshots/06-lab.png' });
console.log('shot 06-lab');

await browser.close();
