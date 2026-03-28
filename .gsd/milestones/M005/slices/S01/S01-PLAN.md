# S01: Canonical Deployment Path

**Goal:** Establish the canonical Vercel + Neon deployment path, environment contract, and live backend proof for the real public runtime.
**Demo:** After this: A provisioned Vercel + Neon deployment builds, boots, runs migrations/setup in the documented order, and serves DB-backed public routes through the real app instead of local no-DB fallback behavior.

## Tasks
- [x] **T01: Added a shared deployment env contract, canonical preflight/build/migrate scripts, and build-safe DB bootstrap validation for the Vercel + Neon launch path.** — Create one checked-in environment contract that launch setup, scripts, and docs can all share. This task should add a root-level example env file, a small deployment helper that classifies required versus optional variables by runtime mode, package scripts for preflight/build/migrate usage, and focused tests that lock the contract so R006 cannot silently regress.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Process environment (`DATABASE_URL`, operator secrets, observability keys) | Fail fast with a named missing-key error and clear local-vs-deployed guidance. | N/A — env reads are synchronous. | Reject blank/whitespace or malformed values before later scripts consume them. |
| Next.js/Drizzle build boundary | Keep `npm run build` as the truth test after helper changes so deployment work does not reopen eager-bootstrap fragility. | N/A — handled by build command outcome. | Surface the exact module/script that still assumes undocumented env state. |

## Load Profile

- **Shared resources**: build-time env reads, deployment scripts, and every later operator/deploy step that consumes the contract.
- **Per-operation cost**: trivial config parsing plus one build verification.
- **10x breakpoint**: contract drift across scripts/docs; one shared helper must remain the single source of truth.

## Negative Tests

- **Malformed inputs**: blank strings, malformed URLs/hosts, and deploy mode without `DATABASE_URL` fail with deterministic messages.
- **Error paths**: local-proof mode without deploy-only secrets remains allowed while deployed mode blocks on missing required keys.
- **Boundary conditions**: optional observability vars stay optional, but operator secrets are still required for protected runtime paths.

## Steps

1. Add a checked-in `.env.example` that lists deploy-required, operator-only, and optional observability variables for the canonical Vercel + Neon path.
2. Add a small deployment env helper under `src/lib/deployment/` that validates and classifies the env contract for local proof, migration, and deployed runtime modes.
3. Add package scripts that point at the canonical build/migrate/preflight commands so later tasks and docs reuse one path.
4. Add focused tests that lock the helper behavior and then re-run `npm run build` to ensure deployment hardening does not reintroduce eager DB fragility.

## Must-Haves

- [ ] `.env.example` names every launch-critical variable with truthful local-vs-deploy expectations.
- [ ] One helper owns env validation/classification for scripts and docs instead of copy-pasted key lists.
- [ ] `npm run build` remains green after the deployment contract is introduced.
  - Estimate: 1h
  - Files: .env.example, package.json, src/lib/deployment/env.ts, src/__tests__/deployment/env-contract.test.ts
  - Verify: npm test -- --run src/__tests__/deployment/env-contract.test.ts && npm run build
- [ ] **T02: Add executable migration and deployed smoke verification tooling** — Make the canonical deployment path executable instead of handwritten. Build a testable smoke-verification library plus a CLI script that can target a provisioned URL, create DB-backed share/gallery proof records through the real app, verify those public routes render real data instead of branded no-DB fallbacks, and confirm the cron/admin boundaries reject and accept requests according to their secrets.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Provisioned deployment URL | Fail the smoke run with the named step and preserve the HTTP/body snippet needed for diagnosis. | Abort the step with timeout classification instead of hanging the whole proof. | Mark the route as malformed/unexpected and stop treating the deployment as launch-ready. |
| Neon-backed share/gallery persistence | Stop the proof if create/browse/detail routes return unavailable-state markers or 5xx responses. | Fail with a DB-backed route timeout classification. | Reject missing IDs/fields and show which route broke the contract. |
| `CRON_SECRET` / `ADMIN_SECRET` protected routes | Fail if unauthorized access succeeds or authorized access still returns 401/503. | Surface which protected route timed out. | Fail on non-JSON or schema drift in the operator response. |

## Load Profile

- **Shared resources**: deployed HTTP routes, Neon write/read paths, and operator-only endpoints.
- **Per-operation cost**: one share create + read flow, one gallery create + browse/detail flow, one unauthorized/authorized cron check, and one unauthorized/authorized admin check.
- **10x breakpoint**: repeated smoke runs will stress gallery/share persistence and can create noisy proof data if the script is not deterministic and bounded.

## Negative Tests

- **Malformed inputs**: missing base URL, invalid secrets, and malformed JSON responses fail the smoke run with explicit step names.
- **Error paths**: 401/403/503 responses, branded unavailable-state HTML, and missing DB-backed IDs are treated as failures rather than soft warnings.
- **Boundary conditions**: unauthorized cron/admin requests must stay blocked while authorized requests succeed on the same deployment.

## Steps

1. Add a reusable smoke helper under `src/lib/deployment/` that executes the deployed share/gallery/cron/admin checks and returns structured step results.
2. Add `scripts/verify-deployment.mjs` as the canonical CLI entrypoint, including bounded timeouts, response validation, and secret redaction in output.
3. Add package scripts for migrate and deployed smoke execution so docs and later slices can reuse exact commands.
4. Add focused tests for the smoke helper/CLI contract, including fallback detection and operator-auth assertions.

## Must-Haves

- [ ] One command can prove the deployed app is serving DB-backed share/gallery behavior instead of local-proof unavailable states.
- [ ] The smoke path explicitly checks both unauthorized and authorized behavior for cron/admin routes.
- [ ] Smoke output localizes failures by step without printing secrets.
  - Estimate: 1h 15m
  - Files: package.json, scripts/verify-deployment.mjs, src/lib/deployment/smoke.ts, src/__tests__/deployment/smoke.test.ts
  - Verify: npm test -- --run src/__tests__/deployment/smoke.test.ts
- [ ] **T03: Publish the canonical Vercel + Neon runbook and capture live deployment proof** — Close the slice by using the checked-in contract and smoke tooling against the real provisioned stack. This task should document the exact setup order, collect any required secrets through the secure env flow, run migrations, deploy/update the Vercel app, execute the deployed smoke command, and record the resulting URL plus proof outcomes in durable markdown artifacts that downstream slices can trust.

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
  - Estimate: 1h 30m
  - Files: docs/deployment/vercel-neon-launch.md, docs/deployment/live-proof.md, .gsd/milestones/M005/M005-SECRETS.md, package.json, scripts/verify-deployment.mjs
  - Verify: npm run db:migrate && node scripts/verify-deployment.mjs --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" --cron-secret "$CRON_SECRET" --admin-secret "$ADMIN_SECRET" && grep -q "## Deployment order" docs/deployment/vercel-neon-launch.md && grep -q "## Live proof" docs/deployment/live-proof.md
