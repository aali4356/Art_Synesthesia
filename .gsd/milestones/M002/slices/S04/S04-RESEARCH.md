# M002 / S04 — Research

**Date:** 2026-03-11

## Summary

S04 owns the live acceptance gap for M002: prove in the actual browser that the upgraded art system is visibly stronger across the existing generation flows, not just in unit tests. Based on the current code, this slice primarily supports **R001** (rich, non-repetitive palette families), **R002** (emotionally expressive synesthetic mapping), and **R005** (credible launch-facing quality proof). It does not need a broad UI redesign; it needs trustworthy browser-level evidence that the text, URL, and data flows surface the S01-S03 work clearly enough to justify milestone closeout.

The good news is the core runtime seam is already there. `src/app/page.tsx` fans text, URL, and data into one `ResultsView`, and `ResultsView` already builds all four scene graphs from the live pipeline result. Organic and typographic are the key proof targets because S03 already made them mapping-aware via `interpretRendererExpressiveness()`. The strongest research finding is that S04 should treat this as an acceptance-and-observability slice, not a net-new architecture slice: browser work should exercise real flows, compare visibly distinct inputs/styles, and preserve inspectable proof surfaces if the live output is underwhelming.

There is also one important blocker/risk already visible in current operational verification: the targeted S03/S04 test suites pass, but `npm run build` currently fails on a TypeScript mismatch in `src/lib/render/expressiveness.ts` because `HARMONY_SPREAD` includes harmony keys not present in `HarmonyType` (`monochromatic`, `tetradic`, and camelCase `splitComplementary` vs hyphenated `split-complementary`). S04 research should record this because milestone closeout requires operational verification, and browser proof alone is not enough if build remains broken.

## Recommendation

Take a browser-proof-first execution path with a small amount of supporting runtime instrumentation only if needed. The slice should:

1. Start the local app and verify the real `http://localhost:3000` flow in browser tools.
2. Exercise all three input paths already wired in `src/app/page.tsx`:
   - **Text** input -> verify at least organic + typographic visibly reflect richer mapping/posture
   - **URL** input -> verify snapshot/live analysis still reaches results cleanly and produces visibly distinct art from text fixtures
   - **Data** input -> verify data path reaches results, organic remains available, and typographic is visibly/semantically disabled as intended
3. Use multiple deliberately contrasting fixtures so the proof is not “one nice render” but evidence of reduced repetition and stronger expression.
4. Finish with explicit browser assertions and, ideally, durable artifacts such as screenshots/debug bundle for milestone closeout.
5. Fix or account for the build blocker before claiming slice completion, because milestone verification classes explicitly include `npm run build`.

This slice should avoid over-investing in new UI chrome unless live verification shows the existing result surface hides the improvements. The current result architecture already exposes the necessary styles; the main risk is insufficient visual legibility or poor evidence capture, not missing plumbing.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Multi-input browser proof | `src/app/page.tsx` + `ResultsView` shared result surface | Text, URL, and data already converge through one runtime seam, so S04 can verify the actual product flow instead of inventing a demo harness |
| Mapping-to-renderer diagnosis | `PaletteResult.mapping` + `OrganicSceneGraph.expressiveness` + `TypographicSceneGraph.expressiveness` | These are already the authoritative inspection surfaces from S02/S03 and are better for debugging than subjective screenshot-only inspection |
| Style-level live comparison | `StyleSelector` thumbnails + style switching in `ResultsView` | The app already renders cross-style previews without new APIs |
| URL fetch behavior | `/api/analyze-url` snapshot/live route | Live browser verification should reuse the real route, including cache/rate-limit behavior, rather than mock URL analysis |
| Acceptance evidence | browser assertions/debug bundle/screenshots | Gives durable proof for milestone closeout without adding custom artifact code first |

## Existing Code and Patterns

- `src/app/page.tsx` — The live entrypoint for S04. Text, URL, and data flows are all already connected here, adapted into a shared `PipelineResult` shape for `ResultsView`.
- `src/components/results/ResultsView.tsx` — The main acceptance surface. It builds all four style scenes from a live pipeline result, switches styles, and handles the key user-visible proof surface for this slice.
- `src/components/results/StyleSelector.tsx` — Existing live thumbnail strip. Useful for browser-visible evidence that multiple styles are not collapsing into the same feel.
- `src/hooks/useTextAnalysis.ts` — Pure client-side text pipeline; deterministic and ideal for repeatability checks in browser.
- `src/hooks/useUrlAnalysis.ts` — URL pipeline calling `/api/analyze-url`; relevant for proving real network-backed generation works in browser.
- `src/hooks/useDataAnalysis.ts` — Client-side data pipeline. Important caveat: typographic remains intentionally unavailable here.
- `src/lib/render/expressiveness.ts` — Single source of truth for mapping-to-renderer posture. If browser output looks too similar, inspect here before changing scene builders.
- `src/lib/render/organic/scene.ts` — Organic scene composition already consumes `interpretRendererExpressiveness()` for density, layering, direction, and atmosphere.
- `src/lib/render/typographic/scene.ts` — Typographic scene composition already consumes the same expressiveness seam for density, hierarchy, rotation, font variety, and placement bias.
- `src/app/api/analyze-url/route.ts` — Real URL analysis endpoint with snapshot/live behavior and hourly rate limiting; S04 browser testing must respect this runtime behavior.

## Constraints

