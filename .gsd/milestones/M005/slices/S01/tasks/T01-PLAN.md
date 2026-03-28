---
estimated_steps: 23
estimated_files: 4
skills_used:
  - best-practices
  - react-best-practices
  - test
---

# T01: Codify the launch environment contract and build-safe deployment helpers

Create one checked-in environment contract that launch setup, scripts, and docs can all share. This task should add a root-level example env file, a small deployment helper that classifies required versus optional variables by runtime mode, package scripts for preflight/build/migrate usage, and focused tests that lock the contract so R006 cannot silently regress.

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

## Inputs

- ``package.json``
- ``drizzle.config.ts``
- ``src/db/index.ts``
- ``src/db/migrate.ts``
- ``vercel.json``
- ``.gsd/milestones/M005/M005-SECRETS.md``

## Expected Output

- ``.env.example``
- ``package.json``
- ``src/lib/deployment/env.ts``
- ``src/__tests__/deployment/env-contract.test.ts``

## Verification

npm test -- --run src/__tests__/deployment/env-contract.test.ts && npm run build

## Observability Impact

- Signals added/changed: preflight/env validation should emit named missing-key or malformed-value failures before deploy-time surprises.
- How a future agent inspects this: run the env-contract test file and the package preflight/build scripts.
- Failure state exposed: the exact missing/malformed env key and intended runtime mode become visible immediately.
