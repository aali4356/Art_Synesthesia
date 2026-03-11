# S08: Gallery Compare — UAT

**Milestone:** M001
**Written:** 2026-03-11

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: this slice’s acceptance criteria were explicitly “unit tests prove gallery-compare works,” and the shipped behaviors are covered by API, component, and comparison-library tests with externally visible route responses and UI-state assertions.

## Preconditions

- Project dependencies installed.
- Test environment available.
- No live database is required for the acceptance path because slice verification uses mocked route-layer DB boundaries where appropriate.
- Run from repository root.

## Smoke Test

Run `npm test` and confirm the suite passes with 518 passing tests, including gallery, moderation, and compare test files.

## Test Cases

### 1. Save artwork to gallery with safe public preview

1. Run `npm test`.
2. Confirm `src/__tests__/api/gallery-save.test.ts` passes.
3. Confirm `src/__tests__/gallery/save-modal.test.tsx` passes.
4. **Expected:** save requests reject raw input, enforce preview length and profanity rules, and the modal shows editable/removable public preview fields before save.

### 2. Browse and inspect gallery items

1. Run `npm test`.
2. Confirm `src/__tests__/api/gallery-browse.test.ts` passes.
3. Confirm `src/__tests__/gallery/gallery-card.test.tsx` passes.
4. Confirm `src/__tests__/api/gallery-upvote.test.ts` passes.
5. **Expected:** browse API supports style and sort controls, cards hide preview by default, report button exists, and single-item detail/upvote behavior returns the expected payloads.

### 3. Compare two inputs side by side

1. Run `npm test`.
2. Confirm `src/__tests__/compare/diff.test.ts` passes.
3. Confirm `src/__tests__/compare/summary.test.ts` passes.
4. Confirm `src/__tests__/compare/compare-mode.test.tsx` passes.
5. **Expected:** compare mode renders two labeled inputs, two generate buttons, one shared style selector, sorted parameter diffs, and readable difference summaries.

### 4. Moderate reported gallery items

1. Run `npm test`.
2. Confirm `src/__tests__/moderation/db-report.test.ts` passes.
3. Confirm `src/__tests__/api/moderation.test.ts` passes.
4. **Expected:** reports increment counts, items become flagged at the threshold, admin review requires authorization, and deletion returns explicit success/not-found responses.

## Edge Cases

### Missing ownership token on delete

1. Review `src/__tests__/api/gallery-delete.test.ts`.
2. Confirm the missing-header case passes.
3. **Expected:** delete returns `401` with a clear error instead of silently succeeding.

### Compare summary for identical vectors

1. Review `src/__tests__/compare/summary.test.ts`.
2. Confirm the identical-vectors case passes.
3. **Expected:** summary reports that inputs are effectively identical instead of inventing differences.

### Moderation report for unknown item

1. Review `src/__tests__/moderation/db-report.test.ts`.
2. Confirm the missing-item case passes.
3. **Expected:** route returns `404` with a clear error.

## Failure Signals

- Any failure in the gallery/compare/moderation test files listed above.
- Save route accepting `rawInput` or overlong preview text.
- Delete route not distinguishing missing token vs mismatch.
- Compare mode not rendering both panes or allowing independent input text.
- Shared style selector not toggling a single active style.
- Report route not surfacing `reportCount`/`flagged` in the response.
- `npm run build` failing because of type errors would indicate a production-safety regression.

## Requirements Proved By This UAT

- GAL-01 — explicit opt-in gallery save with previewed public fields
- GAL-02 — editable/removable input preview before save
- GAL-03 — gallery thumbnails with metadata
- GAL-04 — hidden-by-default preview reveal behavior
- GAL-05 — gallery filter/sort and upvote-backed popularity path
- GAL-06 — gallery detail retrieval path
- GAL-07 — report button and report/admin review backend behavior
- GAL-08 — owner delete flow via creator token
- COMP-01 — two-input side-by-side compare UI
- COMP-02 — parameter diff computation and highlighting support
- COMP-03 — auto-generated diff summary text
- COMP-04 — shared style selector across both compared artworks

## Not Proven By This UAT

- Live browser polish, responsive feel, and end-to-end human interaction quality on `/gallery` and `/compare`
- Production build safety in environments that omit `DATABASE_URL`
- Server-side anti-abuse for repeated upvotes beyond client localStorage dedupe
- Real database connectivity, migrations, and deployment wiring

## Notes for Tester

This slice was accepted using artifact-driven evidence because the slice goal explicitly targeted test-proven functionality. If a human follow-up pass is desired, prioritize `/gallery`, `/gallery/[id]`, and `/compare` in a browser after configuring `DATABASE_URL`. Also note that `npm run build` currently still requires DB environment configuration because DB-backed route imports can initialize Neon during build-time analysis.
