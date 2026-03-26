---
id: T03
parent: S03
milestone: M004
provides: []
requires: []
affects: []
key_files: ["src/components/results/ShareButton.tsx", "src/components/results/ExportControls.tsx", "src/components/gallery/GallerySaveModal.tsx", "src/components/results/ResultsView.tsx", "src/app/api/analyze-url/route.ts", "src/app/api/share/route.ts", "src/app/api/gallery/route.ts", "src/app/api/render-export/route.ts", "src/components/viewers/BrandedViewerScaffold.tsx", "src/app/share/[id]/page.tsx", "src/app/gallery/[id]/page.tsx", "src/lib/observability/events.ts", "src/lib/observability/server.ts", "src/__tests__/observability/public-route-failures.test.tsx", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M004/slices/S03/tasks/T03-SUMMARY.md"]
key_decisions: ["Emit sanitized server-side route events through the shared server observability adapter as Sentry info messages while keeping exception capture for true failures.", "Treat analyze-url snapshot cache reads and writes as optional in local proof mode so DB cache loss does not break uncached URL analysis."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `npm test -- --run src/__tests__/observability/public-route-failures.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx` and it passed with 10/10 tests. Verified the new regression file covers safe client public-action payloads, categorized route failures, local-proof no-DB classification, and branded unavailable-state instrumentation. Ran LSP diagnostics across the touched implementation files and no diagnostics were reported."
completed_at: 2026-03-26T19:09:02.460Z
blocker_discovered: false
---

# T03: Added privacy-filtered public-route telemetry and categorized server failure capture for share, gallery, export, and unavailable-state flows.

> Added privacy-filtered public-route telemetry and categorized server failure capture for share, gallery, export, and unavailable-state flows.

## What Happened
---
id: T03
parent: S03
milestone: M004
key_files:
  - src/components/results/ShareButton.tsx
  - src/components/results/ExportControls.tsx
  - src/components/gallery/GallerySaveModal.tsx
  - src/components/results/ResultsView.tsx
  - src/app/api/analyze-url/route.ts
  - src/app/api/share/route.ts
  - src/app/api/gallery/route.ts
  - src/app/api/render-export/route.ts
  - src/components/viewers/BrandedViewerScaffold.tsx
  - src/app/share/[id]/page.tsx
  - src/app/gallery/[id]/page.tsx
  - src/lib/observability/events.ts
  - src/lib/observability/server.ts
  - src/__tests__/observability/public-route-failures.test.tsx
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M004/slices/S03/tasks/T03-SUMMARY.md
key_decisions:
  - Emit sanitized server-side route events through the shared server observability adapter as Sentry info messages while keeping exception capture for true failures.
  - Treat analyze-url snapshot cache reads and writes as optional in local proof mode so DB cache loss does not break uncached URL analysis.
duration: ""
verification_result: passed
completed_at: 2026-03-26T19:09:02.482Z
blocker_discovered: false
---

# T03: Added privacy-filtered public-route telemetry and categorized server failure capture for share, gallery, export, and unavailable-state flows.

**Added privacy-filtered public-route telemetry and categorized server failure capture for share, gallery, export, and unavailable-state flows.**

## What Happened

Instrumented ShareButton, ExportControls, and GallerySaveModal so they emit safe requested/completed-or-copied/failed observability events using only route family, style, continuity/public mode, status bucket, and failure category. Added a shared route capture seam in the server observability layer, wired it into /api/analyze-url, /api/share, /api/gallery, and /api/render-export, and classified malformed input, rate limits, unsupported formats, network/fetch failures, backend unavailability, and intentional local proof-mode DB gaps without forwarding raw request content. Also instrumented the branded unavailable-state seam and passed explicit safe categories from share/gallery detail fallbacks. While executing, I fixed a real local mismatch: analyze-url snapshot-cache failures now get captured and degrade to uncached analysis instead of aborting the route in no-DB proof mode. Added focused regression coverage for the public client-event taxonomy, route-handler failure capture, and unavailable-state classification.

## Verification

Ran `npm test -- --run src/__tests__/observability/public-route-failures.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx` and it passed with 10/10 tests. Verified the new regression file covers safe client public-action payloads, categorized route failures, local-proof no-DB classification, and branded unavailable-state instrumentation. Ran LSP diagnostics across the touched implementation files and no diagnostics were reported.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- --run src/__tests__/observability/public-route-failures.test.tsx src/__tests__/app/shared-brand-surfaces.test.tsx` | 0 | ✅ pass | 3590ms |


## Deviations

The task plan framed this as instrumentation work only, but the local code showed that `src/app/api/analyze-url/route.ts` still treated DB snapshot-cache failures as fatal. I changed that seam to capture the categorized failure and continue uncached analysis so local proof mode remains usable.

## Known Issues

None.

## Files Created/Modified

- `src/components/results/ShareButton.tsx`
- `src/components/results/ExportControls.tsx`
- `src/components/gallery/GallerySaveModal.tsx`
- `src/components/results/ResultsView.tsx`
- `src/app/api/analyze-url/route.ts`
- `src/app/api/share/route.ts`
- `src/app/api/gallery/route.ts`
- `src/app/api/render-export/route.ts`
- `src/components/viewers/BrandedViewerScaffold.tsx`
- `src/app/share/[id]/page.tsx`
- `src/app/gallery/[id]/page.tsx`
- `src/lib/observability/events.ts`
- `src/lib/observability/server.ts`
- `src/__tests__/observability/public-route-failures.test.tsx`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M004/slices/S03/tasks/T03-SUMMARY.md`


## Deviations
The task plan framed this as instrumentation work only, but the local code showed that `src/app/api/analyze-url/route.ts` still treated DB snapshot-cache failures as fatal. I changed that seam to capture the categorized failure and continue uncached analysis so local proof mode remains usable.

## Known Issues
None.
