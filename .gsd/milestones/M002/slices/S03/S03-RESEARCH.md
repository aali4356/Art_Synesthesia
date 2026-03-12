# M002/S03 — Research

**Date:** 2026-03-11

## Summary

S03 supports **R001** and **R002** and advances milestone-level proof toward **R005**. Its job is no longer to invent a new palette or mapping seam — S01 and S02 already did that. Its job is to make at least two renderer styles visibly consume `PaletteResult.mapping` so live results feel materially richer, more premium, and more art-directed without breaking determinism or collapsing style identity. The key implementation constraint is that the current renderers still behave as if S02 never happened: they consume palette colors and raw numeric parameters, but none of the scene builders read `palette.mapping`, `familyId`, `mood`, `chromaPosture`, or `contrastPosture` at all.

The codebase is well-positioned for this slice because `ResultsView` already rebuilds all four styles from the same `result.vector` and `result.palette`, and `PaletteResult.mapping` is already a stable downstream diagnostic seam. But that same architecture exposes the main risk: if S03 only tweaks palette colors or only adds new diagnostics, the live product will still feel flat because composition behaviors remain palette-agnostic. The strongest candidates for meaningful renderer expression upgrades are **organic** and **typographic**. Organic already has a richer composition model — gradient wash, flow-curve count, layering, width, and directionality — so mood/chroma/contrast can drive visible atmospheric change quickly. Typographic is the other strong candidate because it can translate mood into hierarchy, spacing, rotation discipline, and poster-like composition without changing pipeline entrypoints. Particle and geometric can still benefit, but they are currently better suited as secondary follow-ups than as the primary slice proof.

## Recommendation

Implement S03 as a **shared art-direction layer consumed by at least two scene builders**, not as four unrelated renderer rewrites. Keep `PaletteResult.mapping` authoritative and create a small renderer-facing interpretation boundary — either internal helper functions or a shared module — that translates `mood`, `familyId`, `chromaPosture`, `contrastPosture`, and `anchorHue` into composition decisions. Then apply that same contract to at least two renderers with clearly different visual languages.

The highest-probability path is:

1. **Organic renderer** — use mapping to control gradient richness, curve density, stroke-width posture, opacity depth, and directional drama.
2. **Typographic renderer** — use mapping to control word-count discipline, font-family/weight balance, dominant scale ratios, rotation looseness, and placement bias so outputs feel more like distinct editorial posters than generic word clouds.

This path best satisfies the roadmap requirement that two styles visibly benefit from the same upgraded art system while preserving style identity. It also creates a reusable interpretation seam that geometric and particle can consume later without duplicating mood heuristics.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Shared deterministic intent surface | `PaletteResult.mapping` from S02 | Already propagated through text, URL, and data flows; S03 should consume it directly instead of re-deriving mood from raw vector fields. |
| Cross-style renderer integration | `ResultsView` scene-building fanout using `result.vector` + `result.palette` | Lets S03 upgrade live outputs for all generation paths without changing hook contracts or app routing. |
| Deterministic randomness | `createPRNG()` with style-specific seed suffixes | Preserves determinism while allowing richer scene variation within a stable style. |
| Renderer verification baseline | Existing renderer scene tests + component tests + hook integration tests | S03 can extend real proof surfaces instead of inventing new bespoke validation infrastructure. |

## Existing Code and Patterns

