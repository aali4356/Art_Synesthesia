# Phase 2: Parameter System & Color - Research

**Researched:** 2026-03-02
**Domain:** Quantile-based normalization, OKLCH color science, perceptual palette generation
**Confidence:** HIGH

## Summary

Phase 2 builds the intermediate representation layer that connects future analysis (Phase 3) to future rendering (Phase 4+). It has three distinct sub-domains: (1) a 15-dimension parameter vector schema with weighted-blend normalization, (2) a calibration harness with 30+ reference texts that enforces distributional quality via quantile-based scaling, and (3) an OKLCH palette generator that produces perceptually coherent, contrast-safe color palettes driven by parameter values.

The existing codebase provides `ParameterVector` and `ParameterProvenance` types, seeded PRNG, SHA-256 hashing, and version infrastructure -- all ready for use. The primary new dependency is **culori** (v4.0.2) for OKLCH/LAB color conversion, deltaE color difference calculation, WCAG contrast checking, and gamut mapping. Quantile-based normalization is straightforward enough to implement without a library (sorted reference arrays + percentile rank), avoiding unnecessary dependencies.

**Primary recommendation:** Use culori v4 (tree-shakeable via `culori/fn`) as the single color library. Implement quantile normalization as a pure-function module with no external dependencies. Store calibration reference corpus as a JSON data file under `src/data/`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Weighted blend approach: each parameter is a weighted sum of multiple raw analysis signals (not one-to-one)
- Per-input-type mapping tables: text, URL, and data each have their own weight configurations optimized for their signal types
- Cross-type comparison is not a priority; each type's mapping is independently tuned for expressive distribution
- Extensions field (`Record<string, number>`) kept as a future escape hatch only -- 15 core dimensions for now
- Both-layer provenance display: plain English summary visible by default, expandable to show raw signal breakdown underneath
- ParameterProvenance type already supports this structure
- Maximum diversity calibration corpus: single words, names, sentences, paragraphs, poems, code snippets, recipes, song lyrics, emoticon-heavy texts, technical writing, foreign language samples
- Goal: every parameter distributes broadly -- no dimension should cluster
- Corpus stored in a data file (JSON/YAML), separate from test logic, version-controlled
- Calibration is a hard test gate: if any parameter has >50% of values in a 0.2-wide band, the test fails
- Changing the corpus file automatically bumps the normalizer version (enforced by pre-commit check or test)
- Palette size driven by `paletteSize` parameter: 0 maps to 3 colors, 1 maps to 8 colors
- All palette colors are generated OKLCH art colors -- no neutrals in the palette; background comes from the theme
- First color in the palette is the "dominant" (largest area in renderers), remaining are accents
- Palette harmony/mood driven by parameters: high symmetry + low contrast = analogous, high contrast + high energy = complementary/triadic
- Renderers handle opacity/transparency themselves -- palette provides solid OKLCH colors only
- Same hue angles and chroma across dark/light modes; OKLCH lightness adjusted to maintain readable contrast against each background
- One palette algorithm, two lightness profiles -- artwork feels consistent across modes

