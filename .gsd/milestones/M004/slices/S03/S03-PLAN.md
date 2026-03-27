# S03: Privacy-filtered observability and accessibility breadth

**Goal:** Add privacy-filtered observability and keyboard/focus accessibility coverage across the repeat-use product loop so configured analytics/error tools can inspect real usage and failures without violating the private-first contract.
**Demo:** After this: Core product-loop events and failures are inspectable in configured analytics/error-monitoring tools, and the new continuity/onboarding surfaces remain keyboard-usable with truthful branded fallback behavior.

## Tasks
- [x] **T01: Verified the env-gated observability privacy seam already satisfies the T01 contract.** — Create the shared observability seam that every later task can call without duplicating privacy rules. This task should introduce the env-optional provider/helper structure, central event taxonomy, and defensive redaction/filtering contract before any product surface starts emitting signals.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| PostHog / Sentry SDK init | Fall back to no-op provider/helpers so the app still renders with no env vars set. | Skip capture and keep the UI/runtime path unchanged. | Drop the payload and record only a local debug-safe classification, never raw values. |
| Environment config | Treat missing keys as observability-disabled, not a runtime failure. | Keep providers inert and avoid retry loops. | Ignore invalid config values and default to disabled/manual capture only. |

## Load Profile

- **Shared resources**: browser SDK event queues and route-handler error capture hooks.
- **Per-operation cost**: one provider mount plus lightweight property filtering/manual capture helpers.
- **10x breakpoint**: event spam from downstream callers; the shared taxonomy/filtering seam must make sampling and drop behavior easy before launch traffic increases.

## Negative Tests

- **Malformed inputs**: telemetry payloads containing `inputText`, canonical URLs, dataset bodies, or gallery preview text are stripped or rejected.
- **Error paths**: missing env vars and disabled SDK setup leave the app runnable with no thrown initialization errors.
- **Boundary conditions**: intentional local no-DB proof-mode errors are tagged distinctly so later tasks can filter them from incident noise.

## Steps

1. Add the required analytics/error-monitoring dependencies and create one shared observability module family under `src/lib/observability/` for event names, privacy filtering, and client/server capture helpers.
2. Add an env-gated provider composition seam in the root app layout so PostHog pageviews/manual capture can turn on only when configured and remain inert otherwise.
3. Encode the privacy contract centrally: strip raw source fields, canonical URLs, dataset bodies, preview hints, and any replay-grade properties before a payload is sent or error context is attached.
4. Add focused tests proving the redaction/no-env contract before downstream task wiring begins.

## Must-Haves

- [ ] Missing telemetry env vars keep the app bootable and leave observability as a no-op.
- [ ] One shared helper owns event names and payload redaction so later tasks cannot drift.
- [ ] The test seam proves unsafe properties are stripped before any SDK receives them.
  - Estimate: 1h
  - Files: package.json, src/app/layout.tsx, src/components/observability/ObservabilityProvider.tsx, src/lib/observability/events.ts, src/lib/observability/privacy.ts, src/lib/observability/client.ts, src/lib/observability/server.ts, src/__tests__/observability/privacy-filtering.test.ts
  - Verify: npm test -- --run src/__tests__/observability/privacy-filtering.test.ts
- [x] **T02: Added privacy-filtered client telemetry for generation flows, recent-local continuity actions, and results-loop style/save interactions.** — Wire the new helper into the highest-signal client product loop: text/URL/data generation, homepage continuity actions, recent-local save/resume failures, and results-surface style/save interactions. This closes the repeat-use usage story without touching public-route persistence yet.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Client observability helpers | Continue the generation/continuity action without blocking the UI. | Drop the event and preserve the existing UX state. | Sanitize and downgrade to a minimal failure category before capture. |
| URL analysis fetch / localStorage continuity helpers | Surface the existing user-facing error state and add a categorized failure event. | Preserve current timeout/error UI and emit only safe metadata. | Record failure kind plus source kind/status bucket, never the raw body. |

## Load Profile

- **Shared resources**: browser event queue, localStorage continuity seam, and URL-analysis network flow.
- **Per-operation cost**: one manual event per major user action or failure branch.
- **10x breakpoint**: repeated generation/style-switch activity could spam analytics if events are not constrained to high-signal transitions only.

## Negative Tests

- **Malformed inputs**: empty text/url/data attempts and unavailable recent-work storage still emit only category-level failures.
- **Error paths**: rate limit, network failure, and recent-local save failure are captured without leaking the original source payload.
- **Boundary conditions**: resumed work versus fresh results remain distinguishable in telemetry so browser-local continuity is not flattened into public-route usage.

## Steps

