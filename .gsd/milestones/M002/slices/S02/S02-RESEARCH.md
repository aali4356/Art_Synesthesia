# M002/S02 — Research

**Date:** 2026-03-11

## Summary

S02 owns **R002** directly and supports **R001** by making palette-family choice feel intentionally synesthetic instead of merely bucketed. The current codebase already has the right seam for this work: all three generation paths (`useTextAnalysis`, `useUrlAnalysis`, `useDataAnalysis`) still converge on `generatePalette(vector, seed)`, and `PaletteResult` now exposes stable family diagnostics (`familyId`, `familyName`, `familyDescriptor`, `selectionKey`, `selectionVector`). That means S02 does not need new pipeline entrypoints. It needs a stronger mapping layer that translates the existing 15-dimension `ParameterVector` into higher-level aesthetic intent, then threads that intent into palette realization and, ideally, renderer interpretation.

The main finding is that the current S01 family-selection logic is too shallow to satisfy S02 by itself. `selectPaletteFamily()` only buckets `warmth`, `energy`, and `contrast`; `generatePalette()` still derives hue from the old warmth-driven base hue and picks harmony from the legacy `selectHarmony()` thresholds. Family descriptors such as `baseHue` and `preferredHarmony` exist in `palette-families.ts`, but they are not authoritative in palette realization. As written, the system can expose family metadata without actually making the artwork feel more emotionally intentional. S02 should add a first-class synesthetic mapping artifact—effectively a deterministic “aesthetic intent” object derived from the full vector—and make palette generation consume it explicitly.

## Recommendation

Implement S02 as a **mapping-layer upgrade**, not a palette retune-only pass. Add a dedicated deterministic mapper between `ParameterVector` and palette/render consumers that produces stable fields like mood, temperature bias, tension level, hue anchor strategy, chroma posture, contrast posture, and composition emphasis. Then refactor `generatePalette()` to consume that mapping instead of mixing old warmth-based hue logic with S01 family metadata. This is the smallest path that can actually deliver R002 while preserving the shared `generatePalette(params, seed)` seam established in S01.

Concretely: keep the existing text/URL/data hooks unchanged, keep `PaletteResult` backward-compatible, and introduce a new internal contract such as `SynestheticMapping` or `AestheticIntent` consumed by color generation first and by renderers later. That gives S03 a stable downstream interface, aligns with D018/D019, and creates a real place to encode principled emotional behavior using the full vector rather than three coarse buckets.

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Deterministic cross-flow integration | Shared `generatePalette(vector, seed)` seam used by all three hooks | Lets S02 change real outputs for text, URL, and data without rewriting app plumbing. |
| Perceptual color manipulation | `culori` OKLCH + `clampChroma()` + `wcagContrast()` + CIEDE2000 utilities | Already matches D006 and current code; avoids inventing custom color math. |
| Deterministic randomness | `createPRNG()` / seeded sub-seeds | Preserves D002/D003 and keeps mapping/realization reproducible. |
| Multi-style result propagation | `ResultsView` builds all four scene graphs from the single `result.palette` | If S02 upgrades palette/mapping correctly, all styles inherit the change immediately. |

## Existing Code and Patterns

