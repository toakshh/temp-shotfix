import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// <i data-icon="play"></i> in index.html becomes the inline Phosphor (bold) svg at build time,
// so icons render without JavaScript and inherit currentColor.
const iconDir = path.resolve('node_modules/@phosphor-icons/core/assets/bold');
const inlineIcons = () => ({
  name: 'inline-phosphor-icons',
  transformIndexHtml(html) {
    return html.replace(/<i data-icon="([a-z-]+)"( class="([^"]*)")?><\/i>/g, (_, name, __, cls) => {
      const svg = fs.readFileSync(path.join(iconDir, `${name}-bold.svg`), 'utf8');
      return svg.replace('<svg ', `<svg class="icon${cls ? ` ${cls}` : ''}" aria-hidden="true" focusable="false" `);
    });
  },
});

// ---------- SEO and answer-engine files ----------
// The film's chapters: [start seconds, name, what happens]. Feeds the VideoObject key moments,
// the WebVTT chapters track, the video sitemap and llms.txt. Keep in step with CHAPTERS in src/main.js.
const FILM_LENGTH = 66;
const CHAPTERS = [
  [0, 'Brief', 'A sample launch ad is uploaded with its brief: goal, audience, platforms, brand and reference notes.'],
  [22.3, 'Live run', 'Detailed analysis runs; each reviewer lights up as it finishes.'],
  [31.7, 'Verdict', 'The report opens on the verdict: 58 out of 100, needs work, with six category scores.'],
  [39.3, 'Proof', 'A critical continuity finding opens with its evidence frame and the reference frame.'],
  [53.4, 'Fix', 'Suggestions are reviewed and approved in fix order.'],
  [58.0, 'Share', 'A read-only share link is created for a client.'],
];

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();

// FAQPage schema comes from the visible FAQ markup, so the two can never drift apart.
function faqFrom(html) {
  const items = [...html.matchAll(/<details class="faq__item"[^>]*>([\s\S]*?)<\/details>/g)].map(([, body]) => ({
    q: strip(body.match(/<span class="faq__q">([\s\S]*?)<\/span>/)[1]),
    a: strip(body.match(/<div class="faq__a">([\s\S]*?)<\/div>/)[1]),
  }));
  return items;
}

