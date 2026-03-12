# M002/S01 — Research

**Date:** 2026-03-11

## Summary

This slice primarily owns **R001 — Artwork palette families feel rich, varied, and non-repetitive** and directly sets up **R002 — Synesthesia mapping feels more emotionally expressive and art-directed** by defining the palette-family contract S02 will consume. The current implementation is deterministic and contrast-safe, but it is still fundamentally a **single continuous hue sweep plus one of four harmony templates**, not a true curated family system. That architecture explains the user complaint: even when outputs differ numerically, they are still drawn from the same narrow generative grammar centered on `warmth`, `saturation`, `contrast`, and a small harmony switch.

The main recommendation is to evolve `src/lib/color/palette.ts` from a single algorithm into a **two-stage palette pipeline**: **(1) deterministic family selection and family metadata derivation**, then **(2) family-specific palette realization** built on the existing `harmony`, `dedup`, and `contrast` primitives. This preserves M001’s determinism and safety guarantees while giving S01 a real chance to materially reduce repetition. The current tests prove validity, contrast, and determinism, but they do **not** prove diversity. S01 therefore needs new tests that assert: multiple named families are reachable, family identity is deterministic, families occupy materially different hue/chroma/lightness territory, and the same vector/seed still reproduces the same family + palette.

## Recommendation

Implement S01 around a **first-class palette family contract** in `src/lib/color/*`.

Recommended shape:
- Add deterministic family selection based on `ParameterVector` + seed-derived jitter.
- Extend `PaletteResult` with family-level metadata (for example: `familyId`, `familyName`, `temperature`, `mood`, `baseHueBand`, or similar stable descriptors).
- Keep `adjustForMode()` and `rejectNearDuplicates()` as downstream enforcement layers rather than replacing them.
- Reuse the existing pipeline wiring in `useTextAnalysis`, `useUrlAnalysis`, `useDataAnalysis`, `ResultsView`, `GalleryViewer`, and `CompareMode`; they already consume `generatePalette()` everywhere, so S01 can remain centered on the color contract.
- Add diversity-focused tests in `src/__tests__/color/` rather than trying to prove artistic quality only through renderer tests.

This approach is the lowest-risk route to satisfy R001 because the palette system is already the shared integration seam for text, URL, and data inputs. If palette-family identity is added here, S02 can later map emotional intent into family selection without having to redesign the color API again.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Perceptual color math and gamut handling | `culori` (`oklch`, `clampChroma`, `wcagContrast`, LAB deltaE) | Already integrated, matches D006, and is the right foundation for perceptual palette-family comparisons. |
| Deterministic randomness | `createPRNG()` / `seedrandom` path already used in `generatePalette()` | Preserves D002/D003 and avoids introducing hidden nondeterminism into family selection. |
| Contrast enforcement | `adjustForMode()` in `src/lib/color/contrast.ts` | Keeps dark/light accessibility guarantees intact while allowing richer upstream family logic. |
| Near-duplicate rejection | `rejectNearDuplicates()` in `src/lib/color/dedup.ts` | Prevents same-family palettes from collapsing perceptually, though thresholding may need family-aware review. |

## Existing Code and Patterns

- `src/lib/color/palette.ts` — current palette generator. It already centralizes count, hue derivation, chroma, harmony selection, deduplication, and mode adjustments. This is the correct seam for introducing family selection instead of scattering logic across renderers.
- `src/lib/color/harmony.ts` — currently only four harmony types with threshold-based selection from `symmetry`, `contrast`, and `energy`. Useful as a primitive, but too limited to represent the “wide curated deterministic palette families” decision on its own.
- `src/lib/color/contrast.ts` — hard safety layer. Family work should feed into this, not bypass it.
- `src/lib/color/dedup.ts` — LAB-space deltaE duplicate rejection. Good baseline, but research indicates it can silently reduce palette count diversity if families are too tightly clustered.
- `src/hooks/useTextAnalysis.ts` — text pipeline computes vector then immediately calls `generatePalette(vector, seed)`.
- `src/hooks/useUrlAnalysis.ts` — URL pipeline uses the same palette entrypoint; S01 changes here automatically propagate to URL generations.
- `src/hooks/useDataAnalysis.ts` — data pipeline also uses the same palette entrypoint, so family logic must remain generic across input types.
- `src/components/results/ResultsView.tsx` — all style scenes are built from the shared `result.palette`; this means S01 can change the visual outcome of every style without renderer rewrites.
- `src/components/results/StyleSelector.tsx` — thumbnails render completed scenes only; there is currently no palette-family visibility in the UI contract, which is fine for S01 but worth noting for later proof/debugging.
- `src/__tests__/color/palette.test.ts` — current tests prove correctness, not variety. Best place to add family reachability and diversity assertions.
- `src/lib/pipeline/mapping.ts` — current mappings expose `warmth`, `saturation`, `contrast`, `paletteSize`, `energy`, etc. S01 should consume these more expressively before S02 changes any mapping semantics.

