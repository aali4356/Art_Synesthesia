---
estimated_steps: 23
estimated_files: 8
skills_used:
  - react-best-practices
  - test
---

# T02: Instrument generation, continuity, and results-loop client events

Wire the new helper into the highest-signal client product loop: text/URL/data generation, homepage continuity actions, recent-local save/resume failures, and results-surface style/save interactions. This closes the repeat-use usage story without touching public-route persistence yet.

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

## Inputs

- ``src/hooks/useTextAnalysis.ts` — text generation lifecycle seam.`
- ``src/hooks/useUrlAnalysis.ts` — URL generation, quota, and network failure seam.`
- ``src/hooks/useDataAnalysis.ts` — client-only data generation and parse failure seam.`
- ``src/app/page.tsx` — homepage orchestration for fresh/resumed continuity behavior.`
- ``src/hooks/useRecentWorks.ts` — browser-local save/reopen/remove failure seam from S01.`
- ``src/components/results/ResultsView.tsx` — style switching and save-to-local results action hub.`
- ``src/__tests__/app/anonymous-continuity.test.tsx` — existing continuity regression seam.`
- ``src/__tests__/components/results/ResultsView.live-proof.test.tsx` — existing results proof seam to preserve.`

## Expected Output

- ``src/hooks/useTextAnalysis.ts` — text generation telemetry calls.`
- ``src/hooks/useUrlAnalysis.ts` — URL generation/failure telemetry calls.`
- ``src/hooks/useDataAnalysis.ts` — data generation/failure telemetry calls.`
- ``src/app/page.tsx` — continuity action instrumentation at the real homepage seam.`
- ``src/hooks/useRecentWorks.ts` — recent-local save/resume/remove failure instrumentation.`
- ``src/components/results/ResultsView.tsx` — safe results-loop interaction instrumentation.`
- ``src/__tests__/observability/product-loop-events.test.tsx` — regression coverage for generation/continuity events.`
- ``src/__tests__/app/anonymous-continuity.test.tsx` — preserved continuity contract under the new instrumentation.`

## Verification

npm test -- --run src/__tests__/observability/product-loop-events.test.tsx src/__tests__/app/anonymous-continuity.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx

## Observability Impact

- Signals added/changed: `generation_started`, `generation_completed`, `generation_failed`, `recent_local_saved`, `recent_local_resumed`, `recent_local_removed`, and `recent_local_save_failed` plus safe results interaction events.
- How a future agent inspects this: run the focused event test file and use the results/home continuity UI to confirm visible save/resume/error states.
- Failure state exposed: rate-limit, network, and storage failures become categorized instead of silent or text-only.
