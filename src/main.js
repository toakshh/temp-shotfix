import './styles.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createCyc } from './cyc.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
const mqDark = matchMedia('(prefers-color-scheme: dark)');
const reduced = mqReduced.matches;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const fmtMMSS = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- sample report (synthetic, the same data the recording shows) ----------
const CATEGORIES = [
  { id: 'consistency', label: 'Consistency', weight: 0.15, score: 41 },
  { id: 'visual', label: 'Visual quality', weight: 0.2, score: 66 },
  { id: 'engagement', label: 'Emotion and engagement', weight: 0.15, score: 74 },
  { id: 'script', label: 'Script and content', weight: 0.15, score: 71 },
  { id: 'viral', label: 'Viral potential', weight: 0.25, score: 52 },
  { id: 'compliance', label: 'Compliance', weight: 0.1, score: 38 },
];
const FINDINGS = [
  { t: 0, end: 3.2, sev: 'major', title: 'The product only reads at 2.8s' },
  { t: 4.4, end: 5.6, sev: 'minor', title: 'Light sweep clips to white on the can' },
  { t: 8.0, end: 12.5, sev: 'critical', title: 'The can turns from coral to orange' },
  { t: 14.8, end: 17.3, sev: 'critical', title: '“Clinically proven focus” is an unsupported claim' },
  { t: 14.8, end: 17.5, sev: 'major', title: 'Garbled lettering on the can label' },
  { t: 17.5, end: 18.1, sev: 'major', title: 'Black frames for 0.6s' },
  { t: 22.6, end: 24, sev: 'minor', title: 'Call to action on screen for 1.4s' },
];
const WHOLE = [
  { sev: 'major', title: '16:9 on TikTok and Reels' },
  { sev: 'minor', title: 'Mix 4.8 LU over target' },
];
const SEV = { critical: { label: 'Critical', icon: 'octagon', c: 'var(--crit)' }, major: { label: 'Major', icon: 'warn', c: 'var(--major)' }, minor: { label: 'Minor', icon: 'circle', c: 'var(--minor)' } };
// filled in from the recording's storyboard (seconds)
const CHAPTERS = [0, 22.3, 31.7, 39.3, 53.4, 58.0];
const AD_LEN = 24;

// ---------- the light ----------
const cyc = createCyc($('#cyc'), { reduced });
const phaseOf = (el) => Number((mqDark.matches && el.dataset.phaseDark) || el.dataset.phase || 0);
const inkOf = (el) => (mqDark.matches && el.dataset.inkDark) || el.dataset.ink || 'light';

// ---------- smooth scroll ----------
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.documentElement.classList.add('js-motion');
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const el = id.length > 1 && $(id);
  if (!el) return;
  e.preventDefault();
  if (id === '#film') return goFilm();
  scrollToY(id === '#top' ? 0 : el.getBoundingClientRect().top + scrollY - (id === '#access' ? 40 : 0));
}));

// ---------- nav ink, cues, desk ----------
const nav = $('#nav');
const desk = $('#desk');
const deskLinks = $$('.desk__list a');
const CUES = deskLinks.map((a) => [a.querySelector('b').textContent, a.querySelector('span').textContent]);
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => nav.classList.toggle('is-solid', s.scroll() > 24) });
const sections = $$('main > section');
sections.forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 64px', end: 'bottom 64px',
    onToggle: (s) => {
      if (!s.isActive) return;
      document.body.dataset.ink = inkOf(sec);
      const cue = Number(sec.dataset.cue || 0);
      $('#deskCue').textContent = CUES[cue][0];
      $('#deskName').textContent = CUES[cue][1];
      deskLinks.forEach((a, i) => a.setAttribute('aria-current', String(i === cue)));
    },
  });
  if (sec.id !== 'top' && sec.id !== 'verdict') {
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && cyc.set(phaseOf(sec), 1.1) });
  }
});
ScrollTrigger.create({ trigger: '#how', start: 'top 70%', endTrigger: 'main', end: 'bottom bottom', onToggle: (s) => desk.classList.toggle('is-on', s.isActive) });
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { $('#deskLevel').style.left = `${(s.progress * 100).toFixed(2)}%`; } });

