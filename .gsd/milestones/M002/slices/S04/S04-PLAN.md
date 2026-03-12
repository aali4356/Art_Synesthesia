# S04: Live Art Quality Integration Proof

**Goal:** Prove in the actual browser experience that the upgraded M002 art system surfaces materially richer, less repetitive, more art-directed live outputs across the existing text, URL, and data flows, with durable evidence suitable for milestone closeout.
**Demo:** A local browser verification run at `http://localhost:3000` shows contrasting text, URL, and data inputs reaching the real `ResultsView`, with organic and typographic styles visibly reflecting the S02/S03 mapping upgrades where supported, typographic correctly disabled for data, and captured artifacts/assertions documenting the acceptance proof.

## Must-Haves

- Browser-level proof must exercise the real text, URL, and data generation flows through `src/app/page.tsx` and `src/components/results/ResultsView.tsx`, not a fixture-only harness.
- At least one deterministic acceptance surface must make reduced repetition and stronger renderer expression inspectable across contrasting live inputs, especially for organic and typographic styles.
- The slice must preserve or improve agent-facing diagnostics so a future agent can localize weak live outputs using `PaletteResult.mapping`, scene `expressiveness`, browser assertions, and captured debug artifacts.
- Operational verification for this slice must include restoring a passing `npm run build`, since milestone closeout requires build health in addition to browser proof.
- The slice must leave durable closeout evidence: explicit browser assertions, saved screenshots/debug bundle, and updated slice artifacts describing the accepted proof path and constraints.

## Proof Level

- This slice proves: final-assembly
- Real runtime required: yes
- Human/UAT required: yes

## Verification

- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/components/StyleSelector.test.tsx`
- `npm run build`
- Local app running at `http://localhost:3000` verified with browser assertions covering text, URL, and data flows, style availability/disablement, and captured debug artifacts/screenshots for milestone evidence

## Observability / Diagnostics

- Runtime signals: stable live-proof metadata surfaced from the real result pipeline, including palette family/mapping diagnostics and renderer `expressiveness` posture for the currently rendered result.
- Inspection surfaces: browser-visible acceptance/proof surface in `ResultsView`, browser assertions/debug bundle artifacts, and existing hook/scene-builder test suites.
- Failure visibility: the live proof surface should reveal enough structured diagnostics to distinguish weak art direction from wiring failures (missing mapping, wrong input type behavior, unavailable style, build failure, or URL fetch/runtime error).
- Redaction constraints: do not expose raw private input contents, secrets, or fetched page bodies in durable proof artifacts; diagnostics should stay at derived family/mood/posture level.

## Integration Closure

- Upstream surfaces consumed: `src/app/page.tsx`, `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`, `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`, `src/lib/render/expressiveness.ts`, `src/lib/render/organic/scene.ts`, `src/lib/render/typographic/scene.ts`
- New wiring introduced in this slice: a real acceptance/proof seam in the live results experience that exposes current palette/mapping/expressiveness diagnostics for the active result, plus automated/browser verification that exercises all supported input paths and captures durable evidence.
- What remains before the milestone is truly usable end-to-end: nothing within M002 if this slice completes as planned and the live proof is convincing; broader product redesign, launch polish, and post-M002 operability remain in later milestones.

## Tasks

- [x] **T01: Lock live-proof acceptance contracts and proof fixtures** `est:1h`
  - Why: S04 needs executable slice gates before implementation so browser-proof work does not drift into subjective screenshots without a contract.
  - Files: `src/__tests__/app/live-art-proof.test.tsx`, `src/__tests__/components/results/ResultsView.live-proof.test.tsx`, `src/components/results/ResultsView.tsx`, `src/app/page.tsx`
  - Do: Add failing tests that define the live-proof contract around real input-path coverage, supported/disabled style behavior, and inspectable acceptance metadata for the active result. Use contrasting text/URL/data fixtures and assert on real result-surface behavior instead of private implementation snapshots.
  - Verify: `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
  - Done when: The new test files exist, fail for the intended missing acceptance/proof behavior, and clearly define what S04 must make true in the live result surface.
- [x] **T02: Wire live proof diagnostics and restore operational health** `est:1h 30m`
  - Why: The slice cannot close without both browser-inspectable proof surfaces and a clean build; this task creates the runtime seam and fixes the known build blocker.
  - Files: `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`, `src/app/page.tsx`, `src/lib/render/expressiveness.ts`, `src/lib/render/types.ts`, `src/lib/color/harmony.ts`
  - Do: Implement the minimal live acceptance surface needed for S04 by exposing active-result family/mapping/expressiveness diagnostics and supported-style state in the real UI without leaking raw inputs. Fix the `HarmonyType` / `HARMONY_SPREAD` mismatch so the app builds again, then make the new live-proof tests pass while preserving existing text/URL/data behavior.
  - Verify: `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/components/StyleSelector.test.tsx` and `npm run build`
  - Done when: The app builds cleanly, the new acceptance diagnostics are visible from the real results surface, and all targeted proof/integration suites pass.
- [x] **T03: Execute browser proof run and capture milestone-closeout evidence** `est:1h 15m`
  - Why: M002 still lacks final assembly evidence in the actual app; this task performs the live acceptance run and stores durable proof artifacts.
  - Files: `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md`, `.gsd/milestones/M002/slices/S04/S04-UAT.md`, `.gsd/STATE.md`, `.gsd/milestones/M002/M002-ROADMAP.md`
  - Do: Start the local app, exercise deliberate contrasting fixtures through text, URL, and data flows in the browser, switch styles as needed, assert expected behavior explicitly, capture screenshots/debug bundle/HAR or timeline evidence, and record the accepted proof path plus any remaining nuance in slice artifacts.
  - Verify: Browser assertions at `http://localhost:3000` plus artifact capture showing text, URL, and data flows reached results, organic and typographic visibly changed where supported, typographic stayed disabled for data, and no blocking console/network failures invalidated the proof
  - Done when: Durable browser proof artifacts exist, slice summary/UAT record the exact acceptance evidence, and the milestone roadmap/state can honestly treat S04 as complete.

## Files Likely Touched

- `src/__tests__/app/live-art-proof.test.tsx`
- `src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- `src/components/results/ResultsView.tsx`
- `src/components/results/StyleSelector.tsx`
- `src/app/page.tsx`
- `src/lib/render/expressiveness.ts`
- `src/lib/render/types.ts`
- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md`
- `.gsd/milestones/M002/slices/S04/S04-UAT.md`
- `.gsd/STATE.md`
- `.gsd/milestones/M002/M002-ROADMAP.md`
