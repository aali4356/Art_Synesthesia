---
estimated_steps: 23
estimated_files: 8
skills_used:
  - best-practices
  - react-best-practices
  - test
---

# T01: Establish the env-gated observability foundation and privacy filter

Create the shared observability seam that every later task can call without duplicating privacy rules. This task should introduce the env-optional provider/helper structure, central event taxonomy, and defensive redaction/filtering contract before any product surface starts emitting signals.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| PostHog / Sentry SDK init | Fall back to no-op provider/helpers so the app still renders with no env vars set. | Skip capture and keep the UI/runtime path unchanged. | Drop the payload and record only a local debug-safe classification, never raw values. |
| Environment config | Treat missing keys as observability-disabled, not a runtime failure. | Keep providers inert and avoid retry loops. | Ignore invalid config values and default to disabled/manual capture only. |

## Load Profile

- **Shared resources**: browser SDK event queues and route-handler error capture hooks.
- **Per-operation cost**: one provider mount plus lightweight property filtering/manual capture helpers.
- **10x breakpoint**: event spam from downstream callers; the shared taxonomy/filtering seam must make sampling and drop behavior easy before launch traffic increases.

## Negative Tests

- **Malformed inputs**: telemetry payloads containing `inputText`, canonical URLs, dataset bodies, or gallery preview text are stripped or rejected.
- **Error paths**: missing env vars and disabled SDK setup leave the app runnable with no thrown initialization errors.
- **Boundary conditions**: intentional local no-DB proof-mode errors are tagged distinctly so later tasks can filter them from incident noise.

## Steps

1. Add the required analytics/error-monitoring dependencies and create one shared observability module family under `src/lib/observability/` for event names, privacy filtering, and client/server capture helpers.
2. Add an env-gated provider composition seam in the root app layout so PostHog pageviews/manual capture can turn on only when configured and remain inert otherwise.
3. Encode the privacy contract centrally: strip raw source fields, canonical URLs, dataset bodies, preview hints, and any replay-grade properties before a payload is sent or error context is attached.
4. Add focused tests proving the redaction/no-env contract before downstream task wiring begins.

## Must-Haves

- [ ] Missing telemetry env vars keep the app bootable and leave observability as a no-op.
- [ ] One shared helper owns event names and payload redaction so later tasks cannot drift.
- [ ] The test seam proves unsafe properties are stripped before any SDK receives them.

## Inputs

- ``package.json` — current dependency list has no analytics or error-monitoring SDKs.`
- ``src/app/layout.tsx` — clean root composition seam for an env-gated provider wrapper.`
- ``src/hooks/useTextAnalysis.ts` — representative downstream client caller that will consume the shared helper after this task.`
- ``src/app/api/analyze-url/route.ts` — representative server/route-handler failure seam that will consume server capture later.`

## Expected Output

- ``package.json` — observability dependencies declared.`
- ``src/app/layout.tsx` — root layout wired to the env-gated observability provider.`
- ``src/components/observability/ObservabilityProvider.tsx` — client provider wrapper for manual analytics/pageview setup.`
- ``src/lib/observability/events.ts` — canonical event names and safe property builders.`
- ``src/lib/observability/privacy.ts` — shared redaction/filtering helpers.`
- ``src/lib/observability/client.ts` — browser-safe capture helpers/no-op fallback.`
- ``src/lib/observability/server.ts` — server/route-handler capture helpers/no-op fallback.`
- ``src/__tests__/observability/privacy-filtering.test.ts` — executable privacy/no-env contract coverage.`

## Verification

npm test -- --run src/__tests__/observability/privacy-filtering.test.ts

## Observability Impact

- Signals added/changed: central safe-event taxonomy, redaction filter verdicts, and no-op fallbacks for disabled environments.
- How a future agent inspects this: run `npm test -- --run src/__tests__/observability/privacy-filtering.test.ts` and review the shared helper modules under `src/lib/observability/`.
- Failure state exposed: unsafe telemetry properties are dropped before emission and missing env vars no longer masquerade as product failures.
