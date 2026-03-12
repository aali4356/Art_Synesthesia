# S04: Live Art Quality Integration Proof — UAT

**Milestone:** M002
**Written:** 2026-03-12

## UAT Type

- UAT mode: mixed
- Why this mode is sufficient: S04 required both live runtime interaction with the real app and durable artifact capture proving that the upgraded art system is wired into browser-visible results behavior across supported flows.

## Preconditions

- Local dev server running for this project on `http://127.0.0.1:3001`
- Browser opened against the Synesthesia Machine app, not the unrelated local site occupying `localhost:3000`
- No `DATABASE_URL` configured locally, so URL analysis is expected to prove blocked-state diagnostics rather than success

## Smoke Test

Open the app, submit a real text prompt, and confirm that the results surface renders with a visible `proof diagnostics` card.

## Test Cases

### 1. Text flow exposes live proof diagnostics and upgraded style expression

1. Open `http://127.0.0.1:3001`.
2. Enter `Rain-slick neon alley where saxophone echoes through midnight fog.` in the text input.
3. Click `Generate`.
4. Confirm the results surface appears.
5. Confirm `proof diagnostics` is visible and includes `proof source: text`, palette family, mapping posture, and supported styles.
6. Switch to `Organic` and confirm diagnostics update to `active style: organic` with organic expressiveness rows.
7. Switch to `Typographic` and confirm diagnostics update to `active style: typographic` with typographic expressiveness rows.
8. **Expected:** Text flow reaches the real results surface, diagnostics are visible, and both organic and typographic styles show upgraded expressiveness metadata.

### 2. Data flow preserves live proof diagnostics and typographic disablement

1. Return to `New input`.
2. Switch to the `Data` tab.
3. Paste:
   - `city,pulses,temperature`
   - `nyc,81,0.82`
   - `tokyo,74,0.61`
   - `lagos,88,0.91`
4. Click `Analyze`.
5. Confirm the results surface appears.
6. Confirm `proof diagnostics` is visible with `proof source: data`.
7. Confirm supported styles indicate `typographic unavailable for data inputs`.
8. **Expected:** Data flow reaches the real results surface and preserves the required style-availability contract.

### 3. URL flow exposes the real blocked runtime state

1. Return to `New input`.
2. Switch to the `URL` tab.
3. Enter `https://example.com`.
4. Click `Analyze`.
5. Observe the failed result state.
6. Inspect browser/network/server diagnostics.
7. **Expected:** URL flow does not silently fail; it surfaces a browser-visible error, `POST /api/analyze-url` returns 500, and server logs expose `DATABASE_URL is not set`.

## Edge Cases

### Competing local app on default port

1. Attempt to use `http://localhost:3000`.
2. If the page title is not `Synesthesia Machine`, switch to `http://127.0.0.1:3001`.
3. **Expected:** Verification proceeds only against the actual project app, avoiding false proof from an unrelated local site.

## Failure Signals

- `proof diagnostics` missing from results after successful generation or analysis
- Text flow missing `proof source: text`
- Data flow missing `proof source: data` or failing to show typographic unavailability
- Organic or typographic tab activation not reflected in live diagnostics
- URL flow failing without a visible browser error, missing network 500, or missing actionable server-side root cause
- `npm run build` failing during closeout

## Requirements Proved By This UAT

- R001 — The upgraded palette-family system is visible in real browser results through live proof diagnostics on contrasting text and data inputs.
- R005 — Milestone closeout now has live runtime evidence, explicit assertions, and durable browser artifacts.
- R007 — The app exposes enough runtime diagnostics to distinguish working text/data flows from the blocked URL path.

## Not Proven By This UAT

- R003 — This UAT does not prove the broader gallery-luxe site redesign or premium brand shell targeted for M003.
- Full green local URL analysis without `DATABASE_URL` — this remains blocked and was documented rather than hidden.
- Production deploy readiness beyond the slice build/test/browser gates run here.

## Notes for Tester

- In this environment, `localhost:3000` belongs to a different local Next.js app; use `127.0.0.1:3001` for truthful S04 verification.
- The debug bundle for this UAT is stored at:
  - `.artifacts/browser/2026-03-12T19-08-05-412Z-m002-s04-live-proof`
- The URL-path blocker is real and currently user-facing as `Unknown error`; trust the network log and server highlight as the authoritative root-cause signals.
