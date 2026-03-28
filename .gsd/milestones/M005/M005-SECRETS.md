# Secrets Manifest

**Milestone:** 
**Generated:** 

### DATABASE_URL

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to Neon and create or open the production project for Synesthesia Machine.
2. Open the project dashboard and go to the connection details / connection string panel.
3. Choose the pooled/serverless connection string appropriate for Vercel serverless usage.
4. Copy the full connection string.
5. Store it as `DATABASE_URL` in the Vercel project environment.

### NEXT_PUBLIC_POSTHOG_KEY

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to PostHog and open the Synesthesia Machine project.
2. Navigate to Project settings → API keys.
3. Copy the project API key used by the browser SDK.
4. Confirm the project region/host that matches the key.
5. Store the key as `NEXT_PUBLIC_POSTHOG_KEY` in the Vercel project environment.

### NEXT_PUBLIC_SENTRY_DSN

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to Sentry and open the project that will receive client-side events.
2. Go to the project settings page and open the Client Keys (DSN) section.
3. Copy the DSN for the project.
4. Verify it targets the intended organization/project for public-browser events.
5. Store it as `NEXT_PUBLIC_SENTRY_DSN` in the Vercel project environment.

### SENTRY_DSN

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to Sentry and open the project that will receive server-side route/runtime events.
2. Go to the project settings page and open the Client Keys (DSN) section.
3. Copy the DSN for the project.
4. Decide whether the same DSN will be shared with the public client or whether a separate server project is preferred.
5. Store it as `SENTRY_DSN` in the Vercel project environment.

### SENTRY_AUTH_TOKEN

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to Sentry and open Account settings → API → Auth Tokens.
2. Create a new auth token with the minimum scopes needed for release/source-map automation.
3. Name it for the Synesthesia Machine launch environment.
4. Copy the token immediately after creation.
5. Store it as `SENTRY_AUTH_TOKEN` in the Vercel project environment if release automation/source-map upload is enabled during execution.
