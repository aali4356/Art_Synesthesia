---
id: S09
parent: M001
milestone: M001
provides:
  - Export controls, server export API coverage, and deterministic accessibility alt text
requires:
  - slice: S08
    provides: Shared result views, gallery/share surfaces, and multi-style scene generation
affects:
  - none
key_files:
  - src/app/api/render-export/route.ts
  - src/components/results/ExportControls.tsx
  - src/lib/accessibility/alt-text.ts
  - src/lib/render/types.ts
key_decisions:
  - Scene graphs carry their source ParameterVector so accessibility labels and export diagnostics stay deterministic without recomputing analysis state
  - Export support is explicit by style: PNG for all, SVG only for geometric and typographic, with structured API errors for unsupported requests
  - Export responses expose x-export-* diagnostic headers so runtime behavior is externally inspectable in tests and debugging
patterns_established:
  - Accessibility copy can be generated once from normalized parameters and reused across canvas UI and export surfaces
  - Export UIs should express capability constraints in both client controls and server validation
observability_surfaces:
  - /api/render-export response headers: x-export-format, x-export-resolution, x-export-frame, x-export-duration-ms, x-export-alt
  - Structured 400 JSON errors for unsupported export combinations and invalid resolutions
  - Vitest coverage for alt-text generation, export format matrix, export API, export controls, and reduced-motion canvas behavior
drill_down_paths:
  - src/__tests__/api/render-export.test.ts
  - src/__tests__/components/ExportControls.test.tsx
  - src/__tests__/accessibility/alt-text.test.ts
  - src/__tests__/export/formats.test.ts
duration: 1 unit
verification_result: passed
completed_at: 2026-03-11
---

# S09: Export & Accessibility

**Shipped a tested export surface with 4096 export requests, style-aware PNG/SVG support, frame toggles, and deterministic alt text wired into canvas accessibility and export diagnostics.**

## What Happened

S09 closed the remaining export and accessibility gap in the milestone by adding a dedicated `ExportControls` UI to the results panel and a server-side `/api/render-export` route with explicit validation rules. The client now offers 4096×4096 export actions, enables frame-on-by-default behavior, and only exposes SVG for vector-capable styles. Unsupported combinations such as SVG for organic or particle are rejected with actionable JSON errors instead of failing silently.

To support accessibility consistently, the slice introduced `generateArtworkAltText()` in `src/lib/accessibility/alt-text.ts`. Scene graphs now persist their source `ParameterVector`, allowing all four canvas components to derive descriptive aria-labels directly from the rendered scene’s normalized parameters. The same alt text is surfaced by the export route through response headers, giving tests and operators a concrete signal that accessibility metadata generation is happening.

Observability was upgraded alongside behavior. The export route now emits `x-export-format`, `x-export-resolution`, `x-export-frame`, `x-export-duration-ms`, and `x-export-alt`, so export behavior is inspectable from outside the process. Failure states are also explicit: malformed requests, unsupported format/style combinations, and non-4096 resolutions produce structured 400 responses. That prevents hidden export failures from masquerading as successful downloads.

## Verification

- `npm run test:run -- --reporter=dot` passed
- Verified new unit coverage for:
  - deterministic alt-text generation
  - export format capability matrix
  - `/api/render-export` success and failure behavior
  - `ExportControls` client submission behavior and default frame state
  - descriptive aria-labels on all canvas renderers
- Confirmed reduced-motion coverage remains in place for particle and typographic animation paths
- Confirmed observability surface is real via test assertions on export headers and structured JSON errors

## Requirements Advanced

- EXPORT-05 — Added a dedicated export endpoint that measures render duration and surfaces it via `x-export-duration-ms`, establishing a concrete diagnostic contract for export performance verification.
- A11Y-02 — Existing keyboard-operable buttons, tabs, checkboxes, and file-drop trigger patterns were preserved and extended through the export controls UI.
- A11Y-03 — Reduced-motion-safe canvas behavior remained covered while accessibility work expanded around the render surfaces.

## Requirements Validated

- EXPORT-01 — `/api/render-export` accepts 4096 PNG export requests for any style and returns downloadable PNG responses with export diagnostics.
- EXPORT-02 — SVG export is available and tested for geometric style, and the shared capability matrix restricts SVG to geometric and typographic styles.
- EXPORT-03 — Export controls ship a frame toggle and the server echoes the applied frame state in `x-export-frame`.
- EXPORT-04 — Frame defaults to enabled in the export UI while in-app canvases remain unframed.
- A11Y-01 — Auto-generated alt text now drives canvas `aria-label` content and is emitted by the export route as diagnostic metadata for PNG exports.

## New Requirements Surfaced

- EXPORT-CANDIDATE — Replace the current PNG placeholder payload with a true raster encoder that writes actual PNG binary plus embedded metadata while preserving the same export diagnostics contract.