1. Add manual capture calls in `useTextAnalysis`, `useUrlAnalysis`, and `useDataAnalysis` for started/completed/failed generation with safe source-kind, mode, timing, and status metadata only.
2. Instrument homepage continuity actions in `src/app/page.tsx` and `src/hooks/useRecentWorks.ts` for recent-local save, resume, remove, and failure states while preserving the browser-local/private contract from S01/S02.
3. Instrument results-surface interactions in `src/components/results/ResultsView.tsx` for style changes and recent-local save intent without turning low-value UI hover state into telemetry noise.
4. Add focused tests that assert the emitted client event taxonomy and redaction behavior across generation and continuity flows.

## Must-Haves

- [ ] Text, URL, and data generation each emit started/completed/failed events with safe metadata only.
- [ ] Recent-local save/resume/error actions are visible without exposing stored source content.
- [ ] Results interactions preserve the distinction between fresh and resumed browser-local continuity.
  - Estimate: 1h 15m
  - Files: src/hooks/useTextAnalysis.ts, src/hooks/useUrlAnalysis.ts, src/hooks/useDataAnalysis.ts, src/app/page.tsx, src/hooks/useRecentWorks.ts, src/components/results/ResultsView.tsx, src/__tests__/observability/product-loop-events.test.tsx, src/__tests__/app/anonymous-continuity.test.tsx
  - Verify: npm test -- --run src/__tests__/observability/product-loop-events.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx
- [x] **T03: Added privacy-filtered public-route telemetry and categorized server failure capture for share, gallery, export, and unavailable-state flows.** — Extend the observability contract to public actions and server boundaries: share creation/copy, gallery save, export, URL-analysis route failures, and branded unavailable states for no-DB proof mode. This task closes the inspectable failure story for R007.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Route handlers (`/api/analyze-url`, `/api/share`, `/api/gallery`, `/api/render-export`) | Preserve the current HTTP/user-facing error while capturing a categorized server failure. | Emit timeout/failure classification with route family and status bucket only. | Record malformed body/response class and return the existing 4xx/5xx path without exposing request content. |
| Browser clipboard / public action fetches | Keep the current UI fallback message and capture only the safe action category. | Treat as action failure without retry storms. | Drop unsafe payload fields and store only action/result classification. |
| No-DB local proof mode | Render the existing truthful unavailable state and tag it as expected local-proof unavailability, not a generic production incident. | Keep the branded fallback visible. | Filter the known local-proof backend message into a stable unavailable-state category. |

## Load Profile

- **Shared resources**: route-handler execution, DB-backed persistence boundaries, export rendering, and third-party error-monitoring quota.
- **Per-operation cost**: one manual event/error capture per public action or failed request branch.
- **10x breakpoint**: analyze-url and public save routes will hit rate limits and error quota first if failures are not bucketed and filtered.

## Negative Tests

- **Malformed inputs**: invalid JSON, invalid URL, missing share/gallery fields, and unsupported export formats are categorized without leaking request bodies.
- **Error paths**: clipboard rejection, network failure, rate limit, DB unavailable, and route-handler exceptions remain truthful in the UI and inspectable in telemetry.
- **Boundary conditions**: unavailable-state views in local proof mode are measured but filtered away from high-severity incident noise.

## Steps

1. Instrument `ShareButton`, `ExportControls`, and `GallerySaveModal` for request, success, copy, and failure events using only route family, style, status bucket, and continuity/public-mode metadata.
2. Add server capture/tagging in the key route handlers so URL analysis, share, gallery, and export failures are categorized consistently, with explicit filtering for intentional local no-DB proof mode.
3. Instrument the branded unavailable-state/viewer seam so gallery/share fallback renders remain measurable without logging raw diagnostics beyond the safe category needed for inspection.
4. Add focused tests that exercise the safe public-action taxonomy and the expected no-DB unavailable-state classification.

## Must-Haves

- [ ] Share, gallery save, export, and URL-analysis failures are inspectable with stable categories and no raw request content.
- [ ] Copy/share-success actions emit safe product-loop events for configured analytics.
- [ ] Intentional local no-DB unavailable states stay truthful and are tagged separately from real incidents.
  - Estimate: 1h 30m
  - Files: src/components/results/ShareButton.tsx, src/components/results/ExportControls.tsx, src/components/gallery/GallerySaveModal.tsx, src/app/api/analyze-url/route.ts, src/app/api/share/route.ts, src/app/api/gallery/route.ts, src/app/api/render-export/route.ts, src/components/viewers/BrandedViewerScaffold.tsx, src/__tests__/observability/public-route-failures.test.tsx
  - Verify: npm test -- --run src/__tests__/observability/public-route-failures.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx
- [x] **T04: Verified that the shared shell skip link, input tabs, and style selector already satisfy the keyboard-complete accessibility contract.** — Repair the keyboard and semantic gaps that are currently concentrated in the shared shell, input mode switcher, and style selector. This task should make users able to skip past navigation, understand the active input surface semantically, and change styles without a mouse.

