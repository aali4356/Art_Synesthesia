---
id: T04
parent: S01
milestone: M003
provides:
  - Real runtime proof that the editorial homepage flow works at the actual localhost entrypoint, plus documented evidence for the remaining local URL failure surface
key_files:
  - .gsd/milestones/M003/slices/S01/S01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/S01-PLAN.md
  - .gsd/STATE.md
key_decisions:
  - Closed S01 with explicit browser and network evidence instead of relying on passing component tests alone
patterns_established:
  - End slice-level UI work with one happy-path browser proof and one inspected failure-path diagnostic signal at the real app entrypoint
observability_surfaces:
  - Browser-visible proof diagnostics panel, visible URL error copy, browser network log for POST /api/analyze-url 500
duration: 35m
verification_result: passed
completed_at: 2026-03-11
blocker_discovered: false
---

# T04: Prove the real browser journey and operational truthfulness

**Closed S01 with passing test/build verification, real localhost browser proof for landing→results continuity, and explicit evidence for the remaining URL-mode failure surface.**

## What Happened

I ran the targeted homepage/results contract tests and a production build first; all passed. I then verified the real app at `http://localhost:3000` in the browser.

For the happy path, I exercised the homepage text flow from the branded landing state into a successful generated result. The live app preserved the editorial continuity promised by the slice: the landing narrative was present, generation produced the editorial results shell, and the proof diagnostics plus action desk remained visible in-browser. I also confirmed the diagnostics stayed privacy-safe by showing derived fields such as proof source, palette family, mapping posture, supported styles, and renderer expressiveness without exposing the raw submitted source inside the diagnostics surface.

For the failure path, I switched to URL mode and submitted a reference URL in local no-DB conditions. The app surfaced a visible `Unknown error` state in the control surface. I inspected browser network logs and confirmed the corresponding runtime failure was a real `POST /api/analyze-url` 500, so the limitation is inspectable rather than hidden.

I recorded this runtime truth in the new slice summary, marked T04 complete in the slice plan, and updated `.gsd/STATE.md` so the next agent can see both what passed and what remains weak.

## Verification

- Passed: `npm test -- src/__tests__/app/home-editorial-flow.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- Passed: `npm run build`
- Browser-verified at `http://localhost:3000` landing state:
  - `Synesthesia Machine`
  - `Private-first proofing`
  - `Compose from language`
  - `Text, URL, and data enter the same gallery desk.`
- Browser-verified successful text generation continuity:
  - `From source to proof`
  - `The artwork, proof, and controls stay on the same editorial stage.`
  - `proof diagnostics`
  - `renderer expressiveness`
  - `Collect, export, or share this edition.`
- Browser-verified failure path in URL mode:
  - Visible UI error: `Unknown error`
  - Network evidence: `POST http://127.0.0.1:3000/api/analyze-url -> 500`

## Diagnostics

Future agents can inspect this work by:

1. Running the targeted tests and build command from the slice plan.
2. Opening `http://localhost:3000`.
3. Generating once from text mode and checking the `proof diagnostics` panel plus action desk on the results surface.
4. Switching to URL mode, submitting a URL, and checking that the visible error state appears.
5. Reading browser network logs to confirm the underlying failing request is `POST /api/analyze-url` with status 500 in local no-DB mode.

## Deviations

None.

## Known Issues

- URL mode still fails in local no-DB conditions.
- The visible error copy is currently `Unknown error`, which is truthful only in the minimal sense that a failure is surfaced; it is not yet launch-quality diagnostic messaging.
- During verification, an older `next dev` process was already bound to port 3000. The browser proof was executed against that real localhost app instance, while the newly started background dev process failed to acquire the `.next/dev/lock` and crashed after attempting port 3002.

## Files Created/Modified

- `.gsd/milestones/M003/slices/S01/S01-SUMMARY.md` — recorded slice-level runtime proof, happy-path verification, and the remaining URL failure posture.
- `.gsd/milestones/M003/slices/S01/tasks/T04-SUMMARY.md` — captured task execution, verification evidence, diagnostics, and known issues.
- `.gsd/milestones/M003/slices/S01/S01-PLAN.md` — marked T04 complete.
- `.gsd/STATE.md` — updated active status to reflect S01 completion and the verified remaining URL limitation.
