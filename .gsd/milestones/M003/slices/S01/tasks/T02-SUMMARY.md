---
id: T02
parent: S01
milestone: M003
provides:
  - Passing editorial landing implementation for the homepage entry flow with branded shell, control surface, and reusable surface/action semantics
key_files:
  - src/app/page.tsx
  - src/components/input/InputZone.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/Shell.tsx
  - src/app/layout.tsx
  - src/app/globals.css
key_decisions:
  - Anchor the redesign in a dark editorial gallery-luxe system built from reusable shell/panel/action tokens instead of page-local styling
patterns_established:
  - Use one branded intake composition where product framing, privacy language, live controls, curated prompts, and progress all coexist without changing the underlying generation hooks
observability_surfaces:
  - Homepage editorial copy seams in src/app/page.tsx, InputZone privacy/control labels, homepage Vitest proof, and browser-visible landing/results assertions
duration: 1h 20m
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---

# T02: Redesign the landing and generation entry as an editorial branded surface

**Shipped an editorial gallery-luxe homepage entry flow that explains Synesthesia Machine clearly, preserves all real generation modes, and passes the new landing proof contract.**

## What Happened

Reworked `src/app/page.tsx` so the empty state is no longer a placeholder block and sparse tagline. The landing now uses a two-column editorial composition with explicit product framing, distinct value messaging, launch-facing guidance, branded quick context cards, curated prompt framing, and progress placement that still wraps the real generation flow.

Reframed `src/components/input/InputZone.tsx` into a branded control desk. The text, URL, and data tabs remain intact, keyboard-usable submission behavior is preserved through the existing input components, and the privacy/local-analysis posture is now part of the visible editorial narrative instead of a tiny afterthought.

Upgraded `src/components/layout/Header.tsx` and `src/components/layout/Shell.tsx` so the chrome carries the same product story with an ambient branded shell rather than neutral framing. Updated `src/app/layout.tsx` metadata so the title/description communicate the premium editorial positioning at the document boundary.

Normalized the landing visual system in `src/app/globals.css` by adding reusable editorial shell, panel, support, note-card, marquee, and action semantics. The redesign now depends on shared branded utilities instead of one-off page-only styles.

## Verification

- Ran `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- Ran `npm run build`
- Started the real app locally and verified in the browser at `http://localhost:3000`
- Browser assertions passed for landing copy and controls: `Synesthesia Machine`, `Editorial chromatic portraits for text, links, and living datasets.`, `Choose your source`, `Private-by-default generation. Raw source stays off the proof surface.`, `Curated prompts`, visible text textarea, and no console/network failures on the landing screen
- Browser exercised text generation from landing to results and passed explicit assertions for `Editorial result`, `From source to proof`, `A continuous editorial workspace from intake to render.`, `proof diagnostics`, and `derived diagnostics only — raw input hidden`

## Diagnostics

- Run `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx` to verify the landing/results continuity contract and the preserved privacy-safe results diagnostics seam
- Open `http://localhost:3000` to inspect the branded landing copy, input controls, curated prompts, and progress framing directly
- Generate from the homepage and inspect the visible results header plus proof diagnostics to confirm the branded journey remains continuous

## Deviations

none

## Known Issues

- Browser verification hit a local environment conflict where another unrelated Next.js app briefly occupied port 3000 before the Art_Synesthesia dev server was restarted; verification passed after reclaiming the port
- ResultsView still uses the older internal composition beneath the new homepage framing; that continuity cleanup remains for T03

## Files Created/Modified

- `src/app/page.tsx` — replaced the sparse landing with a branded editorial launch composition and aligned the results intro framing with the new continuity language
- `src/components/input/InputZone.tsx` — turned the input entry into a branded control surface while preserving text/URL/data behavior
- `src/components/layout/Header.tsx` — added branded shell narrative and private-first framing to the top-level chrome
- `src/components/layout/Shell.tsx` — added ambient editorial shell framing around the application
- `src/app/layout.tsx` — updated root metadata to carry the editorial positioning outside the page body
- `src/app/globals.css` — added reusable editorial shell/panel/support/action utility semantics for the redesigned landing state
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` — marked T02 complete