### Claude's Discretion
- Exact parameter-to-color-property mapping (which parameters drive hue vs chroma vs lightness)
- deltaE threshold for near-duplicate color rejection (requirements say <10 in LAB, tune by visual testing)
- Exact harmony algorithm implementation
- Calibration corpus curation (specific reference texts within the diversity guidelines)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PARAM-01 | All input types produce a normalized parameter vector of ~15 fixed dimensions | Existing `ParameterVector` type defines all 15 dimensions. Weighted-blend mapping tables per input type. Normalization engine maps raw signals to 0-1 range. |
| PARAM-02 | All parameter values normalized to 0-1 range using quantile-based scaling against calibration dataset | Quantile normalization via sorted reference distributions + percentile rank interpolation. No external library needed. |
| PARAM-03 | Calibration harness includes 30+ text, 15+ URL, and 15+ data reference inputs | Phase 2 scope is text-only (30+ texts). URL and data reference inputs deferred to Phase 6 when those analyzers are built. Corpus stored as JSON in `src/data/`. |
| PARAM-04 | Parameter provenance tracks contributing signals with weights and plain-English explanations | Existing `ParameterProvenance` type supports this. Implementation produces both-layer display: summary + expandable raw breakdown. |
| PARAM-05 | Calibration distributions stored as part of normalizer version; updating calibration bumps version | Normalizer version auto-bump enforced via test that hashes corpus file. `CURRENT_VERSION.normalizerVersion` already exists. |
| COLOR-01 | Palettes generated in perceptual color space (OKLCH) with perceptual adjustments | culori v4.0.2 provides full OKLCH support with tree-shakeable imports. Palette generation operates entirely in OKLCH space. |
| COLOR-02 | Palette coherence function rejects near-duplicate colors (deltaE < 10 in LAB space), shifting hue by minimum viable amount | culori's `differenceCiede2000()` computes perceptual distance in LAB space. Rejection loop shifts hue by minimum increment until deltaE >= threshold. |
| COLOR-03 | Sufficient contrast ensured against dark backgrounds in dark mode and white in light mode | culori's `wcagContrast()` checks contrast ratios. OKLCH lightness adjusted per mode: same hue/chroma, different L profiles. Dark bg: oklch(0.09 0.005 250), Light bg: white. |
| COLOR-04 | Saturation and contrast parameters modulate palette but never to unreadable output | Floor/ceiling guards on OKLCH chroma and lightness. Contrast validation as final step before palette output. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| culori | 4.0.2 | OKLCH/LAB color conversion, deltaE, WCAG contrast, gamut mapping | Most comprehensive JS color library; tree-shakeable; CSS Color Level 4 compliant; built-in `differenceCiede2000()`, `wcagContrast()`, `toGamut()`, `clampChroma()` |
| @types/culori | 4.0.1 | TypeScript definitions for culori | DefinitelyTyped maintained; required since culori does not bundle its own types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| seedrandom | 3.0.5 | Seeded PRNG for palette randomness | Already installed; use `createPRNG()` from Phase 1 for any randomized palette generation steps |
| vitest | 4.0.18 | Test framework | Already installed; calibration harness tests run via `vitest run` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| culori | Color.js (colorjs.io) | Color.js is by CSS spec editors (authoritative) but heavier bundle, object-oriented API less ergonomic for functional pipeline; culori's `culori/fn` tree-shaking is superior |
| culori | chroma.js | chroma.js supports OKLCH but lacks built-in CIEDE2000 deltaE and WCAG contrast functions |
| culori | @texel/color | 60x faster gamut mapping but no deltaE functions, no WCAG contrast; too narrow for our needs |
| simple-statistics | hand-rolled quantile | Quantile normalization only needs sorted arrays + percentile rank -- ~30 lines of code vs. 50KB library; no external dependency justified |

**Installation:**
```bash
npm install culori
npm install -D @types/culori
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── engine/           # Existing: PRNG, hash, version
│   ├── pipeline/         # Existing directory (empty)
│   │   ├── normalize.ts      # Quantile normalizer engine
│   │   ├── calibration.ts    # Calibration harness logic
│   │   ├── mapping.ts        # Signal-to-parameter weight tables
│   │   ├── provenance.ts     # Provenance generation
│   │   └── index.ts          # Re-exports
│   ├── color/            # NEW: Color subsystem
│   │   ├── palette.ts        # OKLCH palette generator
│   │   ├── harmony.ts        # Harmony algorithm (analogous/complementary/triadic)
│   │   ├── contrast.ts       # Contrast checking & lightness adjustment
│   │   ├── dedup.ts          # Near-duplicate rejection
│   │   └── index.ts          # Re-exports
│   └── cache/            # Existing: cache key functions
├── data/
│   └── calibration-corpus.json   # Reference texts for calibration
├── types/
│   └── engine.ts         # Existing: ParameterVector, ParameterProvenance, etc.
└── __tests__/
    ├── pipeline/
    │   ├── normalize.test.ts
    │   ├── calibration.test.ts
    │   ├── mapping.test.ts
    │   └── provenance.test.ts
    └── color/
        ├── palette.test.ts
        ├── harmony.test.ts
        ├── contrast.test.ts
        └── dedup.test.ts
```