// ---------- intro: house lights to blackout, then the stage comes up ----------
const hero = $('.hero');
const heroLoop = $('#heroLoop');
const monitor = $('#monitor');
cyc.jump(phaseOf($('#top')));
if (reduced) {
  cyc.dim(1);
  heroLoop.removeAttribute('autoplay');
  heroLoop.pause();
} else {
  const dim = { v: 0 };
  const lines = $$('.hero__title .line');
  gsap.set(lines, { display: 'block' });
  const split = lines.map((l) => { const w = document.createElement('span'); w.className = 'reveal-line'; l.replaceWith(w); w.append(l); return l; });
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(dim, { v: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: () => cyc.dim(dim.v) }, 0)
    .from('.kicker', { autoAlpha: 0, y: 12, duration: 1 }, 0.35)
    .from(split, { yPercent: 108, filter: 'blur(10px)', duration: 1.4, stagger: 0.12 }, 0.45)
    .from(['.hero__sub', '.hero__actions'], { autoAlpha: 0, y: 18, duration: 1.1, stagger: 0.1 }, 0.9);
  // on the big stage the monitor rises with the house lights; on phones it is the first thing in view, so it shows at once
  if (matchMedia('(min-width: 900px) and (min-height: 600px)').matches) gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('#monitor .monitor__screen', { autoAlpha: 0, y: 40, filter: 'brightness(0.15)', duration: 1.8, ease: 'power3.out', clearProps: 'filter,transform' }, 0.7)
    .from('#monitor .monitor__umd', { autoAlpha: 0, duration: 1 }, 1.6);
}

// ---------- the stage becomes the screening ----------
const stage = $('#top');
const film = $('#filmVideo');
const filmHead = $('.film-head');
const chapters = $('#chapters');
let stageST = null;
let filmLoaded = false;
const loadFilm = () => {
  if (filmLoaded) return;
  filmLoaded = true;
  $$('source', film).forEach((s) => { s.src = s.dataset.src; });
  film.load();
};
const setFilmOn = (on) => {
  stage.classList.toggle('film-on', on);
  if (on) {
    loadFilm();
    heroLoop.pause();
    if (!reduced) film.play().catch(() => {});
  } else {
    film.pause();
    if (!reduced) heroLoop.play().catch(() => {});
  }
};
const chapterBtns = $$('#chapters button');
chapterBtns.forEach((b, i) => { b.dataset.t = CHAPTERS[i]; b.querySelector('.mono').textContent = fmtMMSS(CHAPTERS[i]); });
film.addEventListener('loadedmetadata', () => { $('#filmLength').textContent = fmtMMSS(film.duration); });
const syncFilm = () => {
  const t = film.currentTime;
  if (film.duration) $('#filmProgress').style.transform = `scaleX(${t / film.duration})`;
  let cur = 0;
  CHAPTERS.forEach((c, i) => { if (t >= c - 0.05) cur = i; });
  chapterBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
};
film.addEventListener('timeupdate', syncFilm);
film.addEventListener('play', () => stage.classList.add('is-playing'));
film.addEventListener('pause', () => stage.classList.remove('is-playing'));
film.addEventListener('ended', () => { film.currentTime = 0; film.play().catch(() => {}); });
$('#filmToggle').addEventListener('click', () => {
  loadFilm();
  if (film.paused) film.play().catch(() => {}); else film.pause();
  $('#filmToggle').setAttribute('aria-label', film.paused ? 'Play the recording' : 'Pause the recording');
});
chapterBtns.forEach((b) => b.addEventListener('click', () => playFrom(Number(b.dataset.t))));
// ?t=39 deep links (the VideoObject key moments point here) open the film at that second
window.addEventListener('load', () => {
  const t = Number(new URLSearchParams(location.search).get('t'));
  if (Number.isFinite(t) && t > 0) setTimeout(() => playFrom(Math.min(t, 65)), 400);
});
function playFrom(t) {
  const seek = () => { loadFilm(); const go = () => { film.currentTime = t; film.play().catch(() => {}); }; if (film.readyState >= 1) go(); else film.addEventListener('loadedmetadata', go, { once: true }); };
  if (stageST && stageST.progress < 0.62) { goFilm(); setTimeout(seek, 900); } else { if (!stageST) goFilm(); seek(); }
}
function goFilm() {
  if (stageST) scrollToY(stageST.start + (stageST.end - stageST.start) * 0.78);
  else scrollToY(monitor.getBoundingClientRect().top + scrollY - 90);
}
$('#watchRun').addEventListener('click', (e) => { e.preventDefault(); goFilm(); });