- `src/lib/color/palette.ts` — authoritative palette seam. Right now it selects a family, but still mixes in legacy warmth-based base hue and legacy harmony selection. S02 should treat this file as the main consumer of a new mapping artifact.
- `src/lib/color/palette-family-selection.ts` — current family selection is deterministic but only considers `warmth`, `energy`, and `contrast` buckets. Good scaffold for S02, insufficient as the final synesthetic mapping model.
- `src/lib/color/palette-families.ts` — curated family catalog already contains useful art-direction metadata (`baseHue`, `preferredHarmony`, chroma/lightness shaping). S02 should reuse and elevate this data instead of bypassing it.
- `src/lib/color/harmony.ts` — existing harmony logic is threshold-based on `symmetry`, `contrast`, and `energy`. It is a likely refactor target because it currently ignores selected family intent.
- `src/hooks/useTextAnalysis.ts` — text flow canonicalizes -> analyzes -> computes vector -> calls `generatePalette(vector, seed)`; no extra wiring needed if S02 stays inside the shared palette seam.
- `src/hooks/useUrlAnalysis.ts` — URL flow uses the same palette seam, so S02 research must assume all upgraded mapping behavior applies to live URL analysis too.
- `src/hooks/useDataAnalysis.ts` — data flow also converges on the same seam; S02 cannot assume text-only semantics.
- `src/components/results/ResultsView.tsx` — builds geometric, organic, particle, and typographic scene graphs from `result.vector` + `result.palette`; this is the user-visible integration surface S02 influences without changing UI structure.
- `src/components/results/StyleSelector.tsx` — thumbnails render from built scene graphs; useful for later browser proof, but today it exposes no palette-family or mood diagnostics.
- `src/lib/render/geometric/scene.ts` — geometric renderer mostly consumes palette colors directly; if S02 only upgrades palette, this style benefits immediately.
- `src/lib/render/organic/scene.ts` — organic renderer converts palette colors into gradient stops and curve colors; more emotionally directed palettes should show here strongly.
- `src/lib/render/particle/scene.ts` — particle renderer uses palette colors mostly as cluster/particle color source; S03 may need renderer-specific work, but S02 still changes visible chromatic behavior.
- `src/lib/render/typographic/scene.ts` — typographic renderer also only consumes palette colors and text-derived layout; it is a candidate for later mood-aware composition hooks once S02 defines a stable mapping contract.

## Constraints

- **Determinism is non-negotiable.** All three analysis hooks call `generatePalette(vector, seed)` and downstream renderers rely on deterministic seeds. Any mapping object added in S02 must be a pure function of `ParameterVector` + seed (if seed is used at all).
- **The public palette shape is already broad.** `PaletteResult` is consumed in renderers, tests, export/share flows, and result adapters. Additive metadata is safe; breaking `dark`, `light`, `harmony`, or `count` is unnecessary risk.
- **S01 is not truly safe yet.** Its summary explicitly says baseline palette/diversity verification is still failing. S02 must not assume the palette foundation is fully stable; any mapping change should be planned with the expectation that color tests may need reruns before slice completion.
- **Current family metadata is partly unused.** `palette-families.ts` stores `baseHue` and `preferredHarmony`, but `palette.ts` still computes `baseHue` from legacy warmth interpolation and harmony from `selectHarmony(params)`. S02 must resolve this split-brain design rather than layering more heuristics on top.
- **Current renderers do not consume mood/intention metadata.** They only see `ParameterVector`, `PaletteResult`, theme, and seed. If S02 introduces richer aesthetic intent, it should either thread it through `PaletteResult` or define a new downstream seam for S03.
- **Color safety remains required.** Existing contrast/dedup behavior uses `adjustForMode()` and `rejectNearDuplicates()` with `culori` utilities. Emotional mapping cannot regress WCAG floors or perceptual spacing guarantees.

## Common Pitfalls

- **Adding “mood” labels without changing behavior** — If S02 only expands metadata or renames families, it will not satisfy R002. The mapping must alter palette realization in a way that changes real outputs.
- **Keeping the old warmth-driven hue engine under the hood** — Right now family selection says one thing while `legacyBaseHue` still drives hue positioning. That creates incoherent intent. Make family/mapping data authoritative.
- **Overfitting the mapper to text semantics** — The same seam is used by text, URL, and data inputs. Mapping logic should be parameter-driven, not tied to raw-source assumptions that only make sense for prose.
- **Using seed randomness as a substitute for aesthetic meaning** — Seed can add deterministic variation, but the primary aesthetic direction should come from parameter behavior; otherwise the system will feel arbitrary rather than synesthetic.
- **Pushing style-specific meaning into each renderer too early** — S02 should establish a shared emotional/aesthetic contract first. Let S03 consume that contract for richer per-style expression.