### Pattern 1: Quantile-Based Normalization
**What:** Map raw analysis signals to the 0-1 range using empirical percentile rank against a sorted reference distribution, rather than simple min-max scaling.
**When to use:** Whenever a raw signal needs to become a parameter value. This is the core normalization strategy for PARAM-02.
**Why quantile over min-max:** Min-max is fragile to outliers and clusters all values near 0 or 1 when distributions are skewed. Quantile normalization spreads values uniformly across [0, 1] based on rank, making it robust to outliers and producing better visual differentiation.

```typescript
// Quantile normalization: pure function, no dependencies
interface CalibrationDistribution {
  /** Sorted array of reference values for this signal */
  sortedValues: number[];
}

/**
 * Compute percentile rank of a value within a sorted reference distribution.
 * Returns a value in [0, 1] representing where `value` falls in the distribution.
 * Uses linear interpolation between closest ranks.
 */
function percentileRank(sortedValues: number[], value: number): number {
  const n = sortedValues.length;
  if (n === 0) return 0.5; // no reference data, return midpoint
  if (value <= sortedValues[0]) return 0;
  if (value >= sortedValues[n - 1]) return 1;

  // Binary search for insertion point
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedValues[mid] < value) lo = mid + 1;
    else hi = mid;
  }

  // Linear interpolation between surrounding values
  if (sortedValues[lo] === value) {
    // Find last occurrence of this value for proper rank
    let last = lo;
    while (last < n - 1 && sortedValues[last + 1] === value) last++;
    return (lo + last) / 2 / (n - 1);
  }

  // Interpolate between lo-1 and lo
  const lower = lo - 1;
  const fraction = (value - sortedValues[lower]) / (sortedValues[lo] - sortedValues[lower]);
  return (lower + fraction) / (n - 1);
}
```

### Pattern 2: Weighted Blend Parameter Mapping
**What:** Each parameter value is computed as a weighted sum of multiple raw analysis signals, with per-input-type weight tables.
**When to use:** This is the locked decision for signal-to-parameter mapping (PARAM-01).

```typescript
interface SignalWeight {
  signal: string;           // e.g., "charEntropy", "avgWordLength"
  weight: number;           // 0-1, weights for this parameter should sum to 1
  explanation: string;      // Plain English: "Character diversity in input"
}

interface ParameterMapping {
  parameter: keyof ParameterVector;
  signals: SignalWeight[];
}

// Per-input-type mapping table
type MappingTable = ParameterMapping[];

// Text-specific mapping example:
const TEXT_MAPPINGS: MappingTable = [
  {
    parameter: 'complexity',
    signals: [
      { signal: 'vocabRichness', weight: 0.4, explanation: 'Variety of unique words used' },
      { signal: 'avgSentenceLength', weight: 0.3, explanation: 'How long sentences tend to be' },
      { signal: 'charEntropy', weight: 0.3, explanation: 'Diversity of characters used' },
    ],
  },
  // ... remaining 14 parameters
];

function computeParameter(
  mapping: ParameterMapping,
  rawSignals: Record<string, number>,
  calibration: Record<string, CalibrationDistribution>,
): { value: number; provenance: ParameterProvenance } {
  let weightedSum = 0;
  const contributors: ParameterProvenance['contributors'] = [];

  for (const { signal, weight, explanation } of mapping.signals) {
    const rawValue = rawSignals[signal] ?? 0;
    const normalized = percentileRank(
      calibration[signal]?.sortedValues ?? [],
      rawValue
    );
    weightedSum += normalized * weight;
    contributors.push({ signal, rawValue, weight, explanation });
  }

  return {
    value: Math.max(0, Math.min(1, weightedSum)),
    provenance: {
      parameter: mapping.parameter,
      value: weightedSum,
      contributors,
    },
  };
}
```