const mm = gsap.matchMedia();
mm.add({ big: '(min-width: 900px) and (min-height: 600px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  const { big, motion } = ctx.conditions;
  if (!(big && motion)) {
    stage.classList.add('is-static', 'film-on');
    // the poster holds until the visitor first scrolls or taps, so a bounce never downloads the film
    // and the first paint stays the poster
    let engaged = false, inView = false;
    const autoplay = () => { if (engaged && inView) { loadFilm(); if (!reduced) film.play().catch(() => {}); } };
    const engage = () => { engaged = true; autoplay(); };
    ['scroll', 'pointerdown', 'keydown'].forEach((t) => addEventListener(t, engage, { once: true, passive: true }));
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) autoplay(); else film.pause();
    }, { threshold: 0.5 });
    io.observe(monitor);
    cyc.set(phaseOf(stage) + 0.1);
    ScrollTrigger.create({ trigger: stage, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && cyc.set(0.17, 1) });
    return () => { io.disconnect(); stage.classList.remove('is-static', 'film-on'); };
  }
  stage.classList.remove('is-static');
  // where the monitor lands: centred between the film heading and the chapter strip
  const target = () => {
    const headBottom = filmHead.offsetTop + filmHead.offsetHeight + 22;
    const chapTop = innerHeight - chapters.offsetHeight - innerHeight * 0.03 - 26;
    const umd = 34;
    const availH = chapTop - headBottom - umd;
    const w = Math.min(innerWidth * 0.86, availH * 1.6);
    const left = (innerWidth - w) / 2;
    const top = headBottom + (availH - w / 1.6) / 2;
    return { w, left, top };
  };
  let r0 = (() => { const r = monitor.getBoundingClientRect(); return { left: r.left, top: r.top + scrollY, width: r.width }; })();
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage, start: 'top top', end: '+=150%', pin: true, scrub: 0.7, anticipatePin: 1, refreshPriority: 2,
      invalidateOnRefresh: true,
      onRefreshInit: () => { gsap.set(monitor, { clearProps: 'transform' }); const r = monitor.getBoundingClientRect(); r0 = { left: r.left, top: r.top + scrollY, width: r.width }; },
      onUpdate: (s) => {
        cyc.set(0.07 + Math.min(1, s.progress / 0.6) * 0.13, 0.5);
        const on = s.progress > 0.58;
        if (on !== stage.classList.contains('film-on')) setFilmOn(on);
      },
      onToggle: (s) => { if (!s.isActive && s.direction < 0) setFilmOn(false); },
    },
  });
  stageST = tl.scrollTrigger;
  tl.to(hero, { y: () => -innerHeight * 0.18, autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, 0)
    .to(monitor, {
      x: () => target().left - r0.left,
      y: () => target().top - r0.top,
      scale: () => target().w / r0.width,
      duration: 0.6, ease: 'power2.inOut',
    }, 0)
    .fromTo(filmHead, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.42)
    .fromTo(chapters, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.48)
    .to({}, { duration: 0.4 });
  return () => { setFilmOn(false); stageST = null; };
});
// pause the film when the stage is gone
ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom top', onLeave: () => film.pause(), onEnterBack: () => { if (stage.classList.contains('film-on') && !reduced && !stage.classList.contains('is-static')) film.play().catch(() => {}); } });

// ---------- section titles light up line by line ----------
if (!reduced) {
  $$('.section-title, .close__title').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 108, filter: 'blur(8px)', duration: 1.25, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 84%', once: true } }),
    });
  });
}

// ---------- how: one clip per step ----------
const clips = $$('.clip');
const steps = $$('.step');
const showClip = (i) => {
  steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
  clips.forEach((v, j) => {
    const on = j === i;
    v.classList.toggle('is-on', on);
    if (on) { if (!v.src) { v.src = v.dataset.src; } if (!reduced) v.play().catch(() => {}); } else v.pause();
  });
};
steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 38%', onToggle: (st) => st.isActive && showClip(i) }));
ScrollTrigger.create({ trigger: '#how', start: 'top bottom', end: 'bottom top', onToggle: (s) => { if (!s.isActive) clips.forEach((v) => v.pause()); } });