- `src/components/results/ResultsView.tsx` — authoritative integration surface. All four scenes are rebuilt from `result.vector`, `result.palette`, theme, and derived style seeds. This is the slice’s real runtime seam; no new UI plumbing is needed for renderer expressiveness work.
- `src/components/results/StyleSelector.tsx` — thumbnail strip renders actual scene graphs via existing draw functions. S03 improvements here become immediately visible in both the main canvas and style previews.
- `src/lib/color/palette.ts` — palette generation now returns `familyId`, family diagnostics, and `mapping`. S03 should consume these fields rather than rebuilding aesthetic intent from parameters.
- `src/lib/color/synesthetic-mapping.ts` — current authoritative intent shape: `mood`, `temperatureBias`, `harmonySource`, `hueAnchor`, `chromaPosture`, `contrastPosture`, `harmony`, `familyId`, `anchorHue`. This is the cross-style contract S03 should interpret.
- `src/lib/render/organic/scene.ts` — strongest current candidate for visible expressiveness. It already has adjustable curve count, layer count, width, gradient stops, octave count, and dominant direction, but all of that is still driven only by raw vector fields and theme. It never reads `palette.mapping`.
- `src/lib/render/typographic/scene.ts` — second strong candidate. It currently maps input text into placed words using palette colors and vector energy/complexity, but it does not vary composition language by family or mood at all.
- `src/lib/render/typographic/layout.ts` — where poster composition rules actually live: target word count, prominent-word handling, rotation budget, opacity fallback, placement strategy, font-family choice. This is likely where most typographic expressiveness work belongs.
- `src/lib/render/organic/draw.ts` — draw layer is intentionally thin. S03 should prefer enriching scene data over stuffing style logic into Canvas draw code.
- `src/lib/render/typographic/draw.ts` — same pattern: draw layer consumes scene graph faithfully. Scene builder/layout changes are the safer seam.
- `src/lib/render/geometric/scene.ts` — currently palette-only. It could consume mapping later, but organic/typographic appear to offer a larger perceptual gain per change.
- `src/lib/render/particle/scene.ts` and `src/lib/render/particle/draw.ts` — also palette-only. Could use mapping for glow/cluster drama later, but not the best first proof for this slice.
- `src/__tests__/render/organic-scene.test.ts` — current organic proof covers structure and invariants, not synesthetic expressiveness. Good starting point for adding deterministic mapping-driven assertions.
- `src/__tests__/render/typographic-scene.test.ts` — current typographic proof covers composition laws, but not mood/family-specific art direction. Extend this rather than replacing it.
- `src/__tests__/components/StyleSelector.test.tsx` — proves thumbnails render scenes correctly. Useful if S03 adds richer thumbnail-visible scene changes but should remain focused on component behavior, not artistic judgment.

## Constraints

- **Consume the existing mapping seam directly.** S02 explicitly established `PaletteResult.mapping` as the authoritative downstream intent surface, and its summary says S03 should consume it rather than reconstructing mood from raw vector fields.
- **Determinism remains a product promise.** Any new renderer interpretation must remain a pure function of `(params, palette, theme, seed, inputText?)`. No `Math.random()`, no time-based branches, no DOM-dependent measurement drift outside the existing deterministic seams.
- **At least two styles must visibly improve.** The roadmap proof target is not satisfied by one standout renderer plus subtle incidental changes elsewhere.
- **Style identity must survive.** Cross-style coherence cannot become cross-style sameness. Organic should still read as flowing atmospheric field work; typographic should still read as layered poster composition.
- **Scene builders, not draw layers, are the primary seam.** The architecture decision in D008 favors pure scene-graph builders plus style-specific canvas components. Expression logic belongs in scene construction and shared interpretation helpers, not ad hoc Canvas effects.
- **The generation flow already supports text, URL, and data inputs.** S03 should not break the existing contract where typographic is disabled for data inputs and other styles work across all flows.
- **Thumbnail cost matters.** `ResultsView` builds all four scenes eagerly and `StyleSelector` renders 200×200 previews. Expression upgrades that explosively increase scene complexity can hurt perceived responsiveness even if tests still pass.
- **S04 still owns browser-level art proof.** S03 should create verification-ready renderer behavior and test surfaces, but not depend on subjective browser-only judgment to prove the slice complete.

## Common Pitfalls

- **Only changing colors, not composition** — S02 already improved the palette seam. If S03 leaves scene-builder behavior untouched, the slice will likely underdeliver on “renderer expressiveness.”
- **Encoding mood separately in each renderer** — Organic and typographic should interpret the same `mapping` contract, not invent renderer-specific mood taxonomies. Otherwise S03 increases incoherence risk.
- **Using raw parameters when mapping already exists** — Re-deriving “dramatic” from contrast or “lush” from saturation inside renderers will drift from the authoritative palette intent and make future debugging harder.
- **Stuffing expressive logic into draw functions** — Canvas draw modules are currently thin and deterministic. Burying high-level art direction there makes tests weaker and scene graphs less inspectable.
- **Overcrowding thumbnails and mobile results** — `ResultsView` builds all four scenes and thumbnails at once. More marks is not automatically more premium; density increases should be selective and mapping-driven.
- **Breaking typographic readability for expressive effect** — Poster energy is desirable, but the existing tests enforce prominent-word size/rotation and overlap laws. S03 should intensify hierarchy and composition, not turn outputs into illegible noise.
- **Assuming data-input parity for typographic style** — `ResultsView` intentionally disables typographic for `inputType='data'`. S03 verification should avoid requiring typographic proof on data flows.

