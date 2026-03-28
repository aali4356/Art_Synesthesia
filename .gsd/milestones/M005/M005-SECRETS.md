# Secrets Manifest

**Milestone:** M005
**Generated:** 2026-03-28

This manifest tracks launch-critical secrets and bindings for the canonical Vercel + Neon path.

## Current execution status

- `ADMIN_SECRET`: collected locally during T03
- `CRON_SECRET`: collected locally during T03
- `DATABASE_URL`: still missing
- `SYNESTHESIA_PUBLIC_BASE_URL`: still missing
- `VERCEL_TOKEN`: not provided
- `VERCEL_ORG_ID`: not provided
- `VERCEL_PROJECT_ID`: not provided
- Vercel project binding: not detected in workspace
- Live Vercel proof: blocked

### DATABASE_URL

**Service:** Neon
**Status:** blocked
**Destination:** dotenv + Vercel

1. Open the Neon production project for Synesthesia Machine.
2. Copy the pooled/serverless Postgres connection string.
3. Apply it locally for operator commands.
4. Apply it to the Vercel project environment.
5. Re-run `npm run db:migrate` before any smoke attempt.

### ADMIN_SECRET

**Service:** operator auth
**Status:** applied locally
**Destination:** dotenv + Vercel

1. Keep the collected value aligned with the deployed runtime.
2. Ensure the same secret is configured in the Vercel project.
3. Use it for `/api/admin/review` smoke verification.

### CRON_SECRET

**Service:** cron auth
**Status:** applied locally
**Destination:** dotenv + Vercel

1. Keep the collected value aligned with the deployed runtime.
2. Ensure the same secret is configured in the Vercel project.
3. Use it for `/api/cron/cleanup` smoke verification.

### SYNESTHESIA_PUBLIC_BASE_URL

**Service:** Vercel public runtime
**Status:** blocked
**Destination:** dotenv

1. Record the real promoted deployment URL.
2. Prefer the production/custom-domain URL if one exists.
3. Use it for `node scripts/verify-deployment.mjs --base-url ...`.

### VERCEL_TOKEN

**Service:** Vercel operator access
**Status:** not provided
**Destination:** dotenv

1. Provide only if CLI/API-based deployment management is required.
2. It must be able to access the intended Vercel project/team.

### VERCEL_ORG_ID

**Service:** Vercel project binding
**Status:** not provided
**Destination:** dotenv

1. Provide if the local workflow depends on explicit org/project binding.
2. Keep aligned with the actual Vercel project.

### VERCEL_PROJECT_ID

**Service:** Vercel project binding
**Status:** not provided
**Destination:** dotenv

1. Provide if the local workflow depends on explicit org/project binding.
2. Keep aligned with the actual Vercel project.

### NEXT_PUBLIC_POSTHOG_KEY

**Service:** PostHog
**Status:** optional / not collected
**Destination:** dotenv + Vercel

1. Open the Synesthesia Machine PostHog project.
2. Copy the browser project API key.
3. Pair it with the correct `NEXT_PUBLIC_POSTHOG_HOST`.

### NEXT_PUBLIC_SENTRY_DSN

**Service:** Sentry (client)
**Status:** optional / not collected
**Destination:** dotenv + Vercel

1. Open the client/browser Sentry project.
2. Copy the DSN.
3. Apply only if browser-side error reporting is desired.

### SENTRY_DSN

**Service:** Sentry (server)
**Status:** optional / not collected
**Destination:** dotenv + Vercel

1. Open the server/runtime Sentry project.
2. Copy the DSN.
3. Apply only if server-side error reporting is desired.

### SENTRY_AUTH_TOKEN

**Service:** Sentry release automation
**Status:** optional / not collected
**Destination:** dotenv + Vercel

1. Create or reuse a minimally scoped auth token.
2. Apply only if source-map/release upload is enabled.
