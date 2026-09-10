/* DARK ZONE full-chain regression (sync fireWeapon):
   keycard→unlock_emergency→find_fuse→insert_fuse→restore_power→master_key→enter_lab→defeat_boss→escape_hospital→levelcomplete
   Usage: node scripts/e2e-chain.mjs [baseUrl]   (default http://localhost:5174/?debug=1)
*/
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5174/?debug=1';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader'] });
const page = await browser.newPage();
const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + (e.message || '').slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push('CONSOLE: ' + m.text().slice(0, 150)); });

const tp = (x, y, z, ay) => page.evaluate(({ x, y, z, ay }) => {
  window.__dz.camera.position.set(x, y, z);
  window.__dz.camera.rotation.set(0, ay, 0);
  window.__dz.getState().setPlayerPosition({ x, y, z });
  window.__dz.rotationOverride = { x: 0, y: ay, z: 0 };
}, { x, y, z, ay: ay || 0 });
const pressE = () => page.keyboard.press('KeyE');
const objs = () => page.evaluate(() => window.__dz.getState().completedObjectives);

await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await sleep(10000);
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始') || x.textContent.includes('Start')); b && b.click(); });
await sleep(8000);

// 1. keycard
await tp(-3, 1.6, -2); await sleep(1200); await pressE(); await sleep(800);
console.log('1_KEYCARD=' + JSON.stringify(await objs()));

// 2. emergency door
await tp(0, 1.6, -13, Math.PI); await sleep(1200); await pressE(); await sleep(1200);
console.log('2_EMERGENCY=' + JSON.stringify(await objs()));

// 3. fuse
await tp(-5, 1.6, -18); await sleep(1200); await pressE(); await sleep(800);
console.log('3_FUSE=' + JSON.stringify(await objs()));

// 4. fusebox (insert_fuse + restore_power)
await tp(-18, 1.6, -20.5, -Math.PI / 2); await sleep(1200); await pressE(); await sleep(2000);
console.log('4_FUSEBOX=' + JSON.stringify(await objs()));

// 5. master key
await tp(0, 1.6, 13); await sleep(1200); await pressE(); await sleep(800);
console.log('5_MASTERKEY=' + JSON.stringify(await objs()));

// 6. lab door
await tp(5, 1.6, 18); await sleep(1200); await pressE(); await sleep(800);
await tp(12, 1.6, 10.3, -Math.PI / 2); await sleep(600); await pressE(); await sleep(1200);
console.log('6_LAB=' + JSON.stringify(await objs()));

// 7. Boss fight — aim-track + sync fireWeapon
await tp(19, 1.6, 8); await sleep(800);
const t0 = Date.now();
let killed = false;
while (Date.now() - t0 < 60000) {
  const res = await page.evaluate(() => {
    const st = window.__dz.getState();
    const boss = (window.__dzEnemies || []).find(e => e.boss);
    const cam = window.__dz.camera;
    let rotY = -Math.PI / 2;
    if (boss && boss.position) {
      const b = boss.position();
      const dx = b.x - cam.position.x, dz = b.z - cam.position.z;
      if (Math.hypot(dx, dz) > 0.3) rotY = Math.atan2(-dx, -dz);
    }
    window.__dz.rotationOverride = { x: 0, y: rotY, z: 0 };
    window.__dz.camera.rotation.set(0, rotY, 0);
    window.__dz.fireWeapon();
    return { bossHP: st.bossHealth, killed: st.completedObjectives.includes('defeat_boss'), hp: st.health };
  });
  if (res.killed) { killed = true; break; }
  // Production builds run RAF, so the boss actually attacks — keep HP topped up
  await page.evaluate(() => window.__dz.getState().heal(100));
  await sleep(900); // fireRate 0.8s
}
console.log('7_BOSS_KILLED=' + killed);

// 8. escape → levelcomplete
await tp(20, 1.6, 22); await sleep(1500);
await tp(20, 1.6, 22); await sleep(1500);
const fin = await page.evaluate(() => { const st = window.__dz.getState(); return { gs: st.gameState, objs: st.completedObjectives }; });
console.log('FINAL=' + JSON.stringify(fin));
const realErrs = consoleErrors.filter(e => !e.includes('AudioContext'));
console.log('REAL_ERRORS=' + JSON.stringify(realErrs.slice(0, 5)));
const all = ['find_keycard', 'unlock_emergency', 'find_fuse', 'insert_fuse', 'restore_power', 'find_master_key', 'enter_lab', 'defeat_boss', 'escape_hospital'];
const missing = all.filter(o => !fin.objs.includes(o));
console.log('MISSING=' + JSON.stringify(missing));
console.log('RESULT=' + ((fin.gs === 'levelcomplete' && missing.length === 0 && realErrs.length === 0) ? 'PASS' : 'FAIL'));
await browser.close();