// ---------- the lighting desk: six faders, one verdict, and the room follows ----------
const faderWrap = $('#faders');
const verdictSec = $('#verdict');
const VERDICTS = [[85, 'Ready', 'var(--ok)'], [70, 'Minor fixes', 'var(--minor)'], [50, 'Needs work', 'var(--major)'], [0, 'Major rework', 'var(--crit)']];
const LIGHT = [[0, 0.26], [50, 0.36], [58, 0.42], [70, 0.56], [85, 0.82], [100, 0.96]];
const lightFor = (o) => { for (let i = 1; i < LIGHT.length; i++) if (o <= LIGHT[i][0]) { const [a, pa] = LIGHT[i - 1], [b, pb] = LIGHT[i]; return pa + ((o - a) / (b - a)) * (pb - pa); } return 0.96; };
let verdictActive = false;
const inputs = CATEGORIES.map((c) => {
  const el = document.createElement('div');
  el.className = 'fader';
  el.innerHTML = `<output class="fader__val" for="f-${c.id}">${c.score}</output>
    <div class="fader__well" style="--v:${c.score}"><span class="fader__slot"></span><span class="fader__ticks"></span><span class="fader__light"></span><span class="fader__ready"></span>
    <input id="f-${c.id}" type="range" min="0" max="100" step="1" value="${c.score}" aria-label="${c.label} score" aria-valuetext="${c.score} out of 100" /></div>
    <label class="fader__name" for="f-${c.id}">${c.label}<span class="fader__weight">${Math.round(c.weight * 100)}% weight</span></label>`;
  faderWrap.append(el);
  return el.querySelector('input');
});
const overallEl = $('#overall'), wordEl = $('#verdictWord'), pinEl = $('#verdictPin');
const renderDesk = () => {
  let o = 0;
  inputs.forEach((inp, i) => {
    const v = Number(inp.value);
    o += v * CATEGORIES[i].weight;
    inp.closest('.fader__well').style.setProperty('--v', v);
    inp.closest('.fader').querySelector('output').textContent = v;
    inp.setAttribute('aria-valuetext', `${v} out of 100`);
  });
  o = Math.round(o);
  const [, word, color] = VERDICTS.find(([min]) => o >= min);
  overallEl.textContent = o;
  wordEl.textContent = word;
  wordEl.style.setProperty('--verdict-c', color);
  pinEl.style.setProperty('--pin', o);
  if (verdictActive) cyc.set(mqDark.matches ? Math.min(lightFor(o), 0.9) : lightFor(o), 0.8);
  return o;
};
inputs.forEach((inp) => inp.addEventListener('input', renderDesk));
const tweenDesk = (to, dur = 1.1) => {
  const from = inputs.map((i) => Number(i.value));
  const p = { k: 0 };
  gsap.to(p, { k: 1, duration: reduced ? 0 : dur, ease: 'power3.out', onUpdate: () => { inputs.forEach((inp, i) => { inp.value = Math.round(from[i] + (to[i] - from[i]) * p.k); }); renderDesk(); } });
};
$('#resetFaders').addEventListener('click', () => tweenDesk(CATEGORIES.map((c) => c.score), 0.8));
inputs.forEach((i) => { i.value = 0; });
renderDesk();
ScrollTrigger.create({ trigger: verdictSec, start: 'top 70%', once: true, onEnter: () => tweenDesk(CATEGORIES.map((c) => c.score), 1.6) });
ScrollTrigger.create({
  trigger: verdictSec, start: 'top 55%', end: 'bottom 55%',
  onToggle: (s) => { verdictActive = s.isActive; if (s.isActive) renderDesk(); },
});

