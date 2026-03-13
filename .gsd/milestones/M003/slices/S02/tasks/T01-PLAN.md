---
estimated_steps: 3
estimated_files: 3
---

# T01: Add failing proof for shared branded route surfaces

**Slice:** S02 — Shared brand system across shell, actions, and viewer surfaces
**Milestone:** M003

## Description

Create the executable proof boundary for S02 before implementation by encoding the shared shell/action/viewer expectations across gallery browse, compare mode, and branded unavailable states. The task is complete only when the new assertions fail against the current disconnected route wrappers and compare styling assumptions.

## Steps

1. Add `src/__tests__/app/shared-brand-surfaces.test.tsx` to render representative gallery, compare, and unavailable-state route compositions and assert shared shell copy, route-intro posture, branded viewer/action framing, and explicit unavailable messaging.
2. Tighten `src/__tests__/compare/compare-mode.test.tsx` only where needed to preserve the two-pane compare contract while making the new branded control semantics explicit.
3. Run the targeted Vitest command and confirm it fails because the current route shells and compare surface have not yet been normalized to the S01 editorial system.

## Must-Haves

- [ ] The new shared-surface test covers gallery browse, compare mode, and at least one DB-unavailable or not-found state with explicit assertions that would fail if routes still render as isolated plain wrappers.
- [ ] The proof preserves compare interaction semantics and does not weaken existing privacy or viewer guardrails while adding branded shell/action expectations.

## Verification

- `npm test -- src/__tests__/app/shared-brand-surfaces.test.tsx src/__tests__/compare/compare-mode.test.tsx`
- The command fails because the shared branded surface assertions are not yet satisfied by the current implementation.

## Observability Impact

- Signals added/changed: Encodes shell coherence, branded route intros, and truthful unavailable-state messaging as executable test failures.
- How a future agent inspects this: Run the targeted Vitest command and inspect which gallery/compare/unavailable assertions fail.
- Failure state exposed: Missing shell adoption, missing branded action/viewer framing, or collapsed unavailable messaging become localized test failures.

## Inputs

- `src/app/gallery/page.tsx` — current plain gallery browse wrapper and fallback states to target with new assertions.
- `src/app/compare/CompareMode.tsx` — current compare layout and undefined class usage that the proof must force to change.

## Expected Output

- `src/__tests__/app/shared-brand-surfaces.test.tsx` — failing executable proof for cross-surface branded shell/action/viewer coherence.
- `src/__tests__/compare/compare-mode.test.tsx` — updated compare assertions that keep behavior fixed while naming the branded control contract.
