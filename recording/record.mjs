// Records the real ShotFix web app (built from frontend/) driving a full analysis against synthetic data.
// Deterministic capture: the page runs on a paused virtual clock that advances exactly one frame per capture,
// CSS animations/transitions and video playback are stepped to that clock, and a rendered cursor plus a virtual
// camera (crop + zoom on a 2x capture) are composed per frame. Output: out/master.mp4 (1920x1200, 60 fps).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as D from './mock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const FPS = 60, VW = 1440, VH = 900, DPR = 2, OW = 1920, OH = 1200;
const STILLS = path.join(OUT, 'stills');
fs.mkdirSync(STILLS, { recursive: true });
const LIMIT = Number(process.env.LIMIT_SEC || 0);

// the built app and its media are served from a placeholder origin inside the browser (see page.route below)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };
const ORIGIN = 'https://shotfix.ai/app';

// ---------- browser ----------
const exe = process.env.CHROME_PATH || process.env.LOCALAPPDATA + '/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const browser = await chromium.launch({ executablePath: exe, args: ['--hide-scrollbars', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR, colorScheme: 'light', reducedMotion: 'no-preference', locale: 'en-GB', timezoneId: 'Europe/London' });
const page = await context.newPage();
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('[console]', m.text()));

await page.addInitScript(() => {
  try { localStorage.setItem('vidqa.token', 'demo-token'); } catch {}
  const animStart = new WeakMap();
  const finished = new WeakSet();
  // media: the app asks to play, the recorder advances currentTime one frame at a time
  const P = HTMLMediaElement.prototype;
  Object.defineProperty(P, 'paused', { configurable: true, get() { return !this.__want; } });
  P.play = function () {
    if (!this.__want) { this.__want = true; this.dispatchEvent(new Event('play')); this.dispatchEvent(new Event('playing')); }
    return Promise.resolve();
  };
  P.pause = function () { if (this.__want) { this.__want = false; this.dispatchEvent(new Event('pause')); } };
  // smooth scrolling on the virtual clock (rAF is faked, so this tween advances one frame per capture)
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let tween = null;
  const nativeScrollTo = window.scrollTo.bind(window);
  const tweenTo = (y, ms = 750) => {
    const from = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const to = Math.max(0, Math.min(max, y));
    const id = {};
    tween = id;
    const t0 = performance.now();
    const tick = (now) => {
      if (tween !== id) return;
      const k = Math.min(1, (now - t0) / ms);
      nativeScrollTo(0, from + (to - from) * ease(k));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  window.scrollTo = function (a, b) {
    if (a && typeof a === 'object') { if (a.behavior === 'smooth') return tweenTo(a.top ?? window.scrollY); return nativeScrollTo(0, a.top ?? window.scrollY); }
    return nativeScrollTo(a, b);
  };
  Element.prototype.scrollIntoView = function (o) {
    const r = this.getBoundingClientRect();
    const m = parseFloat(getComputedStyle(this).scrollMarginTop) || 0;
    const block = (o && o.block) || 'start';
    const y = block === 'center' ? window.scrollY + r.top - (innerHeight - r.height) / 2 : window.scrollY + r.top - m;
    if (o && o.behavior === 'smooth') tweenTo(y, 850); else nativeScrollTo(0, y);
  };
  window.__rec = {
    tweenTo,
    sync(now) {
      for (const a of document.getAnimations()) {
        if (finished.has(a)) continue;
        let s = animStart.get(a);
        if (s === undefined) { s = now; animStart.set(a, s); try { a.pause(); } catch {} }
        const ct = now - s;
        const end = a.effect?.getComputedTiming?.().endTime;
        if (Number.isFinite(end) && ct >= end) { try { a.currentTime = end; a.finish(); } catch {} finished.add(a); continue; }
        try { a.currentTime = ct; } catch {}
      }
    },
    async media(dt) {
      const vids = [...document.querySelectorAll('video')].filter((v) => v.__want);
      await Promise.all(vids.map((v) => new Promise((res) => {
        const target = v.currentTime + dt;
        if (v.duration && target >= v.duration - 0.02) { v.__want = false; v.dispatchEvent(new Event('pause')); v.dispatchEvent(new Event('ended')); return res(); }
        v.addEventListener('seeked', res, { once: true });
        v.currentTime = target;
      })));
    },
    cursor(c) {
      let el = document.getElementById('__cursor');
      if (!el) {
        el = document.createElement('div');
        el.id = '__cursor';
        el.innerHTML = '<div id="__ring"></div><svg width="30" height="30" viewBox="0 0 30 30" style="position:absolute;left:-5px;top:-3px;filter:drop-shadow(0 2px 3px rgba(2,6,23,.35))"><path d="M5 3 L5 23.5 L10.2 18.6 L13.9 26.6 L17.5 25.1 L13.9 17.3 L20.9 17.3 Z" fill="#0b1020" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>';
        el.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:0;height:0;';
        document.documentElement.appendChild(el);
        const ring = el.querySelector('#__ring');
        ring.style.cssText = 'position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:2.5px solid rgba(37,99,235,.9);background:rgba(37,99,235,.12);opacity:0;';
      }
      el.style.transform = `translate(${c.x}px,${c.y}px) scale(${c.press ? 0.86 : 1})`;
      el.style.opacity = c.hidden ? '0' : '1';
      const ring = el.querySelector('#__ring');
      if (c.ring != null) { ring.style.opacity = String(1 - c.ring); ring.style.transform = `scale(${0.35 + c.ring * 1.1})`; } else ring.style.opacity = '0';
    },
  };
  const style = () => {
    const s = document.createElement('style');
    s.textContent = 'html{scroll-behavior:auto!important} *{caret-color:#2563eb}';
    document.documentElement.appendChild(s);
  };
  if (document.documentElement) style(); else document.addEventListener('DOMContentLoaded', style);
});

// ---------- synthetic API ----------
let phase = 'dash';
let shared = false;
const report = structuredClone(D.report);
const suggestions = structuredClone(D.suggestions);
let me = structuredClone(D.user);
const ok = (route, data, extra = {}) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'ok', data, ...extra }) });
// the app and its media are served from a placeholder origin, entirely inside the browser, so no localhost URL ever shows on screen
await page.route(ORIGIN + '/**', async (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  let file = u.startsWith('/media/') ? path.join(here, u) : path.join(here, 'app-dist', u);
  if (!u.startsWith('/media/') && (!fs.existsSync(file) || fs.statSync(file).isDirectory())) file = path.join(here, 'app-dist', 'index.html');
  if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
  const type = types[path.extname(file)] || 'application/octet-stream';
  const buf = fs.readFileSync(file);
  const range = /bytes=(\d*)-(\d*)/.exec(route.request().headers().range || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = Math.min(buf.length - 1, range[2] ? Number(range[2]) : buf.length - 1);
    return route.fulfill({ status: 206, headers: { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1) }, body: buf.subarray(start, end + 1) });
  }
  return route.fulfill({ status: 200, headers: { 'Content-Type': type, 'Accept-Ranges': 'bytes' }, body: buf });
});
await page.route('**/upload-sink', (route) => route.fulfill({ status: 200, body: '' }));
await page.route('**/api/v1/**', async (route) => {
  const req = route.request();
  const u = new URL(req.url());
  const p = u.pathname.replace('/api/v1', '');
  const m = req.method();
  const body = req.postDataJSON?.() ?? null;
  if (p === '/auth/me' && m === 'GET') return ok(route, me);
  if (p === '/auth/me' && m === 'PATCH') { me = { ...me, preferences: { ...me.preferences, ...(body?.preferences || {}) } }; return ok(route, me); }
  if (p === '/meta/catalog') return ok(route, D.catalog);
  if (p === '/projects') return ok(route, []);
  if (p === '/videos/stats') return ok(route, D.stats(phase === 'done'));
  if (p === '/videos' && m === 'GET') {
    const items = phase === 'done' ? [D.newVideo('ANALYZED'), ...D.pastVideos] : D.pastVideos;
    return ok(route, items, { pagination: { page: 1, pages: 1, total: items.length, limit: 20 } });
  }
  if (p === '/videos/upload-url') return ok(route, { video: { id: D.VIDEO_ID }, upload: { url: `${ORIGIN}/upload-sink`, method: 'PUT', headers: {} } });
  if (p === `/videos/${D.VIDEO_ID}/complete-upload`) { phase = 'processing'; me = { ...me, credits: 115 }; return ok(route, { video: D.newVideo('PROCESSING'), job: D.job() }); }
  if (p === `/videos/${D.VIDEO_ID}`) return ok(route, D.newVideo(phase === 'done' ? 'ANALYZED' : 'PROCESSING'));
  if (p === `/videos/${D.VIDEO_ID}/playback-url`) return ok(route, { url: `${ORIGIN}/media/daybreak_v3.mp4` });
  if (p === `/videos/${D.VIDEO_ID}/frames`) return ok(route, { sceneCuts: report.scene_cuts, frames: [] });
  if (p === `/analysis/jobs/${D.JOB_ID}`) return ok(route, D.job(phase === 'done' ? 'COMPLETED' : 'PROCESSING'));
  if (p === `/analysis/videos/${D.VIDEO_ID}/jobs`) return ok(route, [D.job(phase === 'done' ? 'COMPLETED' : 'PROCESSING')]);
  if (p === `/analysis/findings/${D.VIDEO_ID}`) return ok(route, { id: 'res_daybreak03', jobId: D.JOB_ID, videoId: D.VIDEO_ID, overallScore: 58, verdict: 'needs_work', report });
  if (p.startsWith(`/analysis/findings/${D.VIDEO_ID}/`) && m === 'PATCH') {
    const f = report.findings.find((x) => x.id === p.split('/').pop());
    if (f) f.review = { status: body.status, by_name: me.name, note: body.note };
    return ok(route, { report });
  }
  if (p === `/suggestions/video/${D.VIDEO_ID}`) return ok(route, suggestions);
  if (p.startsWith('/suggestions/') && m === 'PATCH') {
    const s = suggestions.find((x) => x.id === p.split('/')[2]);
    if (s) s.status = body.status;
    return ok(route, s);
  }
  if (p === `/regeneration/video/${D.VIDEO_ID}`) return ok(route, []);
  if (p === `/export/share/${D.VIDEO_ID}`) {
    shared = true;
    return ok(route, { shareUrl: 'https://app.shotfix.example/api/v1/export/shared/shr_7Qm2xK9p', recipients: body.emails, expiresAt: '2026-11-19T10:00:00.000Z', emailDelivery: 'not_configured' });
  }
  console.warn('[api] unhandled', m, p);
  return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Not found' }) });
});

