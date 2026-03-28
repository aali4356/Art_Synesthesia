---
id: T01
parent: S01
milestone: M005
provides: []
requires: []
affects: []
key_files: [".env.example", "src/lib/deployment/env.ts", "src/__tests__/deployment/env-contract.test.ts", "package.json", "src/db/index.ts", "src/db/migrate.ts", "drizzle.config.ts", ".gsd/KNOWLEDGE.md"]
key_decisions: ["Centralized launch-critical env validation in src/lib/deployment/env.ts and reused it from preflight, Drizzle config, DB bootstrap, and the migration runner.", "Kept DATABASE_URL optional for local-proof builds while making migrate and deployed-runtime modes fail fast on missing or malformed required keys.", "Used a runtime .ts import in src/db/migrate.ts so Node 22 strip-types could share the TypeScript helper without breaking Next build typecheck."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran npm run deploy:preflight and confirmed redacted key/status output in local-proof mode. Ran DEPLOYMENT_ENV_MODE=migrate DATABASE_URL='   ' npm run deploy:preflight and confirmed a named malformed DATABASE_URL failure. Ran the task gate npm test -- --run src/__tests__/deployment/env-contract.test.ts && npm run build and it passed. Ran npm run db:migrate and confirmed it now fails for the correct reason in an unconfigured shell: a named missing DATABASE_URL error from the shared helper. Ran node scripts/verify-deployment.mjs --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" --cron-secret "$CRON_SECRET" --admin-secret "$ADMIN_SECRET" and confirmed it still fails because the T02 verification script has not been created yet."
completed_at: 2026-03-28T19:03:23.941Z
blocker_discovered: false
---

# T01: Added a shared deployment env contract, canonical preflight/build/migrate scripts, and build-safe DB bootstrap validation for the Vercel + Neon launch path.

> Added a shared deployment env contract, canonical preflight/build/migrate scripts, and build-safe DB bootstrap validation for the Vercel + Neon launch path.

## What Happened
---
id: T01
parent: S01
milestone: M005
key_files:
  - .env.example
  - src/lib/deployment/env.ts
  - src/__tests__/deployment/env-contract.test.ts
  - package.json
  - src/db/index.ts
  - src/db/migrate.ts
  - drizzle.config.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Centralized launch-critical env validation in src/lib/deployment/env.ts and reused it from preflight, Drizzle config, DB bootstrap, and the migration runner.
  - Kept DATABASE_URL optional for local-proof builds while making migrate and deployed-runtime modes fail fast on missing or malformed required keys.
  - Used a runtime .ts import in src/db/migrate.ts so Node 22 strip-types could share the TypeScript helper without breaking Next build typecheck.
duration: ""
verification_result: mixed
completed_at: 2026-03-28T19:03:23.941Z
blocker_discovered: false
---

# T01: Added a shared deployment env contract, canonical preflight/build/migrate scripts, and build-safe DB bootstrap validation for the Vercel + Neon launch path.

**Added a shared deployment env contract, canonical preflight/build/migrate scripts, and build-safe DB bootstrap validation for the Vercel + Neon launch path.**

## What Happened

Added a checked-in .env.example for the canonical Vercel + Neon path, created src/lib/deployment/env.ts as the single source of truth for launch-critical env validation across local-proof, migrate, and deployed-runtime modes, and wired that helper into drizzle.config.ts, src/db/migrate.ts, src/db/index.ts, and package scripts. The DB entrypoint now initializes lazily so no-DB local proof mode stays build-safe while DB-backed routes still fail truthfully at access time. Added focused Vitest coverage in src/__tests__/deployment/env-contract.test.ts to lock required-vs-optional classification, malformed input handling, operator secret requirements, and redacted preflight output. Also documented the Node 22 strip-types import gotcha in .gsd/KNOWLEDGE.md because it affected the canonical migration runner wiring.

## Verification

Ran npm run deploy:preflight and confirmed redacted key/status output in local-proof mode. Ran DEPLOYMENT_ENV_MODE=migrate DATABASE_URL='   ' npm run deploy:preflight and confirmed a named malformed DATABASE_URL failure. Ran the task gate npm test -- --run src/__tests__/deployment/env-contract.test.ts && npm run build and it passed. Ran npm run db:migrate and confirmed it now fails for the correct reason in an unconfigured shell: a named missing DATABASE_URL error from the shared helper. Ran node scripts/verify-deployment.mjs --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" --cron-secret "$CRON_SECRET" --admin-secret "$ADMIN_SECRET" and confirmed it still fails because the T02 verification script has not been created yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run deploy:preflight` | 0 | ✅ pass | 550ms |
| 2 | `DEPLOYMENT_ENV_MODE=migrate DATABASE_URL='   ' npm run deploy:preflight` | 1 | ✅ pass | 550ms |
| 3 | `npm test -- --run src/__tests__/deployment/env-contract.test.ts && npm run build` | 0 | ✅ pass | 13276ms |
| 4 | `npm run db:migrate` | 1 | ✅ pass | 905ms |
| 5 | `node scripts/verify-deployment.mjs --base-url "$SYNESTHESIA_PUBLIC_BASE_URL" --cron-secret "$CRON_SECRET" --admin-secret "$ADMIN_SECRET"` | 1 | ❌ fail | 66ms |


## Deviations

Touched src/db/index.ts, src/db/migrate.ts, and drizzle.config.ts in addition to the planner's explicit output files so the shared helper became the real single source of truth and the build remained green. Appended one non-obvious runtime/import note to .gsd/KNOWLEDGE.md because Node 22 strip-types behavior materially affected the implementation.

## Known Issues

scripts/verify-deployment.mjs and the smoke verification flow do not exist yet, so the slice-level live-proof command still fails until T02 lands. npm run db:migrate now fails correctly when DATABASE_URL is absent; a real Neon connection string will still be required in T03 for live proof.

## Files Created/Modified

- `.env.example`
- `src/lib/deployment/env.ts`
- `src/__tests__/deployment/env-contract.test.ts`
- `package.json`
- `src/db/index.ts`
- `src/db/migrate.ts`
- `drizzle.config.ts`
- `.gsd/KNOWLEDGE.md`


## Deviations
Touched src/db/index.ts, src/db/migrate.ts, and drizzle.config.ts in addition to the planner's explicit output files so the shared helper became the real single source of truth and the build remained green. Appended one non-obvious runtime/import note to .gsd/KNOWLEDGE.md because Node 22 strip-types behavior materially affected the implementation.

## Known Issues
scripts/verify-deployment.mjs and the smoke verification flow do not exist yet, so the slice-level live-proof command still fails until T02 lands. npm run db:migrate now fails correctly when DATABASE_URL is absent; a real Neon connection string will still be required in T03 for live proof.
