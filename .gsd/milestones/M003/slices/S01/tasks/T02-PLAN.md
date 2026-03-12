---
estimated_steps: 5
estimated_files: 6
---

# T02: Redesign the landing and generation entry as an editorial branded surface

**Slice:** S01 — Editorial landing, generation, and results journey
**Milestone:** M003

## Description

Turn the homepage empty state into a distinct editorial gallery-luxe launch surface that clearly communicates the product’s value while preserving the existing text/URL/data generation affordances and progress behavior. This task closes the R003/R009 gap on first impression and creates the branded language the results surface must inherit.

## Steps

1. Rework `src/app/page.tsx` so the empty state uses a strong editorial composition, premium hierarchy, and clear launch-facing narrative around the real generation entrypoint rather than a placeholder square and one-line tagline.
2. Reframe `src/components/input/InputZone.tsx` as a branded control surface that keeps all three tabs, preserves keyboard-usable generation, and makes privacy/local-analysis messaging legible inside the new composition.
3. Upgrade `src/components/layout/Header.tsx` and `src/components/layout/Shell.tsx` so the top-level chrome reinforces the same product story and premium pacing instead of remaining purely neutral.
4. Improve `src/app/layout.tsx` metadata and root narrative copy so the premium positioning begins at the app boundary, not only inside the page body.
5. Normalize or add the shared surface/action/background utility semantics required by the redesigned landing state in `src/app/globals.css`, without drifting toward generic SaaS styling.

## Must-Haves

- [ ] The landing state clearly answers what Synesthesia Machine is, why it is distinct, and how to start using the actual product controls.
- [ ] Text, URL, and data entry remain available and legible in the new composition, with truthful private/local messaging preserved.
- [ ] The styling changes establish reusable branded surface/action semantics instead of one-off page-only fixes.

## Verification

- `npm test -- src/__tests__/app/home-editorial-flow.test.tsx`
- Manually inspect the rendered homepage in-browser after implementation to confirm the editorial composition and generation controls coexist cleanly.

## Observability Impact

- Signals added/changed: Landing-state narrative, input affordance labels, and progress framing become explicit UI inspection seams for first-run diagnosis.
- How a future agent inspects this: Open the homepage or run the homepage test to verify branded narrative and control availability.
- Failure state exposed: Missing product framing, inaccessible controls, or styling-token drift appears immediately on the landing route.

## Inputs

- `src/app/page.tsx` — current homepage composition and progress placement.
- `src/components/input/InputZone.tsx` — existing multi-input behavior that must remain intact inside the redesign.
- `src/app/globals.css` — current thin token layer and missing semantic utility coverage noted in slice research.

## Expected Output

- `src/app/page.tsx` — branded editorial landing composition wired to the existing generation flow.
- `src/components/input/InputZone.tsx` — premium control surface preserving text/URL/data behavior.
- `src/components/layout/{Header,Shell}.tsx` and `src/app/layout.tsx` — aligned shell and metadata posture.
- `src/app/globals.css` — normalized surface/action tokens supporting the landing redesign.
