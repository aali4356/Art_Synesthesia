# S09: Export & Accessibility — UAT

**Milestone:** M001
**Written:** 2026-03-11

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: this slice’s acceptance is primarily expressed through deterministic code paths, explicit API contracts, accessibility labels, and unit-tested export behavior rather than subjective visual polish or human-only workflows.

## Preconditions

- Repository dependencies installed
- Test environment can run `npm run test:run`
- No browser session is required for core proof because export/accessibility behavior is covered by deterministic Vitest tests and direct route invocation

## Smoke Test

Run `npm run test:run -- --reporter=dot` and confirm all tests pass, including `render-export`, `ExportControls`, alt-text, and updated canvas accessibility suites.

## Test Cases

### 1. PNG export request succeeds for a supported style

1. Run the export route tests or invoke `POST /api/render-export` with `style: "particle"`, `format: "png"`, `frame: true`, `resolution: 4096`.
2. Inspect the response headers.
3. **Expected:** HTTP 200, `content-type: image/png`, attachment filename ends in `.png`, and headers include `x-export-resolution=4096`, `x-export-frame=true`, and `x-export-alt` with descriptive artwork text.

### 2. SVG export is limited to vector-capable styles

1. Invoke `POST /api/render-export` with `style: "geometric"`, `format: "svg"`, `resolution: 4096`.
2. Confirm the response body contains SVG markup.
3. Invoke the same endpoint with `style: "organic"`, `format: "svg"`.
4. **Expected:** Geometric request succeeds with downloadable SVG; organic request fails with HTTP 400 and a JSON error that clearly states SVG is unsupported for that style.

### 3. Canvas accessibility labels are parameter-driven

1. Run component tests for the canvas renderers.
2. Inspect the rendered `aria-label` strings.
3. **Expected:** each canvas uses descriptive alt text beginning with its style-specific lead-in and continuing with parameter-derived description rather than a static label.

### 4. Export UI defaults to framed high-resolution output

1. Run `ExportControls` component tests.
2. Trigger the default export action for geometric style.
3. Inspect the submitted request payload.
4. **Expected:** `resolution` is `4096`, `frame` is `true`, format defaults to `png`, and SVG appears as an option only for supported vector styles.

## Edge Cases

### Unsupported format/style combination

1. Submit an SVG export request for `organic` or `particle` style.
2. **Expected:** the API returns a structured 400 response with an actionable error string instead of a silent or generic failure.

### Invalid export resolution

1. Submit an export request with `resolution: 2048`.
2. **Expected:** the API rejects the request with HTTP 400 and an explicit message that only 4096×4096 exports are supported.

## Failure Signals

- Missing `x-export-*` headers on successful responses
- Static canvas aria-labels that do not reflect parameter-derived alt text
- SVG option appearing for unsupported styles in the export UI
- Export API returning 200 for unsupported SVG requests
- Resolution other than 4096 being accepted without error
- Test suite regressions in `render-export`, `ExportControls`, or canvas accessibility tests

## Requirements Proved By This UAT

- EXPORT-01 — proves the application can request and return 4096 PNG exports through the server export API
- EXPORT-02 — proves SVG export support exists for vector styles and is rejected for unsupported styles
- EXPORT-03 — proves the export frame toggle is part of the request contract
- EXPORT-04 — proves frame is enabled by default in the export UI while remaining an export-only control
- A11Y-01 — proves parameter-derived alt text is used on canvas aria-labels and surfaced by the export route diagnostics

## Not Proven By This UAT

- EXPORT-05 — this UAT does not prove the export path always completes under 3 seconds in production conditions
- A11Y-02 — this UAT does not prove full end-to-end keyboard navigation across every interactive surface in the application
- Embedded PNG metadata inside a real rasterized PNG binary is not proven by this UAT; only the current export contract and diagnostics are proven
- Human-perceived export visual quality is not proven here because verification is artifact-driven rather than screenshot-based

## Notes for Tester

The strongest evidence for this slice is in the deterministic tests, especially `src/__tests__/api/render-export.test.ts`, `src/__tests__/components/ExportControls.test.tsx`, and the updated canvas accessibility suites. The current PNG route proves the export contract and diagnostics surface, but it is still a thin implementation for actual raster content and should be treated as a milestone-complete contract rather than the final production-quality encoder.