// ---------- proof: the wipe ----------
const wipe = $('.wipe__stage');
const range = $('#wipeRange');
const setWipe = (v) => wipe.style.setProperty('--x', `${v}%`);
range.addEventListener('input', () => setWipe(range.value));
ScrollTrigger.create({
  trigger: '#wipe', start: 'top 70%', once: true,
  onEnter: () => {
    $('#wipe').classList.add('is-drawn');
    if (reduced) return;
    const p = { v: 86 };
    gsap.to(p, { v: 58, duration: 1.8, delay: 0.5, ease: 'power3.inOut', onUpdate: () => { setWipe(p.v); range.value = p.v; } });
  },
});

// ---------- proof: the whole cut on one timeline ----------
const strip = $('#strip');
for (let i = 0; i < 12; i++) {
  const img = document.createElement('img');
  img.src = `media/thumb_${String(i).padStart(2, '0')}.jpg`;
  img.alt = '';
  img.loading = 'lazy';
  strip.append(img);
}
const lanes = $('#lanes');
const laneOf = { critical: 0, major: 1, minor: 2 };
FINDINGS.forEach((f) => {
  const s = document.createElement('span');
  s.style.left = `${(f.t / AD_LEN) * 100}%`;
  s.style.width = `${((f.end - f.t) / AD_LEN) * 100}%`;
  s.style.top = `${4 + laneOf[f.sev] * 11}px`;
  s.style.background = SEV[f.sev].c;
  lanes.append(s);
});
WHOLE.forEach((f, i) => {
  const s = document.createElement('span');
  s.className = 'whole';
  s.style.left = '0'; s.style.width = '100%';
  s.style.bottom = `${3 + i * 4}px`;
  s.style.background = SEV[f.sev].c;
  lanes.append(s);
});
const log = $('#scrubLog');
const sevChip = (sev) => `<span class="sev sev--${sev}">${SEV[sev].label}</span>`;
const logItems = FINDINGS.map((f) => {
  const li = document.createElement('li');
  li.innerHTML = `<span class="mono">${fmt(f.t)}</span><b>${f.title}</b>${sevChip(f.sev)}`;
  log.append(li);
  return li;
});
const scrubVideo = $('#scrubVideo');
const tcEl = $('#scrubTc'), head = $('#playhead'), flag = $('#scrubFlag');
let scrubT = 0, seeking = false, pendingT = null;
// one seek in flight at a time; the latest request wins. Seeks wait for metadata, or 'seeked' never fires
const seekTo = (t) => {
  if (!scrubVideo.src) loadScrub();
  if (seeking || scrubVideo.readyState < 1) { pendingT = t; return; }
  seeking = true;
  scrubVideo.currentTime = t;
};
scrubVideo.addEventListener('loadedmetadata', () => { if (pendingT != null) { const t = pendingT; pendingT = null; seekTo(t); } });
scrubVideo.addEventListener('seeked', () => { seeking = false; if (pendingT != null) { const t = pendingT; pendingT = null; seekTo(t); } });
const renderScrub = (t, drive = true) => {
  scrubT = Math.max(0, Math.min(AD_LEN - 0.04, t));
  const fr = Math.floor((scrubT % 1) * 30);
  tcEl.textContent = `00:00:${String(Math.floor(scrubT)).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
  head.style.transform = `translateX(${(scrubT / AD_LEN) * $('#timeline').clientWidth}px)`;
  let now = -1;
  logItems.forEach((li, i) => {
    const hit = scrubT >= FINDINGS[i].t - 0.05;
    li.classList.toggle('is-hit', hit);
    if (hit && scrubT <= FINDINGS[i].end + 0.6) now = i;
  });
  logItems.forEach((li, i) => li.classList.toggle('is-now', i === now));
  if (now >= 0) { flag.hidden = false; flag.innerHTML = `${sevChip(FINDINGS[now].sev)}`; } else flag.hidden = true;
  if (drive) seekTo(scrubT);
};
function loadScrub() { if (!scrubVideo.src) { scrubVideo.src = scrubVideo.dataset.src; scrubVideo.preload = 'auto'; scrubVideo.load(); } }
ScrollTrigger.create({ trigger: '#proof', start: 'top bottom', once: true, onEnter: loadScrub });
mm.add({ big: '(min-width: 900px) and (min-height: 600px)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
  if (ctx.conditions.big && ctx.conditions.motion) {
    ScrollTrigger.create({
      trigger: '#scrub', start: 'top top', end: '+=230%', pin: '.scrub__pin', scrub: true, anticipatePin: 1, refreshPriority: 1,
      onUpdate: (s) => renderScrub(s.progress * AD_LEN),
    });
    return undefined;
  }
  // without the pin, the ad simply plays and the log follows it
  scrubVideo.controls = true;
  scrubVideo.loop = true;
  const onTime = () => renderScrub(scrubVideo.currentTime, false);
  scrubVideo.addEventListener('timeupdate', onTime);
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadScrub(); if (!reduced) scrubVideo.play().catch(() => {}); } else scrubVideo.pause(); }, { threshold: 0.4 });
  io.observe(scrubVideo);
  return () => { scrubVideo.removeEventListener('timeupdate', onTime); io.disconnect(); scrubVideo.controls = false; };
});
addEventListener('resize', () => renderScrub(scrubT, false));
renderScrub(0, false);

// ---------- the rewrite ----------
const rewrite = $('#rewrite');
if (reduced) { rewrite.style.setProperty('--strike', '100%'); rewrite.style.setProperty('--reveal', '0%'); } else {
  const p = { s: 0, r: 100 };
  gsap.timeline({ scrollTrigger: { trigger: rewrite, start: 'top 72%', once: true } })
    .to(p, { s: 100, duration: 0.7, ease: 'power2.inOut', onUpdate: () => rewrite.style.setProperty('--strike', `${p.s}%`) })
    .to(p, { r: 0, duration: 0.9, ease: 'power3.out', onUpdate: () => rewrite.style.setProperty('--reveal', `${p.r}%`) }, '+=0.15');
}

// ---------- the closing cue: the sun clears the horizon ----------
if (!reduced) {
  gsap.fromTo('.sunrise span', { yPercent: 100 }, { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '#access', start: 'top 90%', end: 'top 25%', scrub: 0.8 } });
}

// ---------- who: presets ----------
const tabs = $$('[role="tab"]');
const select = (tab, focus = false) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = $(`#${t.getAttribute('aria-controls')}`);
    panel.hidden = !on;
    if (on) { panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); }
  });
  if (focus) tab.focus();
};
tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(t));
  t.addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
    if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
    if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
  });
});

