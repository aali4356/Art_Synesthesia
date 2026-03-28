# M005 Research — Public Launch Readiness

## Executive summary

M005 should treat **Vercel + Neon as the canonical public-launch path** and should retire launch risk in three passes: (1) make the real deployed runtime build and run with an explicit environment contract, (2) prove production diagnostics and operator controls in that same deployed shape, and (3) finish with public-route acceptance plus a launch runbook/checklist.

The earlier build blocker that motivated this milestone is no longer the top risk in local code: `npm run build` now passes in the current workspace. The remaining launch risk is broader and more realistic: there is still **no explicit deployment/runbook artifact, no checked-in env contract file, no canonical production setup documentation, and no proof yet that the deployed app shape has been exercised with provisioned services instead of local no-DB fallback behavior**.

## What I verified in code

### 1) The codebase is already biased toward Vercel + Neon

Evidence:
- `package.json` uses `next build`, `next start`, Next.js 16, React 19, Drizzle, and `@neondatabase/serverless`.
- `src/db/index.ts` is a Neon HTTP + Drizzle singleton.
- `vercel.json` already defines a Vercel cron hitting `/api/cron/cleanup`.
- `drizzle.config.ts` and `src/db/migrate.ts` assume `DATABASE_URL`-driven migration flow.

Implication:
- The roadmap should stop treating hosting target as ambiguous. The project already structurally prefers **Vercel deployment with Neon-backed Postgres**.

### 2) Build-time fragility is improved, but runtime/env contract is still under-documented

Evidence:
- `npm run build` completed successfully in the current workspace.
- `src/lib/cache/db-cache.ts` now lazy-loads DB modules rather than importing them eagerly at module evaluation time.
- Several DB-backed routes/pages now import DB access through async helpers and catch backend failures into truthful unavailable states.

Implication:
- M005 should not spend its first slice on speculative architecture churn. It should instead ship a **real deployment/environment contract** that makes the already-repaired runtime shape operable and repeatable.

### 3) DB-backed public surfaces still fundamentally require provisioned runtime secrets

Evidence:
- `src/db/index.ts` still throws immediately if `DATABASE_URL` is missing.
- Share, gallery, admin review, and cron routes depend on DB access or runtime secrets.
- `src/app/share/[id]/page.tsx`, `src/app/gallery/[id]/page.tsx`, and gallery API routes convert backend absence into branded unavailable states rather than silent crashes.

Implication:
- Local no-DB proof mode remains a legitimate fallback for development and narrative proof, but it is **not acceptable as the final launch proof target**. One slice must explicitly prove the product in a provisioned environment.

### 4) Observability seams exist, but production setup is incomplete

Evidence:
- Client observability is wired through `src/components/observability/ObservabilityProvider.tsx` using `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, and `NEXT_PUBLIC_SENTRY_DSN`.
- Server observability is wired through `src/lib/observability/server.ts` using `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`.
- Privacy filtering and route failure categorization already exist.

Implication:
- M005 does not need to invent telemetry architecture; it needs to **finish deployment wiring, prove sanitized event/error flow in a real environment, and document operational response paths**.

### 5) Operator-only boundaries exist but are not yet packaged as a launch runbook

Evidence:
- `/api/cron/cleanup` requires `CRON_SECRET`.
- `/api/admin/review` requires `ADMIN_SECRET`.
- There is no checked-in README / deploy / runbook document in the project root establishing setup order, required env vars, migration flow, smoke checks, rollback guidance, or operator tasks.

Implication:
- Launch readiness is currently limited more by **missing operational artifacts** than by missing product UI.

## Active requirement analysis

### R005 — public launch readiness
- **Table stakes:** a real deployed environment, documented setup, public-route smoke coverage, and confidence that the flagship flows do not rely on local proof-only assumptions.
- **Missing today:** explicit deploy/runbook artifacts and provisioned-environment acceptance proof.

### R006 — reliable build/deploy flows
- **Table stakes:** documented env contract, reproducible build path, migration/deploy order, and no hidden dependency on ad-hoc local machine state.
- **Missing today:** checked-in env contract (`.env.example`-style guidance or equivalent), deployment instructions, and explicit verification of the provisioned path.

### R004 — coherent primary user loop
- **Still relevant:** launch hardening must not regress Home → Results → Share/Gallery/Compare continuity.
- **M005 role:** not to redesign the loop, but to prove the polished loop survives the production/runtime boundary.

## Boundary contracts that matter

1. **Next.js route/page import boundary → DB bootstrap**
   - `src/db/index.ts` is intentionally strict and should remain request-time / provision-time dependent, not silently mocked in production.

2. **Public browser runtime → DB-backed share/gallery surfaces**
   - Share and gallery must work with a real database in the canonical launch environment, not only degrade gracefully without one.

3. **Browser/client events → PostHog/Sentry privacy filter**
   - M004 already established redaction ownership. M005 should reuse it, not fork it.

4. **Platform scheduler → cleanup cron route**
   - `vercel.json` and `/api/cron/cleanup` imply Vercel Cron as the intended cleanup mechanism; this needs end-to-end verification and documentation.

5. **Operator/admin boundary → moderation review route**
   - `ADMIN_SECRET`-protected flows need setup and verification guidance so launch support is actually usable.

## Recommended slice shape

### S01 — Canonical deploy/env contract and live backend path
Retire the highest risk first by making the real Vercel+Neon deployment path explicit, reproducible, and verified. This slice should leave the app building and serving DB-backed public routes in the intended environment with documented env/migration/setup order.

### S02 — Production diagnostics and operator controls
Build on the deployed runtime from S01 and turn observability/admin/cron into real operator capabilities: wired secrets, sanitized telemetry proof, cron verification, and admin-access/runbook coverage.

### S03 — Public launch acceptance and release package
Finish with an end-to-end public-route acceptance pass, launch checklist, rollback/support guidance, and a clean narrative package proving the flagship portfolio experience is launchable.

## Skill discovery notes

Installed skills already relevant to this milestone:
- `react-best-practices` / `vercel-react-best-practices` — relevant for Next.js/React runtime review.
- `github-workflows` — relevant if CI/deploy automation is expanded.

Promising external skills discovered (not installed):
- `npx skills add sickn33/antigravity-awesome-skills@vercel-deployment` — highest-signal Vercel deployment skill found (~1K installs).
- `npx skills add getsentry/sentry-agent-skills@sentry-react-setup` — strongest directly relevant Sentry setup skill found (~1K installs).
- `npx skills add posthog/posthog-for-claude@posthog-instrumentation` — strongest directly relevant PostHog instrumentation skill found (~492 installs).

## Secrets forecast

Likely external/provisioned secrets for this milestone:
- `DATABASE_URL` (Neon)
- `NEXT_PUBLIC_POSTHOG_KEY` (PostHog)
- `NEXT_PUBLIC_SENTRY_DSN` and/or `SENTRY_DSN` (Sentry)
- `SENTRY_AUTH_TOKEN` if source maps / release automation are part of launch setup

Non-third-party but required runtime secrets likely still need documentation and generation guidance during execution:
- `ADMIN_SECRET`
- `CRON_SECRET`

## Recommendation

Plan M005 as **three slices, ordered by risk**:
1. real deployment/env contract and live backend path,
2. production diagnostics/operator controls,
3. final public launch acceptance + runbook.

That ordering matches the actual remaining uncertainty in the codebase: the app is already visually coherent and locally buildable, but it is not yet operationally packaged and proven as a public launch artifact.