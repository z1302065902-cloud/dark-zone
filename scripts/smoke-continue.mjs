/* Verify: save point persist → main menu shows Continue → resume keeps progress */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const sleep = ms => new Promise(r => setTimeout(r, ms));

await page.goto('http://localhost:5174/?debug=1', { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
await sleep(6000);

// Menu should NOT show Continue with cleared storage
const contBefore = await page.getByRole('button', { name: /继续|Continue/ }).count();
console.log('CONTINUE_BEFORE_PLAY=' + contBefore);

// Start, pick up keycard (objective 1) — persist writes automatically
await page.getByRole('button', { name: /开始|Start/ }).first().click();
await sleep(4000);
const tp = (x, y, z, ay) => page.evaluate(({ x, y, z, ay }) => {
  window.__dz.camera.position.set(x, y, z);
  window.__dz.camera.rotation.set(0, ay, 0);
  window.__dz.getState().setPlayerPosition({ x, y, z });
  window.__dz.rotationOverride = { x: 0, y: ay, z: 0 };
}, { x, y, z, ay: ay || 0 });
await tp(-3, 1.6, -2); await sleep(1200); await page.keyboard.press('KeyE'); await sleep(800);
const objsInGame = await page.evaluate(() => window.__dz.getState().completedObjectives);
console.log('OBJS_AFTER_KEYCARD=' + JSON.stringify(objsInGame));

// Back to main menu (via Escape → paused → ? no menu button; use store)
await page.evaluate(() => window.__dz.getState().setGameState('menu'));
await sleep(1500);
const contAfter = await page.getByRole('button', { name: /继续|Continue/ }).count();
console.log('CONTINUE_AFTER_PROGRESS=' + contAfter);

// Resume
await page.getByRole('button', { name: /继续|Continue/ }).first().click();
await sleep(4000);
const objsResumed = await page.evaluate(() => window.__dz.getState().completedObjectives);
console.log('OBJS_AFTER_RESUME=' + JSON.stringify(objsResumed));
const gameState = await page.evaluate(() => window.__dz.getState().gameState);
console.log('STATE_AFTER_RESUME=' + gameState);

await browser.close();