// ---------- request access ----------
// Set VITE_ACCESS_ENDPOINT to a URL that accepts {email, role} as JSON. Without it the form opens a
// pre-filled email to the placeholder address below; replace both before launch.
const ACCESS_ENDPOINT = import.meta.env.VITE_ACCESS_ENDPOINT || '';
const ACCESS_EMAIL = import.meta.env.VITE_ACCESS_EMAIL || 'info@metabrixlab.com';
const form = $('#accessForm');
const status = $('#accessStatus');
const email = $('#email');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = email.value.trim();
  status.className = 'access__status';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    email.setAttribute('aria-invalid', 'true');
    status.classList.add('is-error');
    status.textContent = 'Enter a work email, like you@studio.com.';
    email.focus();
    return;
  }
  email.removeAttribute('aria-invalid');
  const role = $('#role').value;
  const btn = form.querySelector('button');
  if (!ACCESS_ENDPOINT) {
    location.href = `mailto:${ACCESS_EMAIL}?subject=${encodeURIComponent('ShotFix access request')}&body=${encodeURIComponent(`Email: ${value}\nWhat I make: ${role}`)}`;
    status.classList.add('is-ok');
    status.textContent = `Your email app should open with the request filled in. If it doesn't, write to ${ACCESS_EMAIL}.`;
    return;
  }
  btn.disabled = true;
  status.textContent = 'Sending…';
  try {
    const res = await fetch(ACCESS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: value, role }) });
    if (!res.ok) throw new Error(String(res.status));
    status.classList.add('is-ok');
    status.textContent = "Request received. We'll write to you when a place opens.";
    form.reset();
  } catch {
    status.classList.add('is-error');
    status.textContent = `That didn't go through. Try again, or write to ${ACCESS_EMAIL}.`;
  } finally {
    btn.disabled = false;
  }
});
email.addEventListener('input', () => email.removeAttribute('aria-invalid'));

// colour scheme changes re-ink the page and re-aim the light
mqDark.addEventListener('change', () => ScrollTrigger.refresh());
addEventListener('load', () => ScrollTrigger.refresh());