## Open Risks

- The current mapping shape may be enough for palette intent but still too shallow for robust renderer interpretation; if two renderers need richer direction, S03 may need to extend mapping additively without breaking the S02 contract.
- Organic and typographic can both become more expressive, but if their new behavior responds too strongly to the same mapping states they may converge aesthetically instead of preserving distinct identities.
- Thumbnail and main-canvas scene complexity may increase enough to degrade perceived responsiveness, especially because all four scenes are built eagerly in `ResultsView`.
- Existing tests focus on structural and compositional invariants, not visual richness. Without new targeted assertions, S03 could ship subjective improvements that are hard to regression-test.
- Because URL/data/text flows share the same palette seam but not the same raw medium, renderer behavior that relies too heavily on text-specific assumptions could silently narrow live proof coverage.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available (not installed) |
| Vitest | `onmax/nuxt-skills@vitest` | available (not installed) |
| Tauri v2 | `nodnarbnitram/claude-code-extensions@tauri-v2` | available (not installed, low direct relevance to this slice) |
| React/Next performance | `vercel-react-best-practices` | already installed |
| Frontend UI/art direction | `frontend-design` | already installed |
| Culori | none found | none found |

## Sources

- S03 supports milestone proof that at least two rendering styles visibly benefit from the upgraded art system while preserving determinism (source: preloaded `.gsd/milestones/M002/M002-ROADMAP.md`).
- S03 supports **R001** and **R002** and contributes milestone-level progress toward **R005**, so research should target renderer-visible expressiveness rather than generic refactoring (source: preloaded `.gsd/REQUIREMENTS.md`).
- S02 explicitly established `PaletteResult.mapping` as the authoritative downstream intent surface and named S03’s next step as feeding that mapping into renderer behavior (source: preloaded `.gsd/milestones/M002/slices/S02/S02-SUMMARY.md`).
- `ResultsView` already builds geometric, organic, particle, and typographic scenes from `result.vector`, `result.palette`, theme, and derived seeds, so renderer upgrades can ship without changing hook entrypoints (source: `src/components/results/ResultsView.tsx`).
- `StyleSelector` renders actual scene thumbnails for every style, making scene-builder changes visible in both the main result and the thumbnail rail (source: `src/components/results/StyleSelector.tsx`).
- `PaletteResult` already exposes stable family diagnostics plus `mapping`, including `mood`, `chromaPosture`, `contrastPosture`, `familyId`, and `anchorHue` (source: `src/lib/color/palette.ts`, `src/lib/color/synesthetic-mapping.ts`).
- Organic scene construction currently uses vector-driven curve count, layer count, widths, and gradients but never reads `palette.mapping`, making it a prime candidate for S03 interpretation work (source: `src/lib/render/organic/scene.ts`).
- Typographic scene construction currently uses palette colors and raw `energy`/`complexity`, while the deeper composition rules live in `layout.ts`; neither module consumes synesthetic mapping yet (source: `src/lib/render/typographic/scene.ts`, `src/lib/render/typographic/layout.ts`, `src/lib/render/typographic/words.ts`).
- Particle and geometric renderers likewise consume palette colors without any mapping-aware composition logic, confirming that renderer expressiveness is still largely unresolved after S02 (source: `src/lib/render/geometric/scene.ts`, `src/lib/render/particle/scene.ts`).
- Existing renderer tests prove structural laws and determinism but do not yet assert mapping-driven style expression, which means S03 should extend those suites rather than relying only on subjective review (source: `src/__tests__/render/organic-scene.test.ts`, `src/__tests__/render/typographic-scene.test.ts`, `src/__tests__/render/scene.test.ts`).
- Thumbnail component tests already cover style selector rendering behavior and should remain a lightweight integration surface rather than the primary artistic proof mechanism (source: `src/__tests__/components/StyleSelector.test.tsx`).
