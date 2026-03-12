---
estimated_steps: 4
estimated_files: 3
---

# T04: Prove the real browser journey and operational truthfulness

**Slice:** S01 — Editorial landing, generation, and results journey
**Milestone:** M003

## Description

Close the slice with real runtime proof. Run the targeted contract tests and build, then exercise the actual local app in the browser to confirm the landing → generate → results journey works as designed and that known URL-mode local limitations remain truthfully inspectable instead of hidden behind vague failure states.

## Steps

1. Run the targeted Vitest command and `npm run build` to verify the redesigned homepage/results journey and operational app boundary still pass locally.
2. Start the app, exercise the real homepage landing flow through at least one successful generation path, and assert the branded continuity and proof diagnostics in-browser.
3. Exercise the URL path in local no-DB mode and inspect the visible/browser diagnostics so the remaining runtime dependency limit is documented as an honest failure surface.
4. Record the verification outcome in the slice summary and/or state artifacts so the next agent knows what was proven and what remains outside S01.

## Must-Haves

- [ ] Real browser verification covers the actual `http://localhost:3000` entrypoint, not only component tests.
- [ ] The slice ends with both happy-path proof and at least one inspected failure-path diagnostic signal.

## Verification

- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx && npm run build`
- Browser assertions against the running local app for landing narrative, generation/results continuity, visible diagnostics, and truthful URL failure messaging.

## Observability Impact

- Signals added/changed: Confirms the live diagnostics/progress/action surfaces are trustworthy in the real app, not only in tests.
- How a future agent inspects this: Re-run the targeted tests/build and use the homepage plus browser diagnostics to inspect both happy and failure paths.
- Failure state exposed: Any remaining runtime dependency limit in URL mode is surfaced through visible UI/network evidence instead of a hidden server-side assumption.

## Inputs

- `src/__tests__/app/home-editorial-flow.test.tsx` — homepage continuity proof added in T01 and satisfied by T02/T03.
- `src/components/results/ResultsView.tsx` — live diagnostics surface to verify in-browser.
- `.gsd/STATE.md` / slice summary artifacts — destination for truthful verification status.

## Expected Output

- `.gsd/milestones/M003/slices/S01/S01-SUMMARY.md` — records what runtime/browser proof passed and what URL limitation remains.
- `.gsd/STATE.md` — updated active status reflecting S01 planning/execution verification posture.