### Pattern 3: OKLCH Palette Generation with Harmony
**What:** Generate a palette of N solid OKLCH colors driven by parameter values, using harmony rules (analogous, complementary, triadic) selected by parameter combinations.
**When to use:** COLOR-01 through COLOR-04 implementation.

```typescript
import {
  useMode, modeOklch, modeRgb, modeLab65,
  converter, formatCss, formatHex,
  differenceCiede2000, wcagContrast, clampChroma,
} from 'culori/fn';

// Register only needed color spaces (tree-shaking)
useMode(modeOklch);
useMode(modeRgb);
useMode(modeLab65);

const toOklch = converter('oklch');
const toRgb = converter('rgb');

interface OklchColor {
  mode: 'oklch';
  l: number;  // 0-1 (lightness)
  c: number;  // 0-~0.4 (chroma)
  h: number;  // 0-360 (hue angle)
}

type HarmonyType = 'analogous' | 'complementary' | 'triadic' | 'split-complementary';

function selectHarmony(params: ParameterVector): HarmonyType {
  // High symmetry + low contrast = analogous (calm, cohesive)
  if (params.symmetry > 0.6 && params.contrast < 0.4) return 'analogous';
  // High contrast + high energy = complementary (bold, dynamic)
  if (params.contrast > 0.6 && params.energy > 0.6) return 'complementary';
  // High contrast + moderate energy = triadic (vibrant but balanced)
  if (params.contrast > 0.5 && params.energy > 0.4) return 'triadic';
  // Default: split-complementary (versatile)
  return 'split-complementary';
}
```

### Pattern 4: Dual Lightness Profiles
**What:** Same hue and chroma for both dark and light modes; only OKLCH lightness changes.
**When to use:** COLOR-03, ensuring readable contrast against both backgrounds.

```typescript
// Dark mode background: oklch(0.09 0.005 250)
const DARK_BG = { mode: 'oklch' as const, l: 0.09, c: 0.005, h: 250 };
// Light mode background: white
const LIGHT_BG = { mode: 'oklch' as const, l: 1.0, c: 0, h: 0 };

interface LightnessProfile {
  min: number;  // Minimum L for art colors
  max: number;  // Maximum L for art colors
  target: number; // Preferred L for dominant color
}

const DARK_MODE_PROFILE: LightnessProfile = {
  min: 0.45,   // Art colors need to be bright enough against near-black
  max: 0.90,   // But not so bright they feel washed out
  target: 0.65,
};

const LIGHT_MODE_PROFILE: LightnessProfile = {
  min: 0.25,   // Art colors can be darker against white
  max: 0.70,   // But not too light or they disappear
  target: 0.50,
};

function adjustLightnessForMode(
  color: OklchColor,
  mode: 'dark' | 'light',
  background: OklchColor,
): OklchColor {
  const profile = mode === 'dark' ? DARK_MODE_PROFILE : LIGHT_MODE_PROFILE;
  const bgRgb = toRgb(background);
  let l = Math.max(profile.min, Math.min(profile.max, color.l));

  // Adjust until WCAG contrast >= 3:1 (minimum for large UI elements)
  const adjusted = { ...color, l };
  const contrast = wcagContrast(toRgb(adjusted), bgRgb);
  if (contrast < 3.0) {
    // Push lightness away from background
    l = mode === 'dark'
      ? Math.min(profile.max, l + 0.1)
      : Math.max(profile.min, l - 0.1);
  }

  return { ...color, l };
}
```