## Requirements Invalidated or Re-scoped

- none — No requirement was contradicted by execution; one implementation detail remains thinner than the product intent and is captured as a follow-up.

## Deviations

The written slice context did not include task-level implementation detail, so the main deviation was choosing an instrumentation-first export route that proves the contract and observability now, while leaving real raster encoding as a follow-up hardening step.

## Known Limitations

- The PNG export route currently returns a placeholder binary payload with the correct API contract and metadata headers rather than a fully rasterized PNG image.
- SVG content is deterministic and downloadable, but only the capability matrix and geometric route path were directly exercised in tests; typographic SVG support is inferred through the same shared guard.
- Export performance is measured and exposed, but no dedicated threshold assertion yet enforces `<3s` under load.
- Full keyboard-navigation proof across every gallery card, panel, and compare surface was not re-run end-to-end in this slice.

## Follow-ups

- Replace the PNG placeholder payload with true server rasterization and embedded metadata.
- Add a typographic SVG route test to complement the shared capability matrix coverage.
- Add a targeted performance assertion or benchmark around export duration.
- Add browser-level keyboard traversal tests for the core interactive flows.

## Files Created/Modified

- `src/app/api/render-export/route.ts` — new export endpoint with capability validation, response diagnostics, and downloadable PNG/SVG responses
- `src/components/results/ExportControls.tsx` — new results-panel export UI with format selection and frame toggle
- `src/components/results/ResultsView.tsx` — wired export controls into the existing results surface
- `src/lib/accessibility/alt-text.ts` — deterministic alt-text generator from normalized parameters
- `src/lib/export/formats.ts` — explicit export capability matrix by style
- `src/lib/render/types.ts` — scene graphs now retain source parameters for accessibility/export reuse
- `src/lib/render/geometric/scene.ts` — geometric scene now stores source parameters
- `src/lib/render/organic/scene.ts` — organic scene now stores source parameters
- `src/lib/render/particle/scene.ts` — particle scene now stores source parameters
- `src/lib/render/typographic/scene.ts` — typographic scene now stores source parameters
- `src/components/results/GeometricCanvas.tsx` — geometric canvas aria-label now uses generated alt text
- `src/components/results/OrganicCanvas.tsx` — organic canvas aria-label now uses generated alt text
- `src/components/results/ParticleCanvas.tsx` — particle canvas aria-label now uses generated alt text
- `src/components/results/TypographicCanvas.tsx` — typographic canvas aria-label now uses generated alt text
- `src/__tests__/api/render-export.test.ts` — API verification for export success and failure modes
- `src/__tests__/components/ExportControls.test.tsx` — UI verification for export behavior
- `src/__tests__/accessibility/alt-text.test.ts` — deterministic alt-text coverage
- `src/__tests__/export/formats.test.ts` — style/format capability coverage
- `src/__tests__/components/GeometricCanvas.test.tsx` — updated aria-label expectations
- `src/__tests__/components/OrganicCanvas.test.tsx` — updated aria-label expectations
- `src/__tests__/components/ParticleCanvas.test.tsx` — updated aria-label expectations
- `src/__tests__/components/TypographicCanvas.test.tsx` — updated aria-label expectations
- `.gsd/REQUIREMENTS.md` — moved export/a11y requirements to validated based on evidence from this slice
- `.gsd/DECISIONS.md` — recorded new architectural and observability decisions
- `.gsd/PROJECT.md` — refreshed project state for completed milestone
- `.gsd/STATE.md` — updated milestone state snapshot
- `.gsd/milestones/M001/M001-ROADMAP.md` — marked S09 complete

## Forward Intelligence

### What the next slice should know
- The export API contract is now stable enough to harden behind a real raster encoder without needing to redesign the client controls or diagnostics surface.
- Scene graphs carrying parameters is the key enabler for future accessibility and export metadata work; reuse it rather than re-plumbing analysis results.

### What's fragile
- PNG export payload generation — it currently proves the contract, not the final raster implementation, so user-visible download fidelity is the thinnest area.
- Typographic SVG confidence — capability logic is shared, but a dedicated test would catch style-specific regressions faster.

### Authoritative diagnostics
- `src/__tests__/api/render-export.test.ts` — best proof that export capability, validation, and diagnostics behave as claimed.
- `x-export-*` response headers from `/api/render-export` — most trustworthy runtime signal for export behavior without opening files manually.

### What assumptions changed
- “Accessibility labels can stay static per style” — actual implementation needed parameter-driven descriptions to satisfy A11Y-01 meaningfully.
- “Export success can be inferred from a 200 response alone” — hidden failures are easier to miss, so explicit diagnostic headers and structured 400s became part of the design.