## Negative Tests

- **Malformed inputs**: Arrow/Home/End/Tab key sequences on the input switcher and style selector keep focus/selection stable instead of breaking state.
- **Error paths**: disabled typographic style for data inputs stays non-interactive but still understandable to assistive tech.
- **Boundary conditions**: first render, resumed results, and data-input mode all keep active/disabled semantics truthful.

## Steps

1. Add a real skip link and focusable main target in `src/components/layout/Shell.tsx` so keyboard users can bypass the header/nav quickly.
2. Replace the partial tab semantics in `src/components/input/InputTabs.tsx` with a truthful native-button or fully wired tab pattern that matches `InputZone` behavior and keyboard expectations.
3. Convert `StyleSelector` from clickable ARIA-decorated containers into keyboard-operable native controls with explicit active/disabled state, including arrow-key support if true tab semantics are retained.
4. Add focused accessibility/regression tests that prove skip-link behavior, selector semantics, and the data-input disabled-state contract.

## Must-Haves

- [ ] The shell exposes a visible-on-focus skip link that lands on the main content target.
- [ ] Input mode switching is keyboard-usable and semantically truthful to assistive tech.
- [ ] Style selection no longer depends on mouse-only clickable containers.
  - Estimate: 1h 10m
  - Files: src/components/layout/Shell.tsx, src/components/input/InputTabs.tsx, src/components/input/InputZone.tsx, src/components/results/StyleSelector.tsx, src/__tests__/accessibility/keyboard-navigation.test.tsx, src/__tests__/components/StyleSelector.test.tsx, src/__tests__/app/home-editorial-flow.test.tsx
  - Verify: npm test -- --run src/__tests__/accessibility/keyboard-navigation.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/app/home-editorial-flow.test.tsx
- [x] **T05: Added real gallery-modal focus restoration, reduced-motion coverage, and a passing final slice verification/build/browser proof bundle.** — Close the remaining accessibility breadth gaps in the modal and global motion layer, then run the full regression bundle and browser proof for the slice. This task is the slice closeout gate for both R007 and R010.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Gallery save modal focus lifecycle | Keep the modal closable and surface the existing error text while restoring focus to the opener whenever possible. | Preserve Escape/close behavior and avoid trapping the user permanently. | Keep the modal open with a truthful alert/status rather than losing focus context. |
| Local dev/browser verification | Use an open port (3000 or 3004) and keep the runtime proof focused on real keyboard/failure behavior. | Retry on another open port rather than hardcoding one failing listener. | Capture the failing surface with targeted assertions/debug output before closing the slice. |

## Negative Tests

- **Malformed inputs**: Escape, Tab, Shift+Tab, and close-button interactions all preserve focus restoration and alert/status messaging.
- **Error paths**: gallery save failure and unavailable-state messaging remain readable inside the modal and public-route surfaces.
- **Boundary conditions**: reduced-motion preference disables ornamental transitions/hover lifts without breaking branded styling.

## Steps

1. Add initial focus, focus trap, Escape close, and focus restoration to `GallerySaveModal`, keeping its alert/status states screen-reader readable.
2. Add global reduced-motion overrides in `src/app/globals.css` for transition-heavy editorial surfaces touched in M004.
3. Add/update focused tests for the modal focus lifecycle and any cross-surface assertions needed to preserve product-family wording while the modal/shell behaviors change.
4. Run the full slice regression bundle plus `npm run build`, then perform live browser verification on an open local dev port to confirm safe telemetry, skip-link flow, selector keyboard behavior, modal focus trap, and truthful unavailable-state behavior.

## Must-Haves

- [ ] Opening the gallery modal moves focus inside, traps focus, closes on Escape, and restores focus to the opener.
- [ ] Reduced-motion preference suppresses editorial motion flourishes without stripping the branded layout.
- [ ] The slice closes with one passing regression/build bundle and live browser proof across the real Home → Results → Gallery/Share continuity surfaces.
  - Estimate: 1h 10m
  - Files: src/components/gallery/GallerySaveModal.tsx, src/app/globals.css, src/__tests__/gallery/save-modal.test.tsx, src/__tests__/app/shared-brand-surfaces.test.tsx, src/__tests__/app/product-family-coherence.test.tsx, src/__tests__/observability/product-loop-events.test.tsx, src/__tests__/accessibility/keyboard-navigation.test.tsx
  - Verify: npm test -- --run src/__tests__/gallery/save-modal.test.tsx src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/app/product-family-coherence.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/components/StyleSelector.test.tsx src/__tests__/observability/privacy-filtering.test.ts src/__tests__/observability/product-loop-events.test.tsx src/__tests__/observability/public-route-failures.test.tsx src/__tests__/accessibility/keyboard-navigation.test.tsx && npm run build