### Anti-Patterns to Avoid
- **Hand-rolling color space conversions:** OKLCH-to-sRGB involves matrix math and transfer functions with edge cases (out-of-gamut, NaN hue for achromatic colors). Use culori's converters.
- **Using HSL for perceptual operations:** HSL lightness is not perceptually uniform. Yellow at HSL(60, 100%, 50%) appears much brighter than blue at HSL(240, 100%, 50%) despite same L. OKLCH fixes this.
- **Min-max normalization for parameter values:** Extremely fragile to outliers. A single extreme input will compress all other values into a narrow range. Use quantile-based normalization.
- **Generating palettes in RGB/HSL then converting:** Color harmony operations (hue rotation, chroma adjustment) must happen in OKLCH to maintain perceptual uniformity. Generate in OKLCH, convert to sRGB/hex only at the display boundary.
- **Ignoring gamut mapping:** OKLCH can represent colors outside the sRGB gamut. Any color sent to CSS or canvas must be gamut-mapped first via `clampChroma()` or `toGamut()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OKLCH to sRGB conversion | Custom matrix math | `culori converter('rgb')` | Edge cases with out-of-gamut colors, achromatic NaN hue, chromatic adaptation |
| Color difference (deltaE) | Euclidean distance in RGB | `culori differenceCiede2000()` | CIEDE2000 accounts for perceptual non-uniformity; RGB distance is meaningless perceptually |
| WCAG contrast ratio | `(L1 + 0.05) / (L2 + 0.05)` formula | `culori wcagContrast()` | Relative luminance calculation requires linearized sRGB, easy to get wrong |
| sRGB gamut mapping | Clamping RGB channels to [0, 255] | `culori clampChroma()` or `toGamut()` | Naive clamping shifts hue; chroma reduction preserves hue/lightness |
| CSS color string output | String interpolation | `culori formatCss()` / `formatHex()` | Handles edge cases (none values, alpha, precision) per CSS Color 4 spec |

**Key insight:** Color math has an enormous surface area of edge cases (achromatic colors, out-of-gamut mapping, hue interpolation wrapping, different illuminants). Culori encodes decades of color science research. The quantile normalization, by contrast, is a ~30-line pure function with no edge cases beyond sorted array handling, making it the right thing to implement ourselves.

## Common Pitfalls

### Pitfall 1: Out-of-Gamut OKLCH Colors
**What goes wrong:** OKLCH can represent colors that don't exist in sRGB. Setting high chroma at certain lightness/hue combinations produces colors that clip unpredictably when converted to hex/RGB.
**Why it happens:** OKLCH's gamut is larger than sRGB. Chroma values above ~0.25-0.3 at many hue angles exceed sRGB boundaries.
**How to avoid:** Always run `clampChroma()` or `toGamut('rgb', 'oklch')` before converting to RGB/hex for display. Generate palettes in OKLCH, gamut-map as a final step.
**Warning signs:** Colors that look different in different browsers, or hex values with unexpected R/G/B = 0 or 255 clamping.

### Pitfall 2: Calibration Distribution Clustering
**What goes wrong:** If reference corpus lacks diversity, quantile normalization still clusters -- garbage in, garbage out. A corpus of 30 similar paragraphs will produce a distribution where most values are similar, giving poor normalization.
**Why it happens:** Calibration quality depends entirely on corpus diversity.
**How to avoid:** Follow the locked diversity guidelines: mix single words, names, sentences, paragraphs, poems, code, recipes, lyrics, emoticons, technical text, foreign languages. Test with the hard gate: no dimension >50% in any 0.2-wide band.
**Warning signs:** The calibration harness test failing on specific dimensions. Look at which signals cluster and add corpus entries that produce extreme values for those signals.

### Pitfall 3: Hue Interpolation Wrapping
**What goes wrong:** When generating analogous palettes by adding hue offsets, naive addition can produce values >360 or negative, and interpolation between hue 350 and hue 10 goes the long way around (through 180) instead of the short way (through 0).
**Why it happens:** Hue is circular (0 = 360). Standard arithmetic doesn't account for this.
**How to avoid:** Always normalize hue with `((h % 360) + 360) % 360`. For interpolation, use culori's `interpolate()` which handles hue fixup automatically.
**Warning signs:** Unexpected green/cyan colors appearing in palettes that should be warm reds/oranges.

### Pitfall 4: WCAG Contrast vs. Perceptual Lightness Confusion
**What goes wrong:** OKLCH lightness 0.5 does NOT guarantee WCAG 4.5:1 contrast against black or white. WCAG uses relative luminance (linearized sRGB), not OKLCH lightness.
**Why it happens:** OKLCH lightness is perceptually uniform but not the same as the WCAG luminance formula.
**How to avoid:** Always validate contrast ratios using `wcagContrast()` after adjusting lightness, never assume OKLCH L values map linearly to WCAG ratios.
**Warning signs:** Palette colors that look readable but fail WCAG automated checks.

### Pitfall 5: Normalizer Version Drift
**What goes wrong:** Changing the calibration corpus without bumping `normalizerVersion` means cached parameter vectors are stale -- same input produces different art depending on whether cache is warm or cold.
**Why it happens:** Cache keys include normalizer version (already wired in Phase 1). If version doesn't bump, stale cache returns old parameters.
**How to avoid:** Enforce version bump via a test: hash the corpus file, compare to stored hash in the normalizer version module. If hash changes without version bump, test fails.
**Warning signs:** Art that looks different after clearing cache for previously-generated inputs.

### Pitfall 6: culori v4 Lightness Range Change
**What goes wrong:** culori v4 clamps OKLCH lightness to [0, 1] at parse-time (breaking change from v3 where it was [0, 100]). Code that uses percentages for L will silently produce near-black colors.
**Why it happens:** culori v4 aligned with the CSS specification where oklch L is 0-1, not 0-100.
**How to avoid:** Always use 0-1 for OKLCH lightness in culori v4. This is consistent with CSS `oklch()` function behavior.
**Warning signs:** All generated palette colors appearing extremely dark.

## Code Examples

### OKLCH Color Creation and Conversion
```typescript
// Source: https://culorijs.org/api/ (culori v4.0.2)
import {
  useMode, modeOklch, modeRgb, modeLab65,
  converter, formatCss, formatHex,
} from 'culori/fn';

