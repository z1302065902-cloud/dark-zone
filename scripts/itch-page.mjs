import { firefox } from 'playwright';

const PROFILE = '/tmp/dz-itch-profile';
const ctx = await firefox.launchPersistentContext(PROFILE, {
  headless: false,
  viewport: { width: 1440, height: 1000 },
});
const page = ctx.pages()[0] || await ctx.newPage();
const log = (...a) => console.log('[page]', ...a);

try {
  await page.goto('https://zsy2026.itch.io/dark-zone', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  log('URL:', page.url());
  log('TITLE:', await page.title());

  const info = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, .button, a.btn')).map(b => (b.innerText || '').trim()).filter(t => t && t.length < 40).slice(0, 15);
    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => f.src.slice(0, 80));
    const bodyTxt = document.body.innerText.slice(0, 500);
    return { buttons, iframes, bodyTxt: bodyTxt.replace(/\n+/g, ' | ') };
  });
  log('BUTTONS:', JSON.stringify(info.buttons));
  log('IFRAMES:', JSON.stringify(info.iframes));
  log('BODY:', info.bodyTxt.slice(0, 400));

  // check for download/embed section
  const embeds = await page.evaluate(() => {
    const html = document.body.innerHTML;
    const hasPlay = html.includes('run_game') || html.includes('play_button') || html.includes('game_frame');
    const hasUpload = html.includes('uploaded by you') || html.includes('files to upload');
    return { hasPlay, hasUpload };
  });
  log('EMBED:', JSON.stringify(embeds));
  await page.screenshot({ path: '/tmp/dz-itch-page.png' });
} catch (e) {
  log('ERROR:', e.message);
}
await ctx.close();
