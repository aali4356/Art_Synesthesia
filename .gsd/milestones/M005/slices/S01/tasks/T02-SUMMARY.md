---
id: T02
parent: S01
milestone: M005
provides: []
requires: []
affects: []
key_files: ["package.json", "scripts/verify-deployment.mjs", "src/lib/deployment/smoke.ts", "src/__tests__/deployment/smoke.test.ts", ".gsd/KNOWLEDGE.md", ".gsd/DECISIONS.md"]
key_decisions: ["Kept `scripts/verify-deployment.mjs` as the canonical operator command and delegated the real implementation to `src/lib/deployment/smoke.ts` through a Node strip-types wrapper so T03 can run a plain `node` command without duplicating logic.", "Made the smoke helper fail fast on the first named step with structured per-step results, timeout classification, fallback-marker detection, contract validation, and redacted response snippets so degraded public/runtime states cannot masquerade as launch proof."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran `npm test -- --run src/__tests__/deployment/smoke.test.ts` and it passed all six deployment smoke tests. Ran `node scripts/verify-deployment.mjs` with no args and confirmed the real executable wrapper emits a clean named `cli.args` failure with no secret leakage or wrapper-noise warnings. Ran `npm run deploy:smoke` and confirmed the new package alias resolves to the same canonical CLI behavior. Slice-level live smoke against a real deployed URL remains intentionally pending for T03."
completed_at: 2026-03-28T19:14:06.043Z
blocker_discovered: false
---

# T02: Added a reusable deployment smoke verifier plus a canonical CLI that proves DB-backed share/gallery routes and cron/admin auth boundaries with named, redacted step output.

> Added a reusable deployment smoke verifier plus a canonical CLI that proves DB-backed share/gallery routes and cron/admin auth boundaries with named, redacted step output.

## What Happened
---
id: T02
parent: S01
milestone: M005
key_files:
  - package.json
  - scripts/verify-deployment.mjs
  - src/lib/deployment/smoke.ts
  - src/__tests__/deployment/smoke.test.ts
  - .gsd/KNOWLEDGE.md
  - .gsd/DECISIONS.md
key_decisions:
  - Kept `scripts/verify-deployment.mjs` as the canonical operator command and delegated the real implementation to `src/lib/deployment/smoke.ts` through a Node strip-types wrapper so T03 can run a plain `node` command without duplicating logic.
  - Made the smoke helper fail fast on the first named step with structured per-step results, timeout classification, fallback-marker detection, contract validation, and redacted response snippets so degraded public/runtime states cannot masquerade as launch proof.
duration: ""
verification_result: passed
completed_at: 2026-03-28T19:14:06.043Z
blocker_discovered: false
---

# T02: Added a reusable deployment smoke verifier plus a canonical CLI that proves DB-backed share/gallery routes and cron/admin auth boundaries with named, redacted step output.

**Added a reusable deployment smoke verifier plus a canonical CLI that proves DB-backed share/gallery routes and cron/admin auth boundaries with named, redacted step output.**

## What Happened

Implemented `src/lib/deployment/smoke.ts` as the reusable deployment-proof library for the canonical Vercel + Neon path. The helper validates CLI/runtime inputs, creates one real share record and one real gallery record through the app’s public APIs, verifies the share read API, verifies gallery browse/detail behavior, detects branded unavailable-state fallback markers on public share/gallery routes, and checks both unauthorized and authorized behavior for `/api/cron/cleanup` and `/api/admin/review`. Added `scripts/verify-deployment.mjs` as the canonical executable wrapper so `node scripts/verify-deployment.mjs ...` remains the operator-facing command while the implementation stays in TypeScript. Updated `package.json` with `deploy:migrate` and `deploy:smoke`, added focused Vitest coverage for happy-path and failure-classification behavior, recorded the runtime-structure decision in `.gsd/DECISIONS.md`, and documented the wrapper pattern in `.gsd/KNOWLEDGE.md`.

## Verification

Ran `npm test -- --run src/__tests__/deployment/smoke.test.ts` and it passed all six deployment smoke tests. Ran `node scripts/verify-deployment.mjs` with no args and confirmed the real executable wrapper emits a clean named `cli.args` failure with no secret leakage or wrapper-noise warnings. Ran `npm run deploy:smoke` and confirmed the new package alias resolves to the same canonical CLI behavior. Slice-level live smoke against a real deployed URL remains intentionally pending for T03.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- --run src/__tests__/deployment/smoke.test.ts` | 0 | ✅ pass | 1000ms |
| 2 | `node scripts/verify-deployment.mjs` | 1 | ✅ pass | 1ms |
| 3 | `npm run deploy:smoke` | 1 | ✅ pass | 2ms |


## Deviations

Touched `.gsd/DECISIONS.md` and `.gsd/KNOWLEDGE.md` in addition to the planner's explicit output files so the non-obvious Node wrapper/runtime pattern is durable for downstream deployment work.

## Known Issues

Live proof against a provisioned Vercel + Neon URL was not run in this task because T02 establishes the executable tooling only; T03 still needs real deployment secrets, migrations, and a public URL to produce launch proof.

## Files Created/Modified

- `package.json`
- `scripts/verify-deployment.mjs`
- `src/lib/deployment/smoke.ts`
- `src/__tests__/deployment/smoke.test.ts`
- `.gsd/KNOWLEDGE.md`
- `.gsd/DECISIONS.md`


## Deviations
Touched `.gsd/DECISIONS.md` and `.gsd/KNOWLEDGE.md` in addition to the planner's explicit output files so the non-obvious Node wrapper/runtime pattern is durable for downstream deployment work.

## Known Issues
Live proof against a provisioned Vercel + Neon URL was not run in this task because T02 establishes the executable tooling only; T03 still needs real deployment secrets, migrations, and a public URL to produce launch proof.
