# S01: Editorial landing, generation, and results journey — UAT

**Milestone:** M003
**Written:** 2026-03-11

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S01 changes both browser-visible product perception and real runtime behavior, so completion requires artifact-backed verification (tests/build) plus live localhost interaction to judge continuity, diagnostics visibility, and truthful failure handling.

## Preconditions

- Dependencies are installed.
- The app is runnable locally.
- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx` passes.
- `npm run build` passes.
- A local app instance is available at `http://localhost:3000`.

## Smoke Test

Open `http://localhost:3000` and confirm the homepage immediately reads as Synesthesia Machine’s editorial launch surface rather than a sparse utility form, with visible branded copy and real generation controls.

## Test Cases

### 1. Landing explains the product and offers real generation entry

1. Open `http://localhost:3000`.
2. Confirm the landing shows `Synesthesia Machine`.
3. Confirm branded framing such as `Private-first proofing`, `Compose from language`, and `Text, URL, and data enter the same gallery desk.` is visible.
4. Confirm the real input surface is present and usable.
5. **Expected:** A first-time visitor can understand what the product is, why it is distinct, and where to begin without leaving the homepage or encountering a disconnected marketing shell.

### 2. Text generation lands in a continuous editorial results experience

1. Stay on the homepage in text mode.
2. Enter a short prompt.
3. Submit generation.
4. Wait for the result to render.
5. Confirm the results stage shows `From source to proof`, `proof diagnostics`, `renderer expressiveness`, and `Collect, export, or share this edition.`
6. **Expected:** The results route feels like the same branded product surface as landing, and diagnostics/actions remain visible without exposing raw input inside the proof panel.

### 3. Save/share/export surfaces retain the branded system

1. After a successful text generation, inspect the action desk.
2. Confirm share/export/save actions are visibly present.
3. Open `Save to Gallery`.
4. Confirm messaging such as `Preview exactly what will be public before publishing this edition.` and `The full raw source is never included here.`
5. **Expected:** Adjacent action and modal surfaces inherit the same editorial system and preserve the product’s privacy posture.

## Edge Cases

### Local URL no-DB failure remains externally visible

1. Switch to URL mode on the homepage.
2. Submit a sample URL such as `https://example.com/reference-case` in a local no-DB environment.
3. Observe the visible error state.
4. Inspect browser network logs.
5. **Expected:** The UI surfaces a visible failure (`Unknown error` in the current implementation) and network logs show the underlying runtime issue as `POST /api/analyze-url` with status 500, so the limitation is inspectable rather than hidden.

## Failure Signals

- The homepage still reads like a sparse tool form or generic SaaS landing instead of an editorial launch surface.
- Text generation reaches a visually disconnected or obviously older results UI.
- `proof diagnostics`, `renderer expressiveness`, or action desk surfaces disappear after generation.
- Raw source text appears inside the proof diagnostics panel.
- Save/share/export controls are missing or styled like unrelated fallback components.
- URL mode fails silently or without inspectable network evidence.

## Requirements Proved By This UAT

- R003 — The real homepage and results experience now share an editorial gallery-luxe presentation in live browser use.
- R009 — The launch-facing homepage copy and framing clearly explain the product and how to begin.
- R004 — The highest-risk visitor journey seam from landing through results behaves as one branded experience in the real app.
- R005 — The homepage flow is now credible for a polished public demo at the localhost entrypoint.
- R010 — The redesigned journey preserves usable generation controls and visible privacy-safe diagnostics while increasing visual ambition.

## Not Proven By This UAT

- Full cross-route coherence for gallery, compare, share, and export-adjacent routes beyond the homepage/results journey.
- Launch-quality remediation for the URL local no-DB failure path; this UAT only proves the failure is visible and inspectable.
- Full accessibility breadth across all redesigned surfaces; this UAT only confirms core homepage controls and visible diagnostics remain usable in the exercised flow.

## Notes for Tester

The current local URL failure copy is still weak (`Unknown error`). Treat that as a known truthful limitation, not a hidden regression, as long as the UI failure is visible and browser network logs confirm the corresponding `POST /api/analyze-url` 500. The most important qualitative check is whether the landing and results states feel like one editorial product rather than a marketing veneer over an unchanged tool.