useMode(modeOklch);
useMode(modeRgb);
useMode(modeLab65);

const toOklch = converter('oklch');
const toRgb = converter('rgb');
const toLab = converter('lab65');

// Create OKLCH color directly
const color = { mode: 'oklch' as const, l: 0.65, c: 0.25, h: 285 };

// Convert to RGB for display
const rgb = toRgb(color);
const hex = formatHex(rgb);       // e.g., "#7b3dd4"
const css = formatCss(color);     // "oklch(0.65 0.25 285)"
```

### Near-Duplicate Color Rejection (COLOR-02)
```typescript
// Source: https://culorijs.org/api/ - differenceCiede2000
import { differenceCiede2000 } from 'culori/fn';

const deltaE = differenceCiede2000();

function rejectNearDuplicates(
  colors: OklchColor[],
  threshold: number = 10, // deltaE < 10 in LAB space
): OklchColor[] {
  const accepted: OklchColor[] = [];

  for (const candidate of colors) {
    const tooClose = accepted.some(
      existing => deltaE(toLab(existing), toLab(candidate)) < threshold
    );
    if (!tooClose) {
      accepted.push(candidate);
    } else {
      // Shift hue by minimum viable amount until distinct
      let shifted = { ...candidate };
      let attempts = 0;
      while (attempts < 36) { // max 36 * 10 = 360 degrees
        shifted = { ...shifted, h: (shifted.h + 10) % 360 };
        const stillTooClose = accepted.some(
          existing => deltaE(toLab(existing), toLab(shifted)) < threshold
        );
        if (!stillTooClose) {
          accepted.push(shifted);
          break;
        }
        attempts++;
      }
    }
  }

  return accepted;
}
```

### WCAG Contrast Checking (COLOR-03)
```typescript
// Source: https://culorijs.org/api/ - wcagContrast
import { wcagContrast } from 'culori/fn';

