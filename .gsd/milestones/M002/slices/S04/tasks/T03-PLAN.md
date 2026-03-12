---
estimated_steps: 4
estimated_files: 4
---

# T03: Execute browser proof run and capture milestone-closeout evidence

**Slice:** S04 — Live Art Quality Integration Proof
**Milestone:** M002

## Description

Exercise the actual app in the browser and record durable acceptance evidence. This task uses the real local runtime to prove the upgraded art system is visible across text, URL, and data flows, captures explicit assertions and artifacts, and writes the slice closeout documents that make the milestone state honest.

## Steps

1. Start the local app and run a deliberate browser proof sequence at `http://localhost:3000` using contrasting fixtures across text, URL, and data inputs, minimizing URL requests to stay within runtime limits.
2. Assert the expected live behaviors explicitly: each flow reaches results, organic and typographic visibly respond where supported, typographic stays disabled for data, and the acceptance diagnostics surface updates with current family/mapping/expressiveness state.
3. Capture durable evidence with screenshots and a debug bundle (and any supporting browser timeline/HAR data if needed), checking console/network health so the proof is not invalidated by hidden runtime failures.
4. Write the slice summary and UAT record with the exact proof path, artifacts, and judgment, then update state/roadmap to reflect truthful slice completion.

## Must-Haves

- [ ] Browser verification covers all three real input flows and records explicit acceptance outcomes instead of relying on narrative-only judgment.
- [ ] Slice artifacts document the final proof, artifact locations, and any nuance future agents should know when re-running acceptance.

## Verification

- Browser assertions and artifact capture against the running local app at `http://localhost:3000`
- Confirm no blocking console errors, failed critical requests, or missing diagnostics invalidate the acceptance run

## Observability Impact

- Signals added/changed: Durable debug bundle, screenshots, and browser assertion history tied to the real acceptance run.
- How a future agent inspects this: Read `S04-SUMMARY.md` / `S04-UAT.md`, open the referenced artifacts, and rerun the documented browser path.
- Failure state exposed: Browser-level regressions surface through assertion failures, console/network logs, and missing/incorrect proof metadata in the live UI.

## Inputs

- T02 runtime proof surface and passing build/tests — required before browser acceptance can be trusted.
- `src/app/page.tsx` + `src/components/results/ResultsView.tsx` — the real runtime entrypoint and results surface to exercise in browser.

## Expected Output

- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md` and `.gsd/milestones/M002/slices/S04/S04-UAT.md` — durable closeout evidence for the slice.
- Updated milestone/state artifacts that honestly mark S04 complete only after live browser proof passes.
