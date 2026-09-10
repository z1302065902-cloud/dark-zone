/* Probe itch.io edit page uploads section (Firefox + logged-in profile). */
import { firefox } from 'playwright';
const PROFILE = '/tmp/dz-itch-profile';
const FF = '/Users/zsy/Library/Caches/ms-playwright/firefox-1542/firefox/Nightly.app/Contents/MacOS/firefox';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  executablePath: FF, headless: true, viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
try {
  await page.goto('https://itch.io/game/edit/4993039', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const fileInputs = Array.from(document.querySelectorAll('input[type=file]')).map(f => ({
      name: f.name || '', cls: (f.className || '').slice(0, 30),
      parent: (f.closest('div')?.innerText || '').replace(/\s+/g, ' ').slice(0, 80),
    }));
    const uploadRows = Array.from(document.querySelectorAll('.upload_row')).map(el => ({
      text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 140),
    }));
    const links = Array.from(document.querySelectorAll('a')).map(a => ({ t: (a.innerText || '').slice(0, 30), h: a.href || '' }))
      .filter(x => /upload|file|manage/i.test(x.t + x.h)).slice(0, 8);
    return { fileInputs, uploadRows, links, url: location.href, loggedIn: !!(document.querySelector('.avatar') || document.cookie.includes('itchio_token')) };
  });
  console.log('INFO=' + JSON.stringify(info, null, 1).slice(0, 1500));
} catch (e) {
  console.log('ERR=' + (e.message || '').slice(0, 300));
}
await ctx.close();