const vtt = (t) => {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `00:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
};

function seoFiles(site, html) {
  const today = new Date().toISOString().slice(0, 10);
  const faq = faqFrom(html);
  const robots = `# ShotFix landing page. Search engines and AI answer engines are welcome.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${site}/sitemap.xml
`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${site}/</loc>
    <lastmod>${today}</lastmod>
    <image:image><image:loc>${site}/media/og.jpg</image:loc></image:image>
    <image:image><image:loc>${site}/media/ev-issue.jpg</image:loc></image:image>
    <image:image><image:loc>${site}/media/ev-ref.jpg</image:loc></image:image>
    <image:image><image:loc>${site}/media/who-creators.jpg</image:loc></image:image>
    <image:image><image:loc>${site}/media/who-brand.jpg</image:loc></image:image>
    <image:image><image:loc>${site}/media/who-agencies.jpg</image:loc></image:image>
    <video:video>
      <video:thumbnail_loc>${site}/media/film.jpg</video:thumbnail_loc>
      <video:title>ShotFix: one check, start to finish</video:title>
      <video:description>${esc('A screen recording of the ShotFix app checking a sample launch ad: the brief, the live analysis, the verdict, the evidence frames, the fix list and the share link.')}</video:description>
      <video:content_loc>${site}/media/film.mp4</video:content_loc>
      <video:duration>${FILM_LENGTH}</video:duration>
      <video:publication_date>2026-11-12T00:00:00+00:00</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>
</urlset>
`;
  const chaptersVtt = `WEBVTT\n\n${CHAPTERS.map(([t, name], i) => `${i + 1}\n${vtt(t)} --> ${vtt(i + 1 < CHAPTERS.length ? CHAPTERS[i + 1][0] : FILM_LENGTH)}\n${name}\n`).join('\n')}`;
  const llms = `# ShotFix

> ShotFix is AI video QC (video quality control) by Metabrix. You upload a video with its brief, and ShotFix watches and listens to it, then returns an overall score out of 100, a publish verdict, six category scores, and findings pinned to time ranges in the video with evidence frames.

ShotFix is in early access for a small group of teams. Request access: ${site}/#access

## What a check returns

- An overall score out of 100 and a publish verdict: ready (85 and up), minor fixes (70 to 84), needs work (50 to 69), major rework (under 50). An open critical finding holds the verdict at needs work.
- Six category scores, each with a weight and a confidence: consistency, visual quality, emotion and engagement, script and content, viral potential, compliance.
- Findings with a severity (critical, major, minor, info), a time range, evidence frames and, in Detailed mode, a fix.
- A transcript, tracked characters, objects and voices, guardrail checks, a claims register, platform spec checks, hook, call to action and pacing measurements, and loudness and picture signals.
- In Detailed mode, suggestions to review: edit, script, visual, platform and creative.

## How it differs

ShotFix proves problems instead of asserting them: every finding points at a time range in the video with the frame that shows it. The brief and reference notes are treated as ground truth, so it catches continuity breaks (a character's look, a product's colour or a voice changing between shots), AI artefacts and unsupported claims that generic video analytics do not look for.

## Modes and cost

- Fast: a quick review, about three AI checks in parallel, scores and findings, no suggestions. 1 credit per started video minute.
- Detailed: the full pipeline with fixes and suggestions. 3 credits per started video minute.

## Sharing

Reports are shared as read-only links that expire after 1, 3, 7, 14 or 30 days. Viewers need no account and never see the video file. Reports export as HTML or JSON. Videos can be re-analysed; earlier runs stay in History.

## Who it is for

- AI video creators deciding whether a video is ready to post on YouTube, TikTok, Reels and similar.
- Agencies and studios reviewing client and ad work and sharing reports with clients.
- Brand and compliance reviewers checking claims, disclaimers and platform rules before a campaign goes live.

## Demo recording

${site}/media/film.mp4 (${FILM_LENGTH} seconds, no sound). The ad, brand, people and report in it are synthetic samples.
${CHAPTERS.map(([t, name, what]) => `- ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')} ${name}: ${what}`).join('\n')}

## Questions

${faq.map(({ q, a }) => `### ${q}\n\n${a}`).join('\n\n')}
`;
  const manifest = JSON.stringify({
    name: 'ShotFix',
    short_name: 'ShotFix',
    description: 'AI video QC that scores a video against its brief before it airs.',
    start_url: './',
    scope: './',
    display: 'browser',
    background_color: '#050507',
    theme_color: '#050507',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }, null, 2);
  return {
    'robots.txt': robots,
    'sitemap.xml': sitemap,
    'llms.txt': llms,
    'site.webmanifest': manifest,
    'media/film-chapters.vtt': chaptersVtt,
  };
}

const TYPES = { txt: 'text/plain', xml: 'application/xml', webmanifest: 'application/manifest+json', vtt: 'text/vtt' };

const seo = (site, isBuild) => {
  let html = '';
  return {
    name: 'shotfix-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(src, ctx) {
        html = src;
        const faq = faqFrom(src);
        const faqLd = JSON.stringify({
          '@type': 'FAQPage',
          '@id': `${site}/#faq`,
          isPartOf: { '@id': `${site}/#webpage` },
          mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        }, null, 2);
        const clips = JSON.stringify(CHAPTERS.map(([t, name, what], i) => ({
          '@type': 'Clip',
          name,
          description: what,
          startOffset: Math.floor(t),
          endOffset: Math.floor(i + 1 < CHAPTERS.length ? CHAPTERS[i + 1][0] : FILM_LENGTH),
          url: `${site}/?t=${Math.floor(t)}#film`,
        })), null, 2);
        return src
          .replace('%FAQ%', faqLd)
          .replace('%CLIPS%', clips)
          .replaceAll('%BUILD_DATE%', new Date().toISOString().slice(0, 10))
          .replaceAll('%SITE%', site);
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0].replace(/^\//, '');
        if (!html) html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const files = seoFiles(site, html);
        if (!files[url]) return next();
        res.setHeader('Content-Type', `${TYPES[url.split('.').pop()]}; charset=utf-8`);
        res.end(files[url]);
      });
    },
    generateBundle() {
      if (!isBuild) return;
      for (const [fileName, source] of Object.entries(seoFiles(site, html))) this.emitFile({ type: 'asset', fileName, source });
    },
  };
};

// preload the two latin font files the first viewport needs (stencil display, Geist body)
const fontPreloads = () => ({
  name: 'shotfix-font-preloads',
  transformIndexHtml: {
    order: 'post',
    handler(src, ctx) {
      const wanted = [/big-shoulders-stencil-latin-opsz-normal-[\w-]+\.woff2$/, /geist-latin-wght-normal-[\w-]+\.woff2$/];
      const files = ctx.bundle ? Object.keys(ctx.bundle).filter((f) => wanted.some((re) => re.test(f))) : [];
      const links = files.map((f) => `<link rel="preload" href="./${f}" as="font" type="font/woff2" crossorigin />`).join('\n');
      return src.replace('<!-- %FONT_PRELOADS% -->', links);
    },
  },
});

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // the landing page is the domain root; the app is served from /app on the same domain.
  // Override with SITE_URL (for a staging host, say).
  const site = (env.SITE_URL || 'https://shotfix.ai').replace(/\/+$/, '');
  return {
    base: './',
    plugins: [
      inlineIcons(),
      seo(site, command === 'build'),
      fontPreloads(),
    ],
    build: { target: 'es2020', assetsInlineLimit: 0 },
    server: { port: 5180 },
  };
});
