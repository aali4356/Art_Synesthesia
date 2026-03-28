# Knowledge

## M003 — Signature Product Experience

- Solve the highest-risk continuity seam first. In this codebase, the milestone only started compounding once the real homepage and real results surface were treated as one product journey instead of a hero plus a tool screen.
- Shared shell/action/viewer primitives are the leverage point for premium redesign work. The editorial system held because downstream routes consumed the same tokens and scaffold patterns instead of inventing route-local restyles.
- Truthful diagnostics improve, rather than weaken, premium positioning. Branded unavailable states and inspectable backend limits preserved trust while keeping operational gaps visible.
- Cross-route aesthetic goals need executable proof. Route-family tests turned subjective coherence claims into regression-resistant acceptance criteria and made later polish safer.

## M004 — Anonymous-first continuity

- Treat returning-user continuity as edition-family recall, not raw-session replay. Persisting parameter-safe snapshots, palette metadata, preferred style, and derived source labels was enough to reopen useful results while preserving the private-first contract.
- Put continuity where returning users already are: the shared header and homepage. Reusing the existing shell/home seam made recent local work discoverable without inventing a new route or blurring it with public archive surfaces.
- Lock local-vs-public persistence language with tests, not just copy review. Cross-surface assertions over header, recent-local panel, share action, and gallery modal prevented regressions that would silently misstate privacy scope.
- If local browser verification hangs on `localhost:3000`, check for a stale Next dev listener before trusting the port. In this workspace, a dead `start-server.js` process can keep port 3000 open while never answering HTTP, so killing it and starting `npm run dev -- --port 3004` is a reliable recovery path.
- For repeat-use UX work, keep the copy contract executable across Home, Header, and Results instead of adding a separate acceptance seam. In this codebase, one shared regression bundle plus live browser checks caught whether browser-local continuity and public route wording still told the same story.
- If `src/app/api/analyze-url/route.ts` is exercised in local proof mode without `DATABASE_URL`, treat URL snapshot cache reads/writes as optional. Capturing the categorized cache failure while continuing uncached analysis preserves the real product loop and keeps no-DB proof mode from turning a cache dependency into a user-facing outage.
- For local browser proof on this repo, verify the port is serving Art_Synesthesia before trusting it. A reused localhost port can point to another Next app or an API stub; if that happens, kill stale Art_Synesthesia `next dev`/`start-server.js` processes, clear `.next/dev/lock`, and start a fresh dev server on an unused port such as `3010`.
- Modal focus restoration should target the actual opener element, not a generic fallback. Passing the Save to Gallery trigger into `GallerySaveModal` kept Escape/close behavior truthful in live proof and prevented keyboard users from losing their place in the results action loop.
- Launch-grade observability can be shipped before full production provisioning if the entire pipeline is env-optional and redaction-owned. In this repo, shared privacy filters plus inert-by-default PostHog/Sentry adapters let no-DB local proof and configured environments share one truthful telemetry contract.
- The strongest product-coherence proof was one combined regression bundle spanning continuity, onboarding, route-family copy, observability, and accessibility. Verifying these surfaces together caught boundary drift that isolated slice-local tests would have missed.
