// renders ad.html frame by frame into ad.mp4 (or stills with --stills t1,t2,...)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
fs.mkdirSync(out, { recursive: true });
const FPS = 30, DUR = 24;
const exe = process.env.CHROME_PATH || process.env.LOCALAPPDATA + '/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(here, 'ad.html')).href);
await page.evaluate(() => document.fonts.ready);
const grab = async (t) => {
  const b64 = await page.evaluate((t) => { window.render(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);
  return Buffer.from(b64, 'base64');
};
const stillsArg = process.argv.indexOf('--stills');
if (stillsArg > -1) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) fs.writeFileSync(path.join(out, `still_${t}.png`), await grab(t));
} else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-g', '15', '-movflags', '+faststart', path.join(out, 'ad_silent.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < FPS * DUR; i++) {
    const buf = await grab(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
await browser.close();
console.log('done');
