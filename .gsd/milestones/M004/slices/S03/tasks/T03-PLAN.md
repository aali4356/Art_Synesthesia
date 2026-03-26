---
estimated_steps: 24
estimated_files: 9
skills_used:
  - best-practices
  - test
---

# T03: Instrument public-route actions, route-handler failures, and truthful unavailable states

Extend the observability contract to public actions and server boundaries: share creation/copy, gallery save, export, URL-analysis route failures, and branded unavailable states for no-DB proof mode. This task closes the inspectable failure story for R007.

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

## Inputs

- ``src/components/results/ShareButton.tsx` — public share action seam.`
- ``src/components/results/ExportControls.tsx` — export request/success/failure seam.`
- ``src/components/gallery/GallerySaveModal.tsx` — public gallery save request/failure seam.`
- ``src/app/api/analyze-url/route.ts` — highest-risk route-handler failure seam.`
- ``src/app/api/share/route.ts` — DB-backed public share persistence seam.`
- ``src/app/api/gallery/route.ts` — public gallery persistence and unavailable seam.`
- ``src/app/api/render-export/route.ts` — export API failure/diagnostic seam.`
- ``src/components/viewers/BrandedViewerScaffold.tsx` — shared truthful unavailable-state display seam.`

## Expected Output

- ``src/components/results/ShareButton.tsx` — safe share/copy telemetry calls.`
- ``src/components/results/ExportControls.tsx` — export telemetry calls.`
- ``src/components/gallery/GallerySaveModal.tsx` — gallery save telemetry calls.`
- ``src/app/api/analyze-url/route.ts` — categorized server failure capture.`
- ``src/app/api/share/route.ts` — categorized share route failure capture.`
- ``src/app/api/gallery/route.ts` — categorized gallery route failure capture.`
- ``src/app/api/render-export/route.ts` — categorized export route failure capture.`
- ``src/components/viewers/BrandedViewerScaffold.tsx` — measurable truthful unavailable-state instrumentation.`
- ``src/__tests__/observability/public-route-failures.test.tsx` — regression coverage for public-action and unavailable-state observability.`

## Verification

npm test -- --run src/__tests__/observability/public-route-failures.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx

## Observability Impact

- Signals added/changed: `share_link_created`, `share_link_failed`, `share_link_copied`, `gallery_save_created`, `gallery_save_failed`, `export_requested`, `export_succeeded`, `export_failed`, and `unavailable_state_viewed` plus categorized route-handler error capture.
- How a future agent inspects this: run the public-route event suite, inspect branded unavailable-state UI, and review safe tags in the shared server helper.
- Failure state exposed: no-DB proof mode, invalid requests, clipboard failures, and route-handler exceptions now land in stable categories instead of ad hoc copy only.
