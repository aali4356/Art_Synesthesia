# Secrets Manifest

**Milestone:** 
**Generated:** 

### NEXT_PUBLIC_POSTHOG_KEY

**Service:** 
**Status:** collected
**Destination:** dotenv

1. Sign in to PostHog Cloud and open the target project.
2. Go to **Project settings**.
3. Open the **Project API Keys** section.
4. Copy the project token intended for the web app.
5. Store it as `NEXT_PUBLIC_POSTHOG_KEY`.

### NEXT_PUBLIC_SENTRY_DSN

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to Sentry and open the target organization.
2. Create or open the project that will receive Next.js errors.
3. Open the project **Settings** or SDK setup page.
4. Copy the client/server DSN shown for the project.
5. Store it as `NEXT_PUBLIC_SENTRY_DSN`.

### SENTRY_AUTH_TOKEN

**Service:** 
**Status:** skipped
**Destination:** dotenv

1. Sign in to Sentry and open **Settings → Account → API → Auth Tokens**.
2. Create a new auth token for Next.js build/release tasks.
3. Grant the minimal scopes needed for release or sourcemap upload workflows.
4. Copy the token once at creation time.
5. Store it as `SENTRY_AUTH_TOKEN`.