function ensureContrast(
  color: OklchColor,
  background: OklchColor,
  minRatio: number = 3.0,
): OklchColor {
  const bgRgb = toRgb(background);
  let adjusted = { ...color };

  // Determine direction: push lightness away from background
  const bgLight = background.l;
  const direction = bgLight < 0.5 ? 1 : -1; // lighten for dark bg, darken for light bg

  let iterations = 0;
  while (iterations < 20) {
    const contrast = wcagContrast(toRgb(adjusted), bgRgb);
    if (contrast >= minRatio) break;
    adjusted = { ...adjusted, l: Math.max(0, Math.min(1, adjusted.l + direction * 0.02)) };
    iterations++;
  }

  return adjusted;
}
```

### Calibration Harness Distribution Check
```typescript
// Test: no dimension has >50% of values in any 0.2-wide band
function checkDistribution(values: number[]): { passes: boolean; worstBand: string } {
  const n = values.length;
  const bands = [
    { label: '0.0-0.2', min: 0, max: 0.2 },
    { label: '0.2-0.4', min: 0.2, max: 0.4 },
    { label: '0.4-0.6', min: 0.4, max: 0.6 },
    { label: '0.6-0.8', min: 0.6, max: 0.8 },
    { label: '0.8-1.0', min: 0.8, max: 1.0 },
  ];

  let maxPct = 0;
  let worstBand = '';

  for (const band of bands) {
    const count = values.filter(v => v >= band.min && v < band.max).length;
    const pct = count / n;
    if (pct > maxPct) {
      maxPct = pct;
      worstBand = band.label;
    }
  }

  return { passes: maxPct <= 0.5, worstBand: `${worstBand} (${(maxPct * 100).toFixed(1)}%)` };
}
```

### Tree-Shakeable culori Import Pattern
```typescript
// Source: https://culorijs.org/guides/tree-shaking/
// Import from culori/fn and register only needed color spaces
import {
  useMode,
  modeOklch,
  modeRgb,
  modeLab65,
  converter,
  formatCss,
  formatHex,
  differenceCiede2000,
  wcagContrast,
  clampChroma,
} from 'culori/fn';

// Register modes once at module load
useMode(modeOklch);
useMode(modeRgb);
useMode(modeLab65);

// Create converters
const toOklch = converter('oklch');
const toRgb = converter('rgb');

// This keeps bundle to only OKLCH + RGB + LAB65 color space code
// (~5-8KB minified vs ~30KB for full culori import)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL/RGB palette generation | OKLCH palette generation | 2023 (OKLCH browser support baseline) | Perceptually uniform hue rotation; consistent perceived brightness across palette |
| CIE76 (Euclidean in LAB) deltaE | CIEDE2000 deltaE | Standard since 2000, widely adopted in JS | More accurate perceptual difference, especially for near-neutral and saturated colors |
| Min-max feature scaling | Quantile-based normalization | Standard in ML/data science | Robust to outliers, produces uniform distributions regardless of input skew |
| Separate dark/light palettes | Single palette with lightness profiles | Enabled by OKLCH | Consistent artwork identity across modes; simpler codebase |

**Deprecated/outdated:**
- culori v3 used L in [0, 100] for OKLCH; v4 uses [0, 1]. All code must use v4 convention.
- `differenceEuclidean('lab')` (CIE76) is available but `differenceCiede2000()` is preferred for perceptual accuracy.

## Open Questions

1. **Optimal deltaE threshold for near-duplicate rejection**
   - What we know: Requirement says deltaE < 10 in LAB space. CIEDE2000 JND (just noticeable difference) is ~1.0. A threshold of 10 means colors must be at least 10x JND apart.
   - What's unclear: Whether 10 is visually optimal for art palettes (might reject too many or too few). Requirement says "tune by visual testing."
   - Recommendation: Start with 10 as default, expose as a configurable constant, adjust after seeing generated palettes in Phase 4 renderers. This is in Claude's discretion.