let ws = null;
await page.routeWebSocket(/\/ws\/status/, (w) => {
  ws = w;
  w.onMessage((msg) => {
    try { const j = JSON.parse(msg); if (j.action === 'SUBSCRIBE') w.send(JSON.stringify({ event: 'SUBSCRIBED', jobId: j.jobId })); } catch {}
  });
});
page.on('filechooser', (fc) => fc.setFiles(path.join(here, 'media', 'daybreak_v3.mp4')));

// ---------- virtual clock, camera, cursor, capture ----------
const T0 = Date.UTC(2026, 10, 12, 10, 0, 0);
await page.clock.install({ time: T0 });
await page.clock.pauseAt(T0 + 500);
await page.goto(`${ORIGIN}/`);
await page.waitForSelector('text=Lo-fi study loop');
await page.evaluate(() => document.fonts.ready);
const cdp = await context.newCDPSession(page);

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${OW}x${OH}`, '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, 'master.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });

const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x) => 1 - Math.pow(1 - x, 4);
const S = {
  f: 0, vt: 500,
  cur: { x: 980, y: 660 }, curTween: null, press: false, ring: null, hidden: false,
  cam: { cx: VW / 2, cy: VH / 2, z: 1 }, camTween: null,
  marks: [],
};
const camRect = () => {
  const w = VW / S.cam.z, h = VH / S.cam.z;
  const x = Math.max(0, Math.min(VW - w, S.cam.cx - w / 2));
  const y = Math.max(0, Math.min(VH - h, S.cam.cy - h / 2));
  return { x, y, w, h };
};
const race = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

async function frame() {
  // tweens for this frame
  if (S.curTween) {
    const tw = S.curTween;
    const k = Math.min(1, (S.f - tw.f0) / tw.n);
    const e = easeIO(k);
    // slight arc so the path reads as a hand, not a ruler
    const nx = -(tw.to.y - tw.from.y), ny = tw.to.x - tw.from.x;
    const len = Math.hypot(nx, ny) || 1;
    const bow = Math.sin(Math.PI * e) * Math.min(60, len * 0.08);
    S.cur = { x: tw.from.x + (tw.to.x - tw.from.x) * e + (nx / len) * bow, y: tw.from.y + (tw.to.y - tw.from.y) * e + (ny / len) * bow };
    await page.mouse.move(S.cur.x, S.cur.y);
    if (k >= 1) S.curTween = null;
  }
  if (S.camTween) {
    const tw = S.camTween;
    const k = Math.min(1, (S.f - tw.f0) / tw.n);
    const e = easeIO(k);
    S.cam = { cx: tw.from.cx + (tw.to.cx - tw.from.cx) * e, cy: tw.from.cy + (tw.to.cy - tw.from.cy) * e, z: Math.exp(Math.log(tw.from.z) + (Math.log(tw.to.z) - Math.log(tw.from.z)) * e) };
    if (k >= 1) S.camTween = null;
  }
  if (S.ring) { S.ring.k = (S.f - S.ring.f0) / (0.45 * FPS); if (S.ring.k >= 1) S.ring = null; }
  const ms = Math.round(((S.f + 1) * 1000) / FPS) - Math.round((S.f * 1000) / FPS);
  await page.clock.runFor(ms);
  S.vt += ms;
  const scroll = await race(page.evaluate(async ({ vt, dt, c }) => { window.__rec.cursor(c); window.__rec.sync(vt); await window.__rec.media(dt); window.__rec.sync(vt); return [window.scrollX, window.scrollY]; }, { vt: S.vt, dt: ms / 1000, c: { ...S.cur, press: S.press, ring: S.ring ? S.ring.k : null, hidden: S.hidden } }), 1500) || await page.evaluate(() => [window.scrollX, window.scrollY]);
  const r = camRect();
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, optimizeForSpeed: true, clip: { x: scroll[0] + r.x, y: scroll[1] + r.y, width: r.w, height: r.h, scale: OW / r.w } });

  const img = sharp(Buffer.from(data, 'base64')).resize(OW, OH, { fit: 'fill' });
  const raw = await img.clone().raw().toBuffer();
  if (S.f % FPS === 0) await img.clone().jpeg({ quality: 80 }).toFile(path.join(STILLS, `t${String(S.f / FPS).padStart(3, '0')}.jpg`));
  if (!ff.stdin.write(raw)) await new Promise((res) => ff.stdin.once('drain', res));
  S.f++;
  if (S.f % (FPS * 5) === 0) console.log(`frame ${S.f} (${(S.f / FPS).toFixed(1)}s)`);
  if (LIMIT && S.f >= LIMIT * FPS) throw new Error('LIMIT');
}
const hold = async (sec) => { const n = Math.round(sec * FPS); for (let i = 0; i < n; i++) await frame(); };
const box = async (target) => {
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  const b = await loc.boundingBox();
  if (!b) throw new Error(`no box for ${target}`);
  return b;
};
const center = async (target, dx = 0, dy = 0) => { const b = await box(target); return { x: b.x + b.width / 2 + dx, y: b.y + b.height / 2 + dy }; };
// cursor move to a target (selector, locator or point) over sec; resolves when it arrives
async function moveTo(target, sec = 0.7, off = {}) {
  const to = target.x != null ? target : await center(target, off.dx || 0, off.dy || 0);
  S.curTween = { from: { ...S.cur }, to, f0: S.f, n: Math.max(1, Math.round(sec * FPS)) };
  await hold(sec);
}
async function click(opts = {}) {
  S.press = true;
  await page.mouse.down();
  await hold(0.06);
  S.ring = { f0: S.f, k: 0 };
  await page.mouse.up(opts);
  S.press = false;
  await hold(opts.after ?? 0.12);
}
// camera: focus a region (selector or rect) at a zoom over sec; runs alongside whatever comes next
async function camera(target, z, sec = 0.9, off = {}) {
  let cx = VW / 2, cy = VH / 2;
  if (target) { const c = target.x != null && target.width == null ? target : await center(target); cx = c.x + (off.dx || 0); cy = c.y + (off.dy || 0); }
  S.camTween = { from: { ...S.cam }, to: { cx, cy, z }, f0: S.f, n: Math.max(1, Math.round(sec * FPS)) };
}
async function type(text, cps = 24) {
  const gap = Math.max(1, Math.round(FPS / cps));
  for (const ch of text) {
    if (ch === '\n') await page.keyboard.press('Enter'); else await page.keyboard.insertText(ch);
    for (let i = 0; i < gap; i++) await frame();
  }
}
const send = (o) => ws?.send(JSON.stringify({ event: 'JOB_UPDATE', jobId: D.JOB_ID, status: 'PROCESSING', timestamp: new Date(T0 + S.vt).toISOString(), ...o }));
async function scrollBy(dy, sec = 0.8) { await page.evaluate(({ y, ms }) => window.__rec.tweenTo(window.scrollY + y, ms), { y: dy, ms: sec * 1000 }); }
async function scrollToY(y, sec = 0.8) { await page.evaluate(({ y, ms }) => window.__rec.tweenTo(y, ms), { y, ms: sec * 1000 }); }

// ---------- storyboard ----------
try {
  // A. analyses list: counters roll, then New analysis
  await hold(1.3);
  await moveTo('a:has-text("New analysis") >> nth=1', 0.9);
  await hold(0.15);
  await click({ after: 0.3 });

  // B. the brief
  await page.waitForSelector('text=Drop a video here');
  await camera({ x: 520, y: 330 }, 1.32, 1.0);
  await moveTo('text=Drop a video here', 0.8);
  await click({ after: 0.1 });
  await page.waitForSelector('main video');
  await page.evaluate(() => new Promise((r) => { const v = document.querySelector('main video'); const go = () => { v.currentTime = 5; v.addEventListener('seeked', r, { once: true }); }; if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true }); }));
  await hold(0.7);
  await camera({ x: 520, y: 640 }, 1.32, 0.9);
  await moveTo('#title', 0.6, { dx: 60 });
  await click();
  await page.keyboard.press('Control+A');
  await type(D.brief.title, 30);
  await moveTo('#desc', 0.45, { dx: 40 });
  await click();
  await type('Summer launch spot for Daybreak, a yuzu sparkling soda.', 40);
  await moveTo('#intent', 0.45, { dx: 40 });
  await click();
  await type(D.brief.goal, 36);
  await camera({ x: 520, y: 760 }, 1.32, 0.6);
  await moveTo('#aud', 0.45, { dx: 40 });
  await click();
  await type(D.brief.audience, 34);
  await hold(0.2);

  // platforms, guardrails and reference notes on the right
  await camera({ x: 1010, y: 250 }, 1.32, 1.0);
  for (const name of ['Instagram Reels', 'TikTok', 'YouTube 16:9']) {
    await moveTo(page.getByRole('button', { name: new RegExp(`^${name}`) }), 0.42);
    await click({ after: 0.08 });
  }
  await camera({ x: 1010, y: 470 }, 1.32, 0.9);
  await moveTo('#ind', 0.5);
  await click({ after: 0.05 });
  await page.selectOption('#ind', 'health_wellness');
  await hold(0.25);
  await moveTo('#brand', 0.4, { dx: 30 });
  await click();
  await type(D.brief.brand, 22);
  await moveTo('#cta', 0.45, { dx: 30 });
  await click();
  await type(D.brief.cta, 34);
  await moveTo('#ref', 0.45, { dx: 60, dy: -10 });
  await click();
  await type('Can is coral pink (#FF6F61), sunrise logo to camera in every shot.\nNo health claims.', 46);
  await hold(0.2);

  // mode and go: bring the mode picker and the submit row into view
  const sub = await box(page.getByRole('button', { name: /Fast analysis/ }));
  await scrollBy(sub.y + sub.height - 820, 1.0);
  await hold(1.05);
  await camera(await center('label:has-text("Detailed")'), 1.32, 0.9, { dx: 120, dy: 40 });
  await moveTo('label:has-text("Detailed")', 0.6, { dx: -40 });
  await click({ after: 0.5 });
  await moveTo(page.getByRole('button', { name: /Detailed analysis/ }), 0.6);
  await hold(0.15);
  await click({ after: 0.05 });

  // C. the live signal chain
  await page.waitForSelector('text=Signal chain', { timeout: 15000 });
  await camera(null, 1, 0.8);
  S.curTween = { from: { ...S.cur }, to: { x: 1350, y: 860 }, f0: S.f, n: 40 };
  await hold(0.6);
  await camera({ x: 845, y: 515 }, 1.2, 1.4);
  const steps = [
    [0.0, { progress: 4, currentStep: 'Reading the video: 24.0s, 1920×1080, 30 fps' }],
    [0.1, { stage: 'preprocessing', stageStatus: 'RUNNING' }],
    [0.6, { progress: 9, currentStep: 'Sampled 72 frames across 5 shots, extracted the audio track' }],
    [0.9, { stage: 'preprocessing', stageStatus: 'COMPLETED', progress: 14 }],
    [1.0, { stage: 'speechToText', stageStatus: 'RUNNING' }],
    [1.05, { stage: 'videoAnalysis', stageStatus: 'RUNNING' }],
    [1.1, { stage: 'audioAnalysis', stageStatus: 'RUNNING' }],
    [1.15, { stage: 'textAnalysis', stageStatus: 'RUNNING' }],
    [1.2, { stage: 'aiSlopDetector', stageStatus: 'RUNNING' }],
    [1.3, { progress: 18, currentStep: 'Speech to text and five reviewers running in parallel' }],
    [2.1, { stage: 'speechToText', stageStatus: 'COMPLETED', progress: 26 }],
    [2.2, { currentStep: 'Transcribed 7 lines (en), pinned to the audio' }],
    [2.7, { stage: 'audioAnalysis', stageStatus: 'COMPLETED', progress: 32 }],
    [3.0, { stage: 'consistencyEngine', stageStatus: 'RUNNING' }],
    [3.1, { currentStep: 'Consistency: checking the can against the reference notes' }],
    [3.3, { stage: 'textAnalysis', stageStatus: 'COMPLETED', progress: 38 }],
    [3.8, { stage: 'videoAnalysis', stageStatus: 'COMPLETED', progress: 46 }],
    [3.9, { stage: 'viralPotential', stageStatus: 'RUNNING' }],
    [4.3, { stage: 'aiSlopDetector', stageStatus: 'COMPLETED', progress: 52 }],
    [4.4, { stage: 'industryGuardrails', stageStatus: 'RUNNING' }],
    [4.5, { currentStep: 'Guardrails: Health & wellness rules, claims register' }],
    [5.2, { stage: 'consistencyEngine', stageStatus: 'COMPLETED', progress: 60 }],
    [5.6, { stage: 'viralPotential', stageStatus: 'COMPLETED', progress: 66 }],
    [6.0, { stage: 'industryGuardrails', stageStatus: 'COMPLETED', progress: 72 }],
    [6.1, { stage: 'scoring', stageStatus: 'RUNNING' }],
    [6.3, { stage: 'scoring', stageStatus: 'COMPLETED', progress: 78, currentStep: 'Scored 58/100 · needs work · 11 findings' }],
    [6.4, { stage: 'suggestions', stageStatus: 'RUNNING' }],
    [6.45, { stage: 'evidence', stageStatus: 'RUNNING' }],
    [7.1, { stage: 'suggestions', stageStatus: 'COMPLETED', progress: 88 }],
    [7.6, { currentStep: 'Circled the issue on 9 of 9 evidence frames' }],
    [7.8, { stage: 'evidence', stageStatus: 'COMPLETED', progress: 96 }],
  ];
  const tStart = S.f;
  for (const [t, ev] of steps) {
    while ((S.f - tStart) / FPS < t) await frame();
    send(ev);
  }
  await hold(0.5);
  phase = 'done';
  send({ status: 'COMPLETED', progress: 100, currentStep: 'Analysis completed' });

  // D. the report
  await page.waitForSelector('text=Category scores', { timeout: 15000 });
  await camera(null, 1, 0.5);
  await page.evaluate(() => new Promise((r) => { const v = document.querySelector('main video'); if (!v) return r(); const go = () => { v.currentTime = 5; v.addEventListener('seeked', r, { once: true }); }; if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once: true }); }));
  S.curTween = { from: { ...S.cur }, to: { x: 1380, y: 640 }, f0: S.f, n: 30 };
  await hold(0.9);
  await camera('section[aria-label="Report summary"] >> nth=0', 1.0, 0.1);
  await camera({ x: 390, y: 330 }, 1.75, 1.2);
  await hold(2.2);
  await camera({ x: 640, y: 330 }, 1.55, 1.2);
  await moveTo('button[aria-label^="Consistency"]', 0.9, { dx: -40 });
  await hold(1.4);
  await camera({ x: 720, y: 560 }, 1.3, 1.0);
  await moveTo(page.getByRole('button', { name: /Critical findings/ }), 0.8);
  await hold(1.1);
  await click({ after: 0.2 });
  await hold(1.0);

  // E. a finding, proven on the frame
  await camera(null, 1, 0.9);
  await hold(0.4);
  const issueFig = page.locator('#finding-f_001 figure').nth(1);
  await camera(await center('#finding-f_001'), 1.42, 1.0, { dx: 60 });
  await moveTo(issueFig, 0.8);
  await hold(0.9);
  await moveTo(issueFig.getByRole('button', { name: 'Open image' }), 0.35);
  await click({ after: 0.1 });
  await camera(null, 1, 0.6);
  await hold(1.8);
  await page.keyboard.press('ArrowLeft');
  await hold(1.8);
  await page.keyboard.press('ArrowRight');
  await hold(1.4);
  await moveTo(page.getByRole('button', { name: /Play video from/ }), 0.7);
  await click({ after: 0.2 });
  await hold(1.2);
  // the floating preview plays the moment
  const dock = await box('.anim-dock');
  await camera({ x: dock.x + dock.width / 2 - 120, y: dock.y + dock.height / 2 - 60 }, 1.5, 1.0);
  await moveTo({ x: dock.x + dock.width * 0.5, y: dock.y + dock.height * 0.45 }, 0.9);
  await hold(1.8);
  await camera(null, 1, 0.9);

  // F. suggestions: approve the rewrite
  await moveTo(page.getByRole('tab', { name: /Suggestions/ }), 0.8);
  await click({ after: 0.3 });
  await page.waitForSelector('text=Replace the health claim');
  const sugItem = page.locator('li:has-text("Replace the health claim")').first();
  const sb = await box(sugItem);
  if (sb.y > VH - 260) { await scrollBy(sb.y - 360, 0.8); await hold(0.85); }
  await camera(await center(sugItem), 1.5, 1.0, { dx: 120 });
  await moveTo(sugItem.getByRole('button', { name: 'Approve' }), 0.9);
  await hold(0.3);
  await click({ after: 1.0 });

  // G. share a read-only link
  await camera(null, 1, 0.9);
  const closeFloat = page.getByRole('button', { name: 'Close the floating preview' });
  if (await closeFloat.count()) { await moveTo(closeFloat, 0.7); await click({ after: 0.3 }); }
  await scrollToY(0, 0.9);
  await hold(1.0);
  await moveTo(page.getByRole('button', { name: /^Share$/ }), 0.8);
  await click({ after: 0.45 });
  await camera({ x: VW / 2, y: VH / 2 }, 1.45, 0.9);
  await moveTo('#sh-emails', 0.6);
  await click();
  await type('maya@daybreak.example', 26);
  await hold(0.2);
  await moveTo(page.getByRole('button', { name: 'Create link' }), 0.6);
  await click({ after: 0.3 });
  await page.waitForSelector('text=Read-only link created');
  await camera({ x: VW / 2, y: VH / 2 }, 1.6, 1.0);
  await hold(2.6);
  await camera(null, 1, 1.0);
  await hold(1.2);
} catch (e) {
  if (e.message !== 'LIMIT') { console.error('storyboard failed at', (S.f / FPS).toFixed(2), 's:', e.message); await page.screenshot({ path: path.join(OUT, 'fail.png') }); }
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`done: ${S.f} frames, ${(S.f / FPS).toFixed(1)}s`);
