# Vercel + Neon launch runbook

This is the canonical deployment runbook for Synesthesia Machine when the public runtime is hosted on **Vercel** and the database is **Neon Postgres**.

> Current task-state note: this runbook is the authoritative command/order contract, but the live proof in `docs/deployment/live-proof.md` is currently blocked because the repo is not on GitHub and the app cannot be put on Vercel from the current project situation.

## Environment contract

Launch-critical variables are defined by `.env.example` and validated by `src/lib/deployment/env.ts`.

### Required for real deployed runtime

- `DATABASE_URL`
- `ADMIN_SECRET`
- `CRON_SECRET`

### Required for operator verification

- `SYNESTHESIA_PUBLIC_BASE_URL`

### Optional observability

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_OBSERVABILITY_SAMPLE_RATE`

## Deployment prerequisites

Before attempting the canonical launch path, confirm all of the following are true:

1. A Neon database exists and exposes the production `DATABASE_URL`.
2. A Vercel project exists for this app.
3. The Vercel project is bound to the correct source repository/workflow.
4. `ADMIN_SECRET` and `CRON_SECRET` are configured in the Vercel project.
5. The public deployment URL is known and recorded as `SYNESTHESIA_PUBLIC_BASE_URL`.
6. Local operator shell has the same launch-critical values available for migrate/smoke execution.

If any prerequisite is missing, **stop before deploy** and record the blocker in `docs/deployment/live-proof.md` instead of fabricating proof.

## Deployment order

Run the steps in this order.

### 1. Preflight the local/operator shell

```bash
DEPLOYMENT_ENV_MODE=deployed-runtime npm run deploy:preflight
```

Expected result:
- the helper reports `mode=deployed-runtime status=ok`
- `DATABASE_URL`, `ADMIN_SECRET`, and `CRON_SECRET` are present
- `SYNESTHESIA_PUBLIC_BASE_URL` is present for smoke execution

### 2. Run migrations against Neon

```bash
npm run db:migrate
```

Expected result:
- migrations complete without a named `[deployment-env:*]` failure
- any failure here is a launch blocker

### 3. Build with the canonical deploy path

```bash
npm run deploy:build
```

Expected result:
- preflight succeeds first
- `next build` completes cleanly

### 4. Deploy/update the Vercel runtime

Use the project’s standard Vercel promotion path for the bound project. The exact platform command depends on whether the project is linked through the Vercel dashboard/CLI or a Git provider integration, but the public runtime must not be treated as live until the deployment finishes successfully.

At minimum, verify:
- the intended Vercel project was targeted
- the deployment finished successfully
- the promoted URL matches `SYNESTHESIA_PUBLIC_BASE_URL`

### 5. Run the canonical deployment smoke

```bash
node scripts/verify-deployment.mjs \
  --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" \
  --cron-secret "$CRON_SECRET" \
  --admin-secret "$ADMIN_SECRET"
```

Expected result:
- DB-backed share flow passes: `share.create`, `share.read`, `share.page`
- DB-backed gallery flow passes: `gallery.create`, `gallery.browse`, `gallery.page`
- boundary checks pass: `cron.unauthorized`, `cron.authorized`, `admin.unauthorized`, `admin.authorized`
- no fallback markers are detected on public share/gallery pages

### 6. Record durable proof

Overwrite/update:
- `docs/deployment/live-proof.md`
- `.gsd/milestones/M005/M005-SECRETS.md`

These artifacts should record the exact timestamp, URL, verification commands, and any blocking stage.

## Known degraded-mode interpretations

These are acceptable only in local proof mode, **not** in launch proof:

- branded unavailable/no-DB share pages
- branded unavailable/no-DB gallery pages
- missing `DATABASE_URL` during local-only work

These are launch blockers in deployed proof:

- missing `DATABASE_URL`
- missing/malformed `SYNESTHESIA_PUBLIC_BASE_URL`
- any failed migration
- any failed Vercel deploy/update stage
- any smoke step failure
- any fallback marker on deployed share/gallery routes
- unauthorized cron/admin access succeeding
- authorized cron/admin access still failing

## Failure handling

### Secret/platform configuration failure

- Stop before deploy.
- Record which key/project binding is missing.
- Do not continue to smoke verification.

### Migration failure

- Treat as launch blocker.
- Fix DB/env state before any deploy retry.

### Deploy failure or timeout

- Treat as launch blocker.
- Record the failed stage and platform output reference in `docs/deployment/live-proof.md`.
- Do not run smoke verification on a partial rollout.

### Smoke failure

- Treat the named step as the blocker.
- Record the exact failing step, classification, and snippet.
- Do not mark the deployment trustworthy.

## Rollback hooks

If a promoted deployment fails smoke verification:

1. Stop further redeploy loops.
2. Keep one canonical `docs/deployment/live-proof.md` artifact for the latest run.
3. Re-point traffic/promote the previous known-good deployment in Vercel if one exists.
4. Re-run the smoke command against the rollback URL before declaring recovery.
5. Record the rollback action and result in the live-proof artifact.

## Artifact contract

Future agents should inspect launch status in this order:

1. `docs/deployment/live-proof.md`
2. `.gsd/milestones/M005/M005-SECRETS.md`
3. `.env.example`
4. `src/lib/deployment/env.ts`
5. `scripts/verify-deployment.mjs`
6. `src/lib/deployment/smoke.ts`
