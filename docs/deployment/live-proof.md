# Live proof

## Status

- **Verdict:** blocked
- **Task:** M005 / S01 / T03
- **Reason:** external deployment prerequisites are unavailable in the current project state

## Blocking facts

1. The repo is **not on GitHub**.
2. The app **cannot be put on Vercel** from the current project situation.
3. No local Vercel project binding was found (`.vercel/project.json` absent).
4. No Vercel MCP server is configured in this repo.
5. `vercel` CLI is not installed in the current shell.
6. `DATABASE_URL` was still unavailable during migrate verification.
7. `SYNESTHESIA_PUBLIC_BASE_URL` was still unavailable during smoke verification.

Because of those facts, a truthful live Vercel + Neon deployment proof could not be produced in this task.

## Latest attempted verification

- **Timestamp:** 2026-03-28T14:15 EDT (workspace-local execution window)
- **Deployment target:** unavailable
- **Public base URL:** unavailable
- **Migration status:** blocked before DB connection because `DATABASE_URL` is missing
- **Deploy/update status:** not attempted because the Vercel target path is unavailable
- **Smoke status:** blocked before route checks because `SYNESTHESIA_PUBLIC_BASE_URL` is missing

## Command results

### 1. Deployment smoke unit tests

Command:

```bash
npm test -- --run src/__tests__/deployment/smoke.test.ts
```

Result:
- passed locally (`6/6` tests)
- confirms the smoke harness itself is working as designed

### 2. Migration command

Command:

```bash
npm run db:migrate
```

Observed result:
- failed with named env blocker
- emitted `[deployment-env] mode=migrate status=failed kind=missing key=DATABASE_URL`

Interpretation:
- the migration runner is healthy enough to fail fast on the right prerequisite
- no truthful migration proof exists yet because the real Neon connection string was not available

### 3. Smoke CLI command

Command:

```bash
node scripts/verify-deployment.mjs
```

Observed result:
- failed with named CLI blocker
- emitted `Missing required base URL. Provide --base-url or SYNESTHESIA_PUBLIC_BASE_URL.`

Interpretation:
- the canonical smoke command is healthy enough to reject incomplete operator input
- no truthful runtime proof exists yet because no deploy URL was available

## Proof gap summary

The code-side launch contract exists, but the **live platform proof is still missing**. Downstream slices must treat the deployment as **unproven** until all of the following happen in a real provisioned environment:

1. provide `DATABASE_URL`
2. provide `SYNESTHESIA_PUBLIC_BASE_URL`
3. establish a real Vercel project/deploy path
4. run `npm run db:migrate`
5. run `node scripts/verify-deployment.mjs --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" --cron-secret "$CRON_SECRET" --admin-secret "$ADMIN_SECRET"`
6. replace this file with a passing proof artifact

## Next valid resume point

When the deployment path exists again, resume in this order:

1. populate launch-critical envs
2. run `DEPLOYMENT_ENV_MODE=deployed-runtime npm run deploy:preflight`
3. run `npm run db:migrate`
4. deploy/promote the Vercel app
5. run the canonical smoke command against the promoted URL
6. overwrite this file with the exact passing/failing step output