- **S04 supports active requirements R001, R002, and R005.** The slice must prove reduced repetition and stronger mapping/renderer expression in the real browser, not just restate prior tests.
- **Browser proof must use the real app flow at `http://localhost:3000`.** The milestone context explicitly defines local dev browser verification as the entry environment.
- **Determinism still matters.** Text and URL fixtures are good candidates for repeated checks; data fixtures need care because current data-flow seeding is based on `raw.trim()` and known to be less canonical than vector/mapping diagnostics.
- **Data input cannot be used as a typographic proof path.** `ResultsView` explicitly sets typographic scene to `null` for `inputType === 'data'`, and `StyleSelector` disables typographic when the input type is data.
- **URL live mode is intentionally non-stable.** `UrlInput` warns that live mode re-fetches on every request and art may change; snapshot mode is the better determinism proof path.
- **Operational verification is currently blocked by a build error.** `npm run build` fails in `src/lib/render/expressiveness.ts` because the harmony key set does not match `HarmonyType` from `src/lib/color/harmony.ts`.
- **Current landing/results UI is functional but not especially curated for art review.** S04 may need lightweight acceptance-oriented framing or comparison affordances if the live differences are hard to perceive, but only after browser proof confirms that this is actually the bottleneck.

## Common Pitfalls

- **Using only one attractive input as proof** — That can accidentally prove “the app can sometimes make nice art,” not that repetition is reduced. Use contrasting fixtures across at least text, URL, and data, and inspect more than one style.
- **Trying to prove data with typographic style** — The code intentionally disables typographic for data inputs. Treat that as a product boundary to verify, not a bug.
- **Judging failures only from pixels** — If organic or typographic outputs feel flat, inspect `palette.mapping` and scene `expressiveness` first; otherwise you risk thrashing on canvas details without knowing whether mapping is even reaching the renderer.
- **Using URL live mode for determinism checks** — Live mode explicitly re-fetches each time, so it is for freshness behavior, not stable visual comparison.
- **Ignoring the build regression because browser proof works** — Milestone verification still requires `npm run build`; S04 should not close without that operational class addressed.
- **Assuming the main canvas is reusable for gallery-save evidence as-is** — `ResultsView` has `captureCurrentThumbnail()`, but `mainCanvasRef` is never attached to a rendered canvas. If S04 needs saved-gallery proof or thumbnail-derived evidence, that seam may need correction.

## Open Risks

- The live app may technically surface the richer scenes but still not make the differences visually legible enough for a convincing milestone closeout, especially if the current layout/framing understates the artwork.
- The lack of built-in browser-facing diagnostics for `palette.mapping` and scene `expressiveness` may slow debugging if the live outputs look repetitive; current observability exists in code/tests, not yet in UI.
- URL proof depends on network/runtime conditions and a 10-per-hour per-IP limit on `/api/analyze-url`, so S04 fixture selection should be deliberate and low-volume.
- The build error in `src/lib/render/expressiveness.ts` can block full operational closeout even if browser acceptance succeeds.
- Data flow seed asymmetry can produce confusing near-equivalent comparisons if fixtures differ only in whitespace/newlines.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js | `wshobson/agents@nextjs-app-router-patterns` | available — promising if S04 needs deeper App Router-specific browser/runtime patterns; install with `npx skills add wshobson/agents@nextjs-app-router-patterns` |
| React / Next.js performance patterns | `vercel-labs/agent-skills@vercel-react-best-practices` | already installed locally as `vercel-react-best-practices` |
| Vitest | `onmax/nuxt-skills@vitest` | available but lower-priority/relevance for this slice; install with `npx skills add onmax/nuxt-skills@vitest` |
| Frontend UI work | `frontend-design` | already installed locally and relevant if S04 requires small acceptance-surface polish |
| Debugging | `debug-like-expert` | already installed locally; use if browser proof exposes a non-obvious live/runtime discrepancy |

## Sources

- S04 must primarily advance **R001**, **R002**, and **R005** because those are the active requirements tied to palette richness, expressive mapping, and launch-quality proof in this milestone context. (source: preloaded `.gsd/REQUIREMENTS.md`)
- The milestone defines S04 as the slice that retires the “visual-proof gap” through browser-level verification in the actual app interface. (source: preloaded `.gsd/milestones/M002/M002-ROADMAP.md`)
- `src/app/page.tsx` shows that text, URL, and data flows already converge into one live result surface, so S04 can verify the real app instead of building a separate proof harness. (source: `src/app/page.tsx`)
- `src/components/results/ResultsView.tsx` already builds all four scene graphs from a live pipeline result and is therefore the main browser acceptance seam. (source: `src/components/results/ResultsView.tsx`)
- `src/components/results/StyleSelector.tsx` already renders live thumbnails and disables typographic for data input, making that behavior part of the intended S04 proof surface. (source: `src/components/results/StyleSelector.tsx`)
- Organic and typographic scene builders already consume the shared expressiveness seam; S04 does not need new renderer architecture to prove the live result. (source: `src/lib/render/organic/scene.ts`, `src/lib/render/typographic/scene.ts`, `src/lib/render/expressiveness.ts`)
- URL proof must respect real runtime behavior: snapshot mode uses cached fetch results, live mode re-fetches, and `/api/analyze-url` enforces 10 requests per IP per hour. (source: `src/components/input/UrlInput.tsx`, `src/app/api/analyze-url/route.ts`)
- The current slice-gate-adjacent suites pass: hooks, renderer expressiveness, and style selector runtime compatibility all succeeded locally. (source: `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/components/StyleSelector.test.tsx src/__tests__/render/organic-scene.test.ts src/__tests__/render/typographic-scene.test.ts`)
- Operational verification is not yet clean: `npm run build` fails with a TypeScript error because `HARMONY_SPREAD` in `src/lib/render/expressiveness.ts` does not match the actual `HarmonyType` union in `src/lib/color/harmony.ts`. (source: `npm run build`, `src/lib/render/expressiveness.ts`, `src/lib/color/harmony.ts`)
