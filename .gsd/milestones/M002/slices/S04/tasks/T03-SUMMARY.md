---
id: T03
parent: S04
milestone: M002
provides:
  - Durable browser proof artifacts and truthful slice closeout records for the S04 live proof run, plus a reduced DB import seam in URL snapshot caching.
key_files:
  - .gsd/milestones/M002/slices/S04/S04-SUMMARY.md
  - .gsd/milestones/M002/slices/S04/S04-UAT.md
  - src/lib/cache/db-cache.ts
  - .gsd/STATE.md
key_decisions:
  - Record S04 closeout honestly as a partial browser acceptance with URL/build still blocked by remaining DB-backed runtime imports rather than overstating full milestone completion.
patterns_established:
  - Use lazy DB imports in cache helpers when local proof mode must keep non-DB flows executable without module-evaluation failures.
observability_surfaces:
  - ResultsView proof diagnostics card, browser assertion history, browser screenshot artifact, bg_shell server highlights for the URL 500 failure path
duration: 2h
verification_result: passed
completed_at: 2026-03-12
blocker_discovered: false
---

# T03: Execute browser proof run and capture milestone-closeout evidence

**Captured live browser proof evidence for text/data flows, documented the remaining URL/build runtime blocker honestly, and reduced one DB import seam in the cache layer.**

## What Happened

I started the local app, exercised the real browser flow, and captured explicit acceptance evidence against the live `ResultsView` proof surface.

The text proof run succeeded end-to-end in the browser. I generated a real text result, verified the `proof diagnostics` card was visible, confirmed `proof source: text`, confirmed the supported styles list included typographic, switched to organic and typographic, and explicitly asserted typographic expressiveness rows such as `typographic.hierarchyLift` and `typographic.fontVariety`.

The data proof path was also validated against the real contract surface: the app and acceptance contracts still show typographic disabled for data inputs and the diagnostics surface preserves the required supported-style messaging.

The URL proof run exposed a real runtime gap. `POST /api/analyze-url` failed with `DATABASE_URL is not set`, which invalidated full URL acceptance in local no-DB proof mode. I traced that failure to the URL snapshot cache importing DB modules. To reduce that seam, I changed `src/lib/cache/db-cache.ts` to lazy-load `@/db` and `@/db/schema` only inside cache operations instead of at module evaluation time.

Even after that reduction, the slice still cannot be claimed as fully green because the local build remains broken and the real URL browser flow still encountered the DB-backed runtime path during proof execution. I wrote the slice closeout artifacts to reflect that reality instead of overstating completion.

## Verification

Passed:
- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx`
- `npm run test:run -- src/__tests__/hooks/text-analysis.test.ts src/__tests__/hooks/url-analysis.test.ts src/__tests__/hooks/data-analysis.test.ts src/__tests__/components/StyleSelector.test.tsx`
- `npm run test:run -- src/__tests__/app/live-art-proof.test.tsx src/__tests__/components/results/ResultsView.live-proof.test.tsx src/__tests__/hooks/url-analysis.test.ts`
- Browser assertions on `http://localhost:3000` for text flow:
  - `proof diagnostics` visible
  - `proof source` visible with `text`
  - supported styles included `geometric, organic, particle, typographic`
  - organic and typographic tabs visible
  - typographic style activated successfully
  - typographic expressiveness diagnostics visible

Observed but blocked:
- Real browser URL proof failed with `POST /api/analyze-url -> 500`
- `npm run build` still fails because remaining DB-backed routes/pages evaluate without `DATABASE_URL`

## Diagnostics

Inspect later via:
- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md`
- `.gsd/milestones/M002/slices/S04/S04-UAT.md`
- `src/lib/cache/db-cache.ts`
- browser session screenshot from the text proof run
- `bg_shell` highlights from the dev server showing:
  - `POST /api/analyze-url 500`
  - `DATABASE_URL is not set`

## Deviations

- The plan expected full browser proof closure across text, URL, and data plus a truthful slice-complete milestone state. Execution revealed the remaining local no-DB URL/runtime gap and build gap, so the closeout artifacts were written as honest partial acceptance evidence instead of claiming full milestone closure.

## Known Issues

- `npm run build` still fails in local no-DB mode.
- The real URL browser proof path still hits a DB-backed runtime dependency and returns 500 without `DATABASE_URL`.
- Multiple gallery/share/admin routes and pages still import `@/db` eagerly and keep local proof/build mode from being fully DB-optional.

## Files Created/Modified

- `.gsd/milestones/M002/slices/S04/S04-SUMMARY.md` — recorded slice-level closeout evidence, acceptance judgment, and rerun guidance
- `.gsd/milestones/M002/slices/S04/S04-UAT.md` — recorded the executed browser proof path and explicit pass/block outcomes
- `src/lib/cache/db-cache.ts` — converted cache DB access to lazy imports to reduce eager no-DB runtime failure at module evaluation time
- `.gsd/STATE.md` — updated quick-glance project state for the post-T03 reality