2. **Parameter-to-color-property mapping specifics**
   - What we know: Parameters drive palette mood. `warmth` logically maps to hue range, `saturation` to OKLCH chroma, `contrast` to lightness spread, `energy` to hue diversity.
   - What's unclear: Exact mapping coefficients -- these need empirical tuning.
   - Recommendation: Implement a clear mapping function with named constants that can be adjusted. Suggested initial mapping:
     - `warmth` (0=cool, 1=warm) -> base hue: 0->220 (blue), 1->30 (orange/red)
     - `saturation` -> OKLCH chroma: 0->0.05, 1->0.30
     - `contrast` -> lightness spread between palette colors
     - `energy` -> hue spread (low=tight, high=wide)
     - `paletteSize` -> color count: 0->3, 1->8 (linear interpolation, rounded)

3. **Calibration corpus coverage for URL and data inputs**
   - What we know: PARAM-03 requires 15+ URL and 15+ data reference inputs. Phase 2 scope only includes text.
   - What's unclear: Whether the normalizer should have placeholder distributions for URL/data signals.
   - Recommendation: Phase 2 builds the normalization engine with text calibration only. URL and data calibration datasets are added in Phase 6 when those analyzers exist. The normalizer version bumps when new calibration data is added.

4. **Corpus version tracking mechanism**
   - What we know: Changing corpus must bump normalizer version. Must be enforced automatically.
   - What's unclear: Pre-commit hook vs. test-based enforcement.
   - Recommendation: Test-based enforcement is simpler and more portable. A test computes SHA-256 of the corpus file and compares to a stored hash constant. If hash mismatches and version hasn't changed, test fails with an actionable error message. No pre-commit hook needed.

## Sources

### Primary (HIGH confidence)
- [culori official API docs](https://culorijs.org/api/) - deltaE functions, WCAG contrast, converters, gamut mapping, formatCss/formatHex
- [culori tree-shaking guide](https://culorijs.org/guides/tree-shaking/) - `culori/fn` import pattern, `useMode()` registration
- [culori v4.0.0 release](https://github.com/Evercoder/culori/releases/tag/v4.0.0) - Breaking changes: L clamped to [0,1], alpha clamped, CJS support
- [MDN oklch() reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch) - OKLCH hue angle mapping, valid ranges for L/C/H
- Existing codebase: `src/types/engine.ts` (ParameterVector, ParameterProvenance), `src/lib/engine/` (PRNG, hash, version)

### Secondary (MEDIUM confidence)
- [LogRocket OKLCH article](https://blog.logrocket.com/oklch-css-consistent-accessible-color-palettes) - Lightness ranges for dark/light mode, consistent contrast at same L
- [Chris Henrick OKLCH experiments](https://clhenrick.io/blog/color-experiments-with-oklch/) - Hue rotation for categorical palettes, sequential palette lightness/chroma curves
- [Evil Martians OKLCH article](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) - OKLCH vs HSL/LCH advantages, hue stability
- [GitHub percentile rank gist](https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2) - Percentile/percentRank algorithm reference

### Tertiary (LOW confidence)
- OKLCH hue-to-emotion semantic mapping (warm=orange/red ~20-60, cool=blue ~200-260) -- based on color psychology research but subjective; tuning needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - culori v4 is well-documented, actively maintained, tree-shakeable, has all required functions
- Architecture: HIGH - Patterns follow existing codebase conventions (engine module pattern, vitest tests, TypeScript strict mode)
- Normalization: HIGH - Quantile normalization is a well-understood technique; implementation is simple
- Color science: HIGH for culori API usage; MEDIUM for optimal mapping coefficients (require empirical tuning)
- Pitfalls: HIGH - Well-documented OKLCH pitfalls (gamut mapping, hue wrapping, v4 breaking changes)

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (culori stable, color science stable, architecture patterns stable)