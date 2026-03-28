---
estimated_steps: 24
estimated_files: 5
skills_used:
  - best-practices
  - agent-browser
  - test
---

# T03: Publish the canonical Vercel + Neon runbook and capture live deployment proof

Close the slice by using the checked-in contract and smoke tooling against the real provisioned stack. This task should document the exact setup order, collect any required secrets through the secure env flow, run migrations, deploy/update the Vercel app, execute the deployed smoke command, and record the resulting URL plus proof outcomes in durable markdown artifacts that downstream slices can trust.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Secret collection / platform configuration | Stop before deploy and record which required secret or project binding is still missing. | Retry only after the missing external step is confirmed, not in a blind loop. | Reject malformed project URLs/IDs and fix the config source before deployment continues. |
| Vercel build/deploy pipeline | Fail the task with the named build/deploy stage and link the runbook to the remediation point. | Treat as deployment failure and do not continue to smoke verification on a partial rollout. | Record the unexpected platform response in the live-proof artifact for follow-up. |
| Live smoke verification | Treat any failing step as a launch blocker and capture the exact failing route/step in the proof artifact. | Abort with timeout classification and timestamp. | Record the malformed response/fallback marker so the next slice knows the deployment is not yet trustworthy. |

## Load Profile

- **Shared resources**: Vercel build pipeline, Neon migrations, and the live deployed public/operator routes.
- **Per-operation cost**: one migration run, one deploy/update, and one bounded smoke pass against the live URL.
- **10x breakpoint**: repeated redeploy/smoke loops can create proof noise and stale artifacts; the task should overwrite/update one canonical proof artifact per run.

## Negative Tests

- **Malformed inputs**: missing deployment URL, wrong project binding, or absent secrets block the run before false proof is recorded.
- **Error paths**: build failure, migration failure, 401/503 operator responses, and branded unavailable states on share/gallery routes are captured as explicit blockers.
- **Boundary conditions**: the same runbook must distinguish local-proof allowances from deployed-runtime requirements so later operators do not conflate them.

## Steps

1. Write a checked-in runbook that spells out environment setup, migration order, deploy/update steps, smoke commands, rollback hooks, and known degraded-mode interpretations.
2. Use secure secret collection for any missing launch keys, then run the canonical migrate + deploy steps against the real Vercel + Neon environment.
3. Execute `scripts/verify-deployment.mjs` against the resulting public URL and capture the exact output/results in a durable live-proof markdown artifact.
4. Cross-check the runbook so every command and artifact path matches the implemented package scripts and smoke tooling from T01/T02.

## Must-Haves

- [ ] The repo contains one canonical Vercel + Neon runbook with exact command order and secret expectations.
- [ ] A live deployed URL is recorded alongside passing migration/smoke proof for DB-backed share/gallery routes and protected cron/admin endpoints.
- [ ] The proof artifact makes any blocker or degraded fallback unmistakable to downstream slices.

## Inputs

- ``.env.example``
- ``package.json``
- ``scripts/verify-deployment.mjs``
- ``src/lib/deployment/env.ts``
- ``src/lib/deployment/smoke.ts``
- ``.gsd/milestones/M005/M005-SECRETS.md``
- ``vercel.json``

## Expected Output

- ``docs/deployment/vercel-neon-launch.md``
- ``docs/deployment/live-proof.md``
- ``.gsd/milestones/M005/M005-SECRETS.md``

## Verification

npm run db:migrate && node scripts/verify-deployment.mjs --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" --cron-secret "$CRON_SECRET" --admin-secret "$ADMIN_SECRET" && grep -q "## Deployment order" docs/deployment/vercel-neon-launch.md && grep -q "## Live proof" docs/deployment/live-proof.md

## Observability Impact

- Signals added/changed: the live-proof artifact should capture deployment timestamp, public base URL, migrate/smoke command results, and any failing step.
- How a future agent inspects this: read `docs/deployment/live-proof.md`, then rerun the documented migrate/smoke commands.
- Failure state exposed: missing secrets, failed deploy stage, migration failure, or degraded share/gallery/operator checks are recorded explicitly.
