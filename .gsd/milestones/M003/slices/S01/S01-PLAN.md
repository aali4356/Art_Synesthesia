# S01: Editorial landing, generation, and results journey

**Goal:** Redesign the real homepage flow so first-time visitors can understand Synesthesia Machine, generate from the existing text/URL/data entry seams, and land in a premium editorial results experience that preserves diagnostics, privacy, and keyboard-usable core actions.
**Demo:** In the real `src/app/page.tsx` entry flow, a visitor sees a branded editorial landing surface, uses the existing generation controls, and lands in a visually continuous results experience whose proof diagnostics, style switching, and export/share/save actions remain visible and truthful.

## Must-Haves

- The real homepage route (`src/app/page.tsx`) uses one editorial gallery-luxe visual language across landing, generation, progress, and results rather than a decorative hero followed by an unchanged utilitarian tool.
- Launch-facing copy, metadata, and header/shell framing clearly explain what Synesthesia Machine is, why it is distinct, and how to begin, directly advancing R009 in the actual entry flow.
- `InputZone` keeps text, URL, and data affordances legible and keyboard-usable while reframing them as a branded editorial control surface instead of a raw utility form.
- `ResultsView` is visually restructured into the same branded system while preserving privacy-safe proof diagnostics, active-style clarity, and results actions (export/share/save) without exposing raw input.
- Shared missing surface/action utility semantics are normalized in `src/app/globals.css` or replaced so the redesigned landing/results journey does not depend on undefined classes.
- The slice leaves a future agent with clear browser-visible diagnostics for generation/results state and error posture, especially where URL mode still depends on local no-DB behavior outside this slice.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `src/__tests__/app/home-editorial-flow.test.tsx` — proves the homepage empty state and results state expose the branded narrative, premium continuity cues, real generation controls, and back/regenerate journey without dropping diagnostics.
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx` — preserves the privacy-safe proof diagnostics contract while the results surface is visually restructured.
- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- `npm run build`
- Browser verification against `http://localhost:3000`: exercise landing → generate → results, assert branded copy continuity plus visible proof diagnostics/action surfaces, and confirm URL failure messaging remains truthful when DB-backed analysis is unavailable locally.

## Observability / Diagnostics

- Runtime signals: existing `PipelineProgress` stages, `ResultsView` proof diagnostics, URL/data error states, and visible action success/error messages remain the first inspection seams for live generation outcomes.
- Inspection surfaces: homepage landing/results UI at `src/app/page.tsx`, `ResultsView` diagnostics panel, browser console/network logs during live verification, and the known URL no-DB failure copy/path.
- Failure visibility: generation stage, active style, proof source, palette family, mapping posture, renderer expressiveness, and share/export/save error states stay visible without exposing raw input.
- Redaction constraints: no raw text input is surfaced in diagnostics or share/save payloads; privacy-safe derived diagnostics only.

## Integration Closure

- Upstream surfaces consumed: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/layout/{Shell,Header}.tsx`, `src/components/input/InputZone.tsx`, `src/components/results/ResultsView.tsx`, `src/components/results/{ExportControls,ShareButton}.tsx`, `src/components/gallery/GallerySaveModal.tsx`.
- New wiring introduced in this slice: homepage landing and results are re-composed into one branded editorial journey; metadata/header/shell framing is aligned to the new narrative; shared action/surface tokens are normalized so results actions and modal entry states participate in the same visual system.
- What remains before the milestone is truly usable end-to-end: S02 still needs to propagate this branded system into shared shell/action/viewer primitives across downstream routes, and S03 still owns final gallery/compare/share/export family coherence and assembled browser acceptance.

## Tasks

- [x] **T01: Add failing proof for the editorial homepage journey** `est:45m`
  - Why: The slice needs an executable contract for the real landing/results continuity before implementation so later redesign work stays anchored to R003/R009 and the existing diagnostics/privacy boundaries.
  - Files: `src/__tests__/app/home-editorial-flow.test.tsx`, `src/__tests__/components/results/ResultsView.live-proof.test.tsx`, `src/app/page.tsx`
  - Do: Add a new homepage flow test that asserts branded landing narrative, editorial continuity cues, generation entry affordances, and results-state continuity/back action behavior; update the existing live-proof assertions only where needed to reflect intentional branded results copy without weakening privacy-safe diagnostics requirements.
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
  - Done when: The new/updated tests fail for the current UI because the editorial landing/results journey and branded continuity cues do not exist yet, while the expected privacy/diagnostics contract is explicit.
- [x] **T02: Redesign the landing and generation entry as an editorial branded surface** `est:1h 30m`
  - Why: S01 only succeeds if the actual homepage empty state explains the product clearly and turns the existing text/URL/data controls into a premium, branded launch surface rather than a sparse placeholder.
  - Files: `src/app/page.tsx`, `src/components/input/InputZone.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Shell.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
  - Do: Recompose the homepage landing state, shell, header, and metadata around a bold editorial gallery-luxe direction; keep the real input tabs and progress flow intact; introduce or normalize shared surface/action utility classes needed by the redesigned controls and hero framing; preserve keyboard-usable submission and truthful local/private messaging.
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx`
  - Done when: The homepage empty state visibly communicates the brand/value proposition, presents the real generation controls inside the new editorial composition, and the landing-side assertions pass.
- [x] **T03: Reframe ResultsView and adjacent actions into the same premium system** `est:1h 45m`
  - Why: The slice’s core risk is landing/results discontinuity; this task closes that seam by making the real results experience feel like the same product while preserving diagnostics, privacy, and action clarity.
  - Files: `src/components/results/ResultsView.tsx`, `src/components/results/ExportControls.tsx`, `src/components/results/ShareButton.tsx`, `src/components/gallery/GallerySaveModal.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  - Do: Redesign the results composition, back/regenerate framing, and action clusters with the same editorial language as landing; normalize undefined classes or replace them with explicit tokens; keep proof diagnostics and privacy messaging visible; ensure save/share/export states and the save modal inherit the new branded system.
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
  - Done when: The homepage-to-results seam reads as one branded journey in tests, results actions/modal styling no longer depends on undefined semantics, and diagnostics/privacy assertions still pass.
- [x] **T04: Prove the real browser journey and operational truthfulness** `est:1h`
  - Why: S01 is not done until the redesigned flow is exercised through the real entrypoint, including truthful handling of runtime dependency limits that still exist outside the slice.
  - Files: `src/app/page.tsx`, `src/components/results/ResultsView.tsx`, `.gsd/milestones/M003/slices/S01/S01-SUMMARY.md`
  - Do: Run targeted tests and build, start the app, exercise landing → generate → results in the browser, assert branded continuity and visible diagnostics/action surfaces, and capture truthful evidence for the current URL no-DB failure posture so future agents can localize it quickly.
  - Verify: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx && npm run build` plus explicit browser assertions against `http://localhost:3000`
  - Done when: The real browser flow demonstrates the slice demo, operational verification passes, and the remaining URL dependency limit is visible as an honest runtime diagnostic rather than hidden failure.

## Files Likely Touched

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/Shell.tsx`
- `src/components/layout/Header.tsx`
- `src/components/input/InputZone.tsx`
- `src/components/results/ResultsView.tsx`
- `src/components/results/ExportControls.tsx`
- `src/components/results/ShareButton.tsx`
- `src/components/gallery/GallerySaveModal.tsx`
- `src/__tests__/app/home-editorial-flow.test.tsx`
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx`
