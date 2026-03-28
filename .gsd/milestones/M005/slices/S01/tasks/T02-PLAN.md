---
estimated_steps: 24
estimated_files: 4
skills_used:
  - best-practices
  - test
---

# T02: Add executable migration and deployed smoke verification tooling

Make the canonical deployment path executable instead of handwritten. Build a testable smoke-verification library plus a CLI script that can target a provisioned URL, create DB-backed share/gallery proof records through the real app, verify those public routes render real data instead of branded no-DB fallbacks, and confirm the cron/admin boundaries reject and accept requests according to their secrets.

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

## Inputs

- ``package.json``
- ``src/app/api/share/route.ts``
- ``src/app/api/gallery/route.ts``
- ``src/app/api/cron/cleanup/route.ts``
- ``src/app/api/admin/review/route.ts``
- ``src/app/share/[id]/page.tsx``
- ``src/app/gallery/[id]/page.tsx``
- ``src/components/viewers/BrandedViewerScaffold.tsx``

## Expected Output

- ``package.json``
- ``scripts/verify-deployment.mjs``
- ``src/lib/deployment/smoke.ts``
- ``src/__tests__/deployment/smoke.test.ts``

## Verification

npm test -- --run src/__tests__/deployment/smoke.test.ts

## Observability Impact

- Signals added/changed: smoke runs should emit structured per-step pass/fail output for share, gallery, cron, and admin checks.
- How a future agent inspects this: execute `node scripts/verify-deployment.mjs ...` and read the named step results.
- Failure state exposed: route name, status code, timeout, malformed response, or fallback-marker detection are surfaced directly.
