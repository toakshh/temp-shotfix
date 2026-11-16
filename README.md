# ShotFix landing page

Marketing page for ShotFix. Static site: Vite, GSAP (ScrollTrigger, SplitText), Lenis and one small WebGL shader. Fonts are self-hosted (Geist, Geist Mono, Big Shoulders Stencil), so nothing loads from a third-party CDN.

```bash
cd landing
npm install
npm run dev        # http://localhost:5180
npm run build      # static output in landing/dist, deploy that folder anywhere
```

`base` is `./`, so `dist/` works from any path or subfolder.

## What's on the page

The page is a theatre cyclorama: a full-screen light wall (`src/cyc.js`) that rises from blackout through cobalt and rose to white day as you scroll, the way a cut goes from major rework to ready. Each section asks for a light level (`data-phase`) and the wall crossfades to it like a lighting desk.

- **Stage**: the headline, then the recorded app on the horizon. On scroll the monitor flies to the centre and becomes the full 66-second recording with chapter buttons.
- **How it works**: three steps with a sticky monitor that swaps clips.
- **The verdict**: six faders with the sample ad's category scores and weights. Moving them recomputes the overall score and verdict, and the room's light follows (85 and up goes to day).
- **Proof**: a reference/issue wipe with the circles drawn in, then the whole 24-second ad on a scroll-scrubbed timeline with each finding logged at its timecode.
- **What it catches, Fix and share, Who it's for, Request access.**

Under `prefers-reduced-motion` the page drops smooth scrolling, pins, scrubbing and autoplay; everything stays readable. Under `prefers-color-scheme: dark` the light stops at dusk instead of white day.

## The recording

`public/media/film.mp4` is the real ShotFix web app (built from `frontend/`) recorded against a synthetic stand-in API. Nothing in it comes from a real user: the ad ("Daybreak Yuzu"), the studio, the people and the report are made up, and the page says so in the footer and under the monitor.

It's captured deterministically: the app runs on a paused virtual clock that advances one frame per capture, CSS animations and video playback are stepped to that clock, and a rendered cursor and a virtual camera (Chrome re-rasterises each zoomed crop, so text stays sharp) are composed per frame. That's why it's a smooth 60 fps regardless of machine speed.

To re-record after the app's UI changes (needs Node 20+, ffmpeg and a Playwright Chromium; set `CHROME_PATH` if yours isn't in the default location):

```bash
cd landing/recording
npm install
npm run all        # render the sample ad, cut its frames, build the app, record, encode into ../public/media
```

`mock.mjs` holds the synthetic report, `record.mjs` the storyboard (cursor moves, typing, camera). If the storyboard timing changes, update `CHAPTERS` in `src/main.js` and the clip start times in `make-media.sh`.

## Domain and search

The page is built for `https://shotfix.ai` (the app lives at `https://shotfix.ai/app`). Set `SITE_URL` to build for another host, such as staging. The build writes every absolute URL from it: canonical, Open Graph and Twitter cards, JSON-LD, `sitemap.xml`, `robots.txt` and `llms.txt`.

- **Structured data** (JSON-LD in `index.html`): Organization, WebSite, WebPage, SoftwareApplication, VideoObject with six chapter clips (key moments link to `/?t=<seconds>#film`, which opens the film at that second), and FAQPage. The FAQPage entries are generated from the visible FAQ section at build time, so edit the questions in the HTML only.
- **Answer engines**: `llms.txt` is a plain summary of the product, the demo chapters and the FAQ; `robots.txt` allows search and AI crawlers explicitly.
- **Video**: `media/film-chapters.vtt` is a chapters track for the film, also generated; the sitemap carries a video entry and the key images.
- Chapter times live in `vite.config.js` (`CHAPTERS`) and `src/main.js` (`CHAPTERS`). Keep them in step after a re-record.

## Replace before launch

- **Request access**: set `VITE_ACCESS_ENDPOINT` to a URL that accepts `POST {email, role}` as JSON. Without it the form opens a pre-filled email to `VITE_ACCESS_EMAIL`, which defaults to the placeholder `info@metabrixlab.com`.
- **Footer contact**: the `mailto:info@metabrixlab.com` link in `index.html`.
- **Sample domain in the recording**: the share link on screen reads `app.shotfix.example`. To show `shotfix.ai/app`, change `ORIGIN` in `recording/record.mjs` and re-record.
- **Sample ad**: the analysed ad is a canvas animation with planted problems. A real AI-generated spot (for example from Veo, which the backend already supports) would read stronger, but it costs generation credits.

Media weight: about 20 MB in `public/media`, almost all of it video. Only the 1.1 MB hero loop loads up front; the 9.8 MB film (4.7 MB on phones) loads when the stage reaches it.
