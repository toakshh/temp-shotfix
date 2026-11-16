import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || process.env.LOCALAPPDATA + '/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(pathToFileURL(path.join(here, 'ad.html')).href);
await p.evaluate(() => document.fonts.ready);
const b64 = await p.evaluate(() => {
  const ctx = document.getElementById('c').getContext('2d');
  const orig = ctx.setTransform.bind(ctx);
  let first = true;
  // zoom 4x on the can label in shot 4: the first reset applies the zoom, later resets restore it
  ctx.setTransform = (...a) => { orig(...a); if (first || a.join() === '1,0,0,1,0,0') { ctx.translate(960, 540); ctx.scale(4, 4); ctx.translate(-953, -652); } first = false; };
  window.render(15.6);
  return document.getElementById('c').toDataURL('image/png').split(',')[1];
});
fs.writeFileSync(path.join(here, 'out', 'garble_zoom.png'), Buffer.from(b64, 'base64'));
await b.close();
