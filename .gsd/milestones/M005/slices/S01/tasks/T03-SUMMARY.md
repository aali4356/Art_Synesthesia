---
id: T03
parent: S01
milestone: M005
provides: []
requires: []
affects: []
key_files: ["docs/deployment/vercel-neon-launch.md", "docs/deployment/live-proof.md", ".gsd/milestones/M005/M005-SECRETS.md", ".gsd/milestones/M005/slices/S01/tasks/T03-SUMMARY.md"]
key_decisions: ["Treated the absence of a real GitHub/Vercel deployment path as a plan-invalidating external blocker and recorded blocked proof explicitly instead of fabricating live deployment success.", "Kept one canonical live-proof artifact at docs/deployment/live-proof.md that distinguishes verified code/tooling behavior from missing external platform prerequisites."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran npm test -- --run src/__tests__/deployment/smoke.test.ts and confirmed the checked-in smoke harness still passes locally. Ran npm run db:migrate and confirmed it fails fast on the correct named prerequisite with [deployment-env] mode=migrate status=failed kind=missing key=DATABASE_URL. Ran node scripts/verify-deployment.mjs and confirmed it fails fast on the correct named prerequisite with Missing required base URL. Provide --base-url or SYNESTHESIA_PUBLIC_BASE_URL. Verified docs/deployment/vercel-neon-launch.md contains the Deployment order section and docs/deployment/live-proof.md contains the live-proof heading. Ran vercel --version and confirmed the CLI is unavailable, then checked for .vercel/project.json and confirmed no local Vercel project binding exists."
completed_at: 2026-03-28T19:41:07.366Z
blocker_discovered: true
---

# T03: Published the canonical Vercel + Neon runbook and a truthful blocked live-proof artifact because the project cannot currently be deployed to Vercel.

> Published the canonical Vercel + Neon runbook and a truthful blocked live-proof artifact because the project cannot currently be deployed to Vercel.

## What Happened
---
id: T03
parent: S01
milestone: M005
key_files:
  - docs/deployment/vercel-neon-launch.md
  - docs/deployment/live-proof.md
  - .gsd/milestones/M005/M005-SECRETS.md
  - .gsd/milestones/M005/slices/S01/tasks/T03-SUMMARY.md
key_decisions:
  - Treated the absence of a real GitHub/Vercel deployment path as a plan-invalidating external blocker and recorded blocked proof explicitly instead of fabricating live deployment success.
  - Kept one canonical live-proof artifact at docs/deployment/live-proof.md that distinguishes verified code/tooling behavior from missing external platform prerequisites.
duration: ""
verification_result: passed
completed_at: 2026-03-28T19:41:07.390Z
blocker_discovered: true
---

# T03: Published the canonical Vercel + Neon runbook and a truthful blocked live-proof artifact because the project cannot currently be deployed to Vercel.

**Published the canonical Vercel + Neon runbook and a truthful blocked live-proof artifact because the project cannot currently be deployed to Vercel.**

## What Happened

Created docs/deployment/vercel-neon-launch.md as the canonical checked-in runbook for the intended Vercel + Neon launch path, including environment contract, migration/build/smoke order, degraded-mode interpretation, failure handling, rollback hooks, and artifact expectations. Created docs/deployment/live-proof.md as the durable proof artifact for this execution and recorded the real blocked state instead of fabricating success: the repo is not on GitHub, the app cannot be put on Vercel from the current project situation, no local .vercel/project.json binding exists, the vercel CLI is unavailable in the shell, DATABASE_URL is still missing for migrations, and SYNESTHESIA_PUBLIC_BASE_URL is still missing for smoke verification. Updated .gsd/milestones/M005/M005-SECRETS.md so downstream work can see which launch-critical secrets were collected locally and which deploy-critical secrets/bindings are still absent. This execution revealed a plan-invalidating external blocker for the remainder of the slice contract: live Vercel proof cannot be completed from the current project state.

## Verification

Ran npm test -- --run src/__tests__/deployment/smoke.test.ts and confirmed the checked-in smoke harness still passes locally. Ran npm run db:migrate and confirmed it fails fast on the correct named prerequisite with [deployment-env] mode=migrate status=failed kind=missing key=DATABASE_URL. Ran node scripts/verify-deployment.mjs and confirmed it fails fast on the correct named prerequisite with Missing required base URL. Provide --base-url or SYNESTHESIA_PUBLIC_BASE_URL. Verified docs/deployment/vercel-neon-launch.md contains the Deployment order section and docs/deployment/live-proof.md contains the live-proof heading. Ran vercel --version and confirmed the CLI is unavailable, then checked for .vercel/project.json and confirmed no local Vercel project binding exists.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- --run src/__tests__/deployment/smoke.test.ts` | 0 | ✅ pass | 962ms |
| 2 | `npm run db:migrate` | 1 | ✅ pass | 899ms |
| 3 | `node scripts/verify-deployment.mjs` | 1 | ✅ pass | 157ms |
| 4 | `grep -q "## Deployment order" docs/deployment/vercel-neon-launch.md` | 0 | ✅ pass | 20ms |
| 5 | `grep -q "# Live proof\|## Live proof" docs/deployment/live-proof.md` | 0 | ✅ pass | 20ms |
| 6 | `vercel --version` | 127 | ✅ pass | 28ms |
| 7 | `find . -path '*/.vercel/project.json' -print` | 0 | ✅ pass | 20ms |


## Deviations

The task plan assumed a real Vercel + Neon deploy/update path could be executed from this workspace. During execution the user clarified that the repo is not on GitHub and cannot be put on Vercel, so the live-proof artifact was converted into a truthful blocked-proof record rather than a fake success artifact.

## Known Issues

Live deployment proof for S01 is still missing. DATABASE_URL and SYNESTHESIA_PUBLIC_BASE_URL remain unavailable, there is no local .vercel project binding, and the vercel CLI is not installed. The slice cannot honestly claim launch-ready Vercel + Neon proof until those external constraints are resolved or the roadmap is replanned to a different deployment target.

## Files Created/Modified

- `docs/deployment/vercel-neon-launch.md`
- `docs/deployment/live-proof.md`
- `.gsd/milestones/M005/M005-SECRETS.md`
- `.gsd/milestones/M005/slices/S01/tasks/T03-SUMMARY.md`


## Deviations
The task plan assumed a real Vercel + Neon deploy/update path could be executed from this workspace. During execution the user clarified that the repo is not on GitHub and cannot be put on Vercel, so the live-proof artifact was converted into a truthful blocked-proof record rather than a fake success artifact.

## Known Issues
Live deployment proof for S01 is still missing. DATABASE_URL and SYNESTHESIA_PUBLIC_BASE_URL remain unavailable, there is no local .vercel project binding, and the vercel CLI is not installed. The slice cannot honestly claim launch-ready Vercel + Neon proof until those external constraints are resolved or the roadmap is replanned to a different deployment target.