## Constraints

- **Determinism is non-negotiable.** `generatePalette(params, seed)` is called across text, URL, data, gallery, compare, and results flows. Same input must still produce the same family and colors.
- **Contrast cannot regress.** `adjustForMode()` currently enforces WCAG >= 3.0 against dark/light backgrounds; family-specific logic must preserve this postcondition.
- **The palette API is shared broadly.** `PaletteResult` is consumed in renderers, compare flows, and tests. Any metadata expansion is fine, but breaking the existing `dark`, `light`, `harmony`, `count` contract would create unnecessary surface-area risk.
- **Current parameter mappings are still scalar and generic.** S01 should not assume new analyzer signals. It must derive broader family behavior from the existing `ParameterVector` dimensions.
- **The family system must serve all three pipelines.** Text, URL, and data all converge on the same palette generator, so families cannot rely on text-only semantics.

## Common Pitfalls

- **Mistaking wider hue spread for true family diversity** — the current system already jitters hue, but still feels repetitive because all outputs come from the same base-hue sweep + harmony formula. Add named or explicitly differentiated family behaviors, not just more jitter.
- **Letting contrast adjustment erase family identity** — if family realization generates colors too close to mode boundaries, `adjustForMode()` may normalize them into a similar look. Families should be designed with enough lightness/chroma separation to survive final mode adjustment.
- **Using only `warmth` as the family selector** — current base hue is almost entirely warmth-driven, which is exactly why outputs cluster into related temperature bands. Family selection should also involve other stable vector traits such as energy, symmetry, rhythm, texture, density, or regularity.
- **Relying on harmony type as the family label** — four harmony modes are too coarse and too structurally similar to satisfy R001. Harmony can be one property inside a family, not the family system itself.
- **Adding tests that only check existence of metadata** — S01 tests must prove diversity properties, not just that `familyId` exists.

## Open Risks

- Family-specific hue/chroma profiles may interact badly with `rejectNearDuplicates()` and reduce palette count below intent, especially for narrow/moody families.
- Existing scalar mappings may not distribute inputs broadly enough across families, producing deterministic but still skewed family selection frequencies.
- If family metadata is added but not used in tests or diagnostics, S02/S03 may have weak observability when trying to prove real aesthetic improvement.
- Some renderers may visually flatten subtle family differences even if the palette layer improves; S01 should focus on making family distinctions strong enough to survive downstream rendering.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js | `vercel-react-best-practices` | installed |
| Next.js | `wshobson/agents@nextjs-app-router-patterns` | available — install via `npx skills add wshobson/agents@nextjs-app-router-patterns` |
| Vitest | `onmax/nuxt-skills@vitest` | available — install via `npx skills add onmax/nuxt-skills@vitest` |
| Culori | none found | none found |

## Sources

- Current S01 requirement ownership and proof target come from preloaded milestone roadmap/context and requirements (source: preloaded GSD context in this session).
- The palette system is currently a single deterministic generator with `count`, `baseHue` from `warmth`, scalar `chroma` from `saturation`, harmony selection, deduplication, and dark/light adjustment (source: `src/lib/color/palette.ts`).
- Harmony selection is currently limited to `analogous`, `complementary`, `triadic`, and `split-complementary`, driven only by threshold checks on `symmetry`, `contrast`, and `energy` (source: `src/lib/color/harmony.ts`).
- Contrast guarantees are enforced centrally through `adjustForMode()` and `ensureContrast()` using `culori` WCAG calculations (source: `src/lib/color/contrast.ts`).
- Deduplication currently uses LAB-space CIEDE2000 deltaE with hue shifting in 10-degree increments, which helps uniqueness but is not a family model (source: `src/lib/color/dedup.ts`).
- Text, URL, and data hooks all converge on the same `generatePalette()` entrypoint, making the palette contract the right S01 integration seam (sources: `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`).
- Live results and thumbnails already depend on the shared palette via scene builders, so S01 changes will propagate across all styles without UI rewiring (sources: `src/components/results/ResultsView.tsx`, `src/components/results/StyleSelector.tsx`).
- Current palette tests verify determinism, contrast, validity, duplicate rejection, and harmony thresholds, but do not verify palette-family diversity or reduced repetition (source: `src/__tests__/color/palette.test.ts`).