## Open Risks

- The current S01 test failures mean S02 implementation may land on an unstable palette baseline unless those contracts are restored first or alongside the work.
- A new mapping layer could create better family intent but still fail to produce visibly different outputs if renderers remain too palette-agnostic; S03 likely needs to consume the new contract, not just the new colors.
- If S02 introduces too many discrete mood branches without preserving clear parameter relationships, outputs may feel curated but arbitrary.
- There is currently no explicit UI/debug surface for mood or synesthetic intent in `ResultsView`/`StyleSelector`, which may make slice verification harder unless tests or diagnostics are added.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js App Router | `wshobson/agents@nextjs-app-router-patterns` | available (not installed) |
| Next.js general patterns | `sickn33/antigravity-awesome-skills@nextjs-best-practices` | available (not installed) |
| Canvas rendering | `markdown-viewer/skills@canvas` | available but weakly relevant / low-install generic option |
| Culori | none found | none found |
| React/Next performance | `vercel-react-best-practices` | already installed |

## Sources

- S02 directly owns **R002** and supports **R001**; research should target emotionally expressive mapping plus palette-family behavior, not generic UI polish (source: preloaded `.gsd/REQUIREMENTS.md`).
- S02’s milestone contract is to make parameter behavior drive palette-family and mood selection more intentionally, with observable changes in real generated outputs (source: preloaded `.gsd/milestones/M002/M002-ROADMAP.md`).
- The shared entrypoint for all generation flows is still `generatePalette(vector, seed)` from text, URL, and data hooks, so this is the correct integration seam for S02 work (source: `src/hooks/useTextAnalysis.ts`, `src/hooks/useUrlAnalysis.ts`, `src/hooks/useDataAnalysis.ts`).
- `PaletteResult` already exposes stable family diagnostics for downstream mapping work and future debugging (source: `src/lib/color/palette.ts`; reinforced by preloaded S01 summary).
- Current family selection only buckets `warmth`, `energy`, and `contrast`, which is too coarse for a convincing synesthetic mapping upgrade (source: `src/lib/color/palette-family-selection.ts`).
- Family catalog metadata already includes `baseHue` and `preferredHarmony`, but current palette realization does not make those fields authoritative (source: `src/lib/color/palette-families.ts`, `src/lib/color/palette.ts`).
- Current harmony selection still uses legacy threshold logic on `symmetry`, `contrast`, and `energy`; this is a likely conflict point for S02 intent-driven mapping (source: `src/lib/color/harmony.ts`).
- All four live styles in `ResultsView` are rebuilt from `result.vector` + `result.palette`, so palette/mapping upgrades will propagate to real outputs without new UI plumbing (source: `src/components/results/ResultsView.tsx`).
- Renderers currently consume palette colors directly and do not yet receive any richer synesthetic intent object, which is why S02 should define that seam before S03 style-level upgrades (source: `src/lib/render/geometric/scene.ts`, `src/lib/render/organic/scene.ts`, `src/lib/render/particle/scene.ts`, `src/lib/render/typographic/scene.ts`).
- Existing color safety primitives already rely on `culori` utilities for gamut mapping, contrast, and perceptual difference; these should remain the foundation rather than being replaced (source: `src/lib/color/contrast.ts`, `src/lib/color/dedup.ts`, Context7 docs for `/evercoder/culori` on `clampChroma()` and `converter()`).
- Existing palette-family tests prove metadata presence and diversity expectations, but they also show the system is still fragile enough that S02 should plan around verification, not assume the palette layer is settled (source: `src/__tests__/color/palette-family-selection.test.ts`, `src/__tests__/color/palette-family-diversity.test.ts`, preloaded S01 summary).
