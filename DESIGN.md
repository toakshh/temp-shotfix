---
name: ShotFix landing
description: A theatre cyclorama that rises from blackout to white day as the visitor scrolls. Stencil cue type, lighting-desk controls, the real app on stage monitors.
scope: landing/ only. The web app keeps the root DESIGN.md.
colors:
  cyc-black: "#050507"
  cobalt: "#0a33ff"
  cobalt-hi: "#2a4dff"
  rose: "#ff6aae"
  dawn: "#ffc1d6"
  wash: "#f7f5ff"
  day: "#fdfcff"
  night-ink: "#f3f1ff"
  night-ink-2: "#c8c2ec"
  day-ink: "#13101f"
  day-ink-2: "#3f3556"
  critical: "#f43f5e"
  major: "#f97316"
  minor: "#f59e0b"
  ok: "#10b981"
typography:
  display: "Big Shoulders Stencil (opsz 72, weight 800, uppercase, line-height 0.9)"
  body: "Geist, 17px / 1.6"
  mono: "Geist Mono, timecodes, scores and cue numbers only"
rounded:
  panel: 14px
  control: 6px
---

# Design System: ShotFix landing

Recorded 2026-11-12 from the built page. Direction "Night to Day" (a cyclorama fused with the publish verdict), chosen by the user.

## The light

One number, the phase, drives the whole page: 0 is blackout, 0.18 cobalt rise, 0.42 rose gather, 0.62 dawn bloom, 0.82 day wash, 1 white day. `src/cyc.js` renders it as a WebGL wall (sky, horizon line, floor, slow haze) at half resolution, interpolating stops in OKLab. Sections declare `data-phase` and `data-ink`; the wall crossfades between cues over about a second. Dark mode holds the light at dusk (`data-phase-dark`, `data-ink-dark`). Text never sits on a mid-transition wall for long: ink flips per section, and dense content lives on panels.

## Colour

Full palette, owned by the light rather than by components. Cobalt is the one action colour (primary buttons, the selected preset); rose is light, not a button colour. Status colours appear only with a word or icon (Critical, Major, Minor, Pass, Fail). No gradient text, no glows on buttons beyond an offset shadow.

## Type

Stencil caps (road-case lettering) for display titles, cue names and the verdict word, never for reading text. Display caps at 6rem. Geist for everything readable; secondary text is tinted from the ink, never grey. Geist Mono only for timecodes, scores, credits and cue numbers.

## Components

- **Stage monitor**: dark bezel, 16:10 screen, an under-monitor label with a tally lamp that lights only while the film plays. Every monitor carries the real app recording; none are drawn.
- **Lighting desk (cue rail)**: fixed right rail from 1280px, showing the current cue and the page level; the links jump to sections.
- **Faders**: native range inputs turned vertical, a lit column from cobalt to dawn, a mark at 85.
- **Cue sheet**: the fix-first table, Q1 to Q5 with timecodes.
- **Presets**: tab keys, the selected one lit cobalt.
- **Panels**: 14px radius, one border, no shadow on light phases; the verdict console and rewrite card stay matte black.

## Motion

One authored moment per section, all tied to light or time: the house lights come up on load; the stage monitor flies into the screening; titles rise line by line out of a mask with a slight blur; faders sweep to their values; the issue circle draws in; the ad scrubs with the scroll; the rewrite strikes through; the sun rises behind the last line. Lenis smooths the scroll. Under reduced motion all of it is static and nothing autoplays.

## Do and don't

- Do keep every product claim to PRODUCT.md; the sample data is synthetic and labelled as such.
- Do put dense text on panels when the wall is mid-phase.
- Don't add accent stripes to cards, eyebrows over every section, or decorative dots (the tally lamp is the only lamp, and it means "playing").
- Don't use em dashes in page copy.
