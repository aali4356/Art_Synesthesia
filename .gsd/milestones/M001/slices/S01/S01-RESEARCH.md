# Phase 1: Foundation & Determinism Infrastructure - Research

**Researched:** 2026-03-02
**Domain:** Next.js project scaffold, deterministic PRNG, input canonicalization, engine versioning, design system
**Confidence:** HIGH

## Summary

Phase 1 establishes the project skeleton and determinism contract for the Synesthesia Machine. The core technologies are well-established: Next.js 15 with App Router, TypeScript, Tailwind CSS v4, and Vitest for testing. Determinism requires a seeded PRNG (seedrandom with Alea algorithm), SHA-256 hashing via the Web Crypto API, and strict ESLint enforcement against Math.random(). Input canonicalization covers four types (text, JSON, CSV, URL) using standard Unicode NFC normalization and stable serialization. The design system uses next-themes for dark/light mode with Geist font family (sans + mono) and an OKLCH-based violet accent palette.

**Primary recommendation:** Use create-next-app for scaffolding, seedrandom for PRNG, Web Crypto API for SHA-256, next-themes for dark mode, Geist fonts via the `geist` npm package, and Vitest for testing. Keep dependencies minimal since this is a foundation phase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Art gallery / museum vibe -- generous whitespace (darkspace), understated typography, content floats in space
- UI should disappear so artwork is the hero -- think MoMA website, Artsy
- Ultra-minimal chrome: no visible borders or shadows on containers
- Separation achieved through spacing and subtle background tints only
- Buttons are text or ghost-style -- no heavy visual weight on interactive elements
- Curated font pair: Geist (sans-serif) + Geist Mono (monospace)
- Geist for all UI text, Geist Mono for parameter panel and technical elements
- Pre-generated showcase piece displayed on first visit
- Showcase randomly selected from a curated set of 5-10 pre-generated examples on each visit
- Minimal tagline: one evocative line, gallery-placard style
- Quick-start buttons provide additional guidance below the input zone
- Single vibrant accent color: violet / purple
- Accent used only as sparse touches: primary buttons, focus rings, active tab indicators, links
- Everything else stays neutral gray
- Near-black background (~#0a0a0a) for dark mode -- true gallery feel, maximum contrast with artwork, great on OLED

### Claude's Discretion
- Exact violet shade selection (should work in OKLCH color system and look good in both dark/light modes)
- Light mode color scheme details (maintain gallery aesthetic, readable, artwork still pops)
- Showcase-to-user-artwork transition style
- Exact tagline copy
- Specific spacing scale and layout grid

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | Identical parameter vectors for identical canonicalized inputs across runs | seedrandom with Alea PRNG + SHA-256 hashing ensures determinism |
| CORE-02 | All rendering randomness uses seeded PRNG, never Math.random() | seedrandom library provides drop-in seeded replacement |
| CORE-03 | PRNG seed derives from SHA-256(canonicalized_input + styleName + engineVersion) | Web Crypto API for SHA-256, seedrandom consumes hex string seed |
| CORE-04 | Engine versioning tracks analyzerVersion, normalizerVersion, rendererVersion, engineVersion | Simple TypeScript interface + version constants module |
| CORE-05 | Cache keys include inputHash + analyzerVersion + normalizerVersion | Template literal key generation from version object |
| CORE-06 | Render cache keys include all versions + styleName + resolution | Extended cache key template from CORE-05 pattern |
| CORE-07 | ESLint rule bans Math.random() in rendering and analysis code | no-restricted-syntax rule with AST selector in ESLint flat config |
| CANON-01 | Text NFC normalization, newline normalization, trailing whitespace trim | Built-in String.normalize('NFC') + regex replacements |
| CANON-02 | JSON parsed and re-serialized with stable alphabetical key ordering | Recursive key-sort + JSON.stringify |
| CANON-03 | CSV parsed with explicit rules, cell trimming, null normalization | PapaParse library for robust CSV parsing |
| CANON-04 | URL normalization: lowercase scheme/host, sort query params, etc. | Built-in URL API + custom normalization logic |
| CANON-05 | Canonicalization changes displayed in translation panel | Return diff array from canonicalization functions |
| DS-01 | Dark mode default with light mode toggle, system preference, persist | next-themes library handles all requirements |
| DS-02 | Minimal chrome: artwork is the hero element | Tailwind utility classes + design token system |
| DS-03 | Monospace font for technical elements, sans-serif for UI | Geist Sans + Geist Mono via `geist` npm package |
| DS-04 | Responsive: mobile stacks input above canvas, bottom sheet panel | Tailwind responsive breakpoints + CSS Grid/Flexbox |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.x | React framework with App Router | Industry standard, Vercel ecosystem, SSR/SSG |
| react / react-dom | ^19.x | UI library | Ships with Next.js 15 |
| typescript | ^5.x | Type safety | Ships with create-next-app |
| tailwindcss | ^4.x | Utility-first CSS | Ships with create-next-app, 70% smaller CSS than v3 |
| geist | ^1.x | Geist Sans + Geist Mono fonts | User locked decision, Vercel official, built for next/font |
| next-themes | ^0.4.x | Dark/light mode with system preference | Zero-flicker SSR solution, 2 lines to integrate |
| seedrandom | ^3.0.5 | Seeded PRNG with multiple algorithms | De facto standard, 40M+ downloads/month, includes Alea |
| vitest | ^3.x | Test runner | Vite-native, Jest-compatible, fastest for Next.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| papaparse | ^5.x | CSV parsing | CANON-03: robust delimiter/quote/encoding handling |
| @testing-library/react | ^16.x | Component testing | Testing React components in Vitest |
| @vitejs/plugin-react | ^4.x | React support for Vitest | Vitest config dependency |
| vite-tsconfig-paths | ^5.x | Path alias resolution | Vitest reads @ paths from tsconfig |
| jsdom | ^25.x | DOM environment | Vitest test environment |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| seedrandom | prando | prando is TS-native but fewer algorithms, less battle-tested |
| seedrandom | random-seedable | Smaller, but seedrandom's Alea is spec-referenced |
| papaparse | csv-parse | csv-parse is Node-only; PapaParse works browser+Node |
| next-themes | Custom implementation | Custom = re-solving flicker, localStorage, system pref detection |
| vitest | jest | Jest works but slower, no Vite integration |

**Installation:**
```bash
npx create-next-app@latest art-synesthesia --typescript --tailwind --eslint --app --src-dir
cd art-synesthesia
npm install seedrandom next-themes papaparse geist
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom vite-tsconfig-paths jsdom @types/seedrandom
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout with ThemeProvider, fonts
    page.tsx              # Landing page with showcase
    globals.css           # Tailwind + CSS custom properties
  lib/
    engine/
      version.ts          # Engine version constants and types
      seed.ts             # SHA-256 hashing + PRNG seed generation
      prng.ts             # Seeded PRNG wrapper around seedrandom
    canonicalize/
      index.ts            # Canonicalization router (detect type, dispatch)
      text.ts             # Text canonicalization (NFC, newlines, trim)
      json.ts             # JSON canonicalization (sort keys, normalize nums)
      csv.ts              # CSV canonicalization (PapaParse, trim, null)
      url.ts              # URL canonicalization (normalize, sort params)
      types.ts            # CanonResult type with changes array
    cache/
      keys.ts             # Cache key generation functions
  components/
    theme/
      ThemeProvider.tsx    # next-themes provider wrapper
      ThemeToggle.tsx      # Dark/light mode toggle button
    layout/
      Header.tsx           # Minimal app header
      Shell.tsx            # Responsive layout shell
  types/
    engine.ts              # VersionInfo, ParameterVector interfaces
  __tests__/               # Test files mirror src/ structure
```

### Pattern 1: Seeded PRNG Factory
**What:** Create a factory that produces a deterministic random number generator from input parameters.
**When to use:** Any time randomness is needed in rendering or analysis.
**Example:**
```typescript
import seedrandom from 'seedrandom';

export function createPRNG(seed: string): () => number {
  return seedrandom.alea(seed);
}

// Seed derivation
export async function deriveSeed(
  canonicalizedInput: string,
  styleName: string,
  engineVersion: string
): Promise<string> {
  const data = `${canonicalizedInput}${styleName}${engineVersion}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 2: Canonicalization with Change Tracking
**What:** Each canonicalizer returns both the canonical form and a list of changes applied.
**When to use:** CANON-05 requires displaying changes in the translation panel.
**Example:**
```typescript
interface CanonResult {
  canonical: string;
  changes: string[];
  inputType: 'text' | 'json' | 'csv' | 'url';
}

export function canonicalizeText(input: string): CanonResult {
  const changes: string[] = [];
  let result = input;

  // NFC normalization
  const nfc = result.normalize('NFC');
  if (nfc !== result) {
    changes.push('Applied Unicode NFC normalization');
    result = nfc;
  }

  // Newline normalization
  const newlines = result.replace(/\r\n|\r/g, '\n');
  if (newlines !== result) {
    changes.push('Normalized line endings to \\n');
    result = newlines;
  }

  // Trailing whitespace per line
  const trimmed = result.split('\n').map(line => line.trimEnd()).join('\n');
  if (trimmed !== result) {
    changes.push('Trimmed trailing whitespace');
    result = trimmed;
  }

  return { canonical: result, changes, inputType: 'text' };
}
```

### Pattern 3: Version Constants Module
**What:** Single source of truth for all engine version components.
**When to use:** Referenced by seed generation, cache keys, and UI display.
**Example:**
```typescript
export interface VersionInfo {
  engineVersion: string;
  analyzerVersion: string;
  normalizerVersion: string;
  rendererVersion: string;
}

export const CURRENT_VERSION: VersionInfo = {
  engineVersion: '0.1.0',
  analyzerVersion: '0.1.0',
  normalizerVersion: '0.1.0',
  rendererVersion: '0.1.0',
};
```

### Anti-Patterns to Avoid
- **Global Math.random override:** seedrandom can globally replace Math.random(). Never do this. Always create local PRNG instances.
- **Importing crypto from Node.js core:** Use `globalThis.crypto.subtle` which works in both browser and Node.js (Edge Runtime compatible).
- **Color tokens as hex values only:** Define colors in OKLCH for perceptual uniformity; convert to hex/rgb only for legacy fallbacks.
- **Tailwind v3 patterns in v4:** Tailwind v4 uses CSS-first configuration via `@theme` in CSS, not tailwind.config.js. Do not create a tailwind.config.js file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Seeded random numbers | Custom LCG/xorshift | seedrandom (Alea) | Period length, distribution quality, edge cases |
| CSV parsing | Regex-based parser | PapaParse | Quoted fields, escaped delimiters, encodings, empty rows |
| Dark mode toggle | Manual class toggling | next-themes | SSR flicker prevention, system preference, localStorage |
| Font loading | @font-face declarations | geist + next/font | Automatic subsetting, preloading, layout shift prevention |
| SHA-256 hashing | Third-party crypto lib | Web Crypto API | Built into all runtimes, zero dependencies, hardware-accelerated |

**Key insight:** Phase 1 is foundation work. Every shortcut or custom solution here gets inherited by 8 subsequent phases. Use battle-tested libraries to avoid compounding technical debt.

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch with Theme
**What goes wrong:** Server renders one theme, client mounts with a different one from localStorage. React throws hydration error.
**Why it happens:** localStorage is not available during SSR. Without blocking script injection, the initial render mismatches.
**How to avoid:** next-themes injects a blocking script in `<head>` that reads localStorage before React hydrates. Use the `attribute="class"` prop to add dark/light class to `<html>` for Tailwind dark mode.
**Warning signs:** "Text content does not match server-rendered HTML" in console.

### Pitfall 2: Non-Deterministic JSON Serialization
**What goes wrong:** `JSON.stringify` does not guarantee key order across engines/versions.
**Why it happens:** While V8 preserves insertion order, the spec says objects are unordered. Relying on engine behavior is fragile.
**How to avoid:** Always sort keys recursively before stringifying. Use a stable-stringify approach.
**Warning signs:** Intermittent hash mismatches for the same JSON input.

### Pitfall 3: Web Crypto API Availability in Tests
**What goes wrong:** `crypto.subtle` is undefined in Vitest jsdom environment.
**Why it happens:** jsdom does not fully implement Web Crypto API.
**How to avoid:** Use `globalThis.crypto` polyfill in test setup, or set Vitest to use `node` environment for crypto tests (Node.js has full Web Crypto support).
**Warning signs:** "Cannot read properties of undefined (reading 'digest')" in tests.

### Pitfall 4: Tailwind v4 Configuration Confusion
**What goes wrong:** Developer creates tailwind.config.js expecting v3 behavior.
**Why it happens:** Most tutorials still reference v3 config pattern.
**How to avoid:** Tailwind v4 uses CSS-first configuration. Theme customization goes in `@theme { }` blocks in CSS, not JavaScript config files.
**Warning signs:** Custom colors/spacing not applying despite being "configured."

### Pitfall 5: Unicode Normalization Not Applied Before Hashing
**What goes wrong:** Same visual text produces different hashes because one uses composed characters (NFC) and another uses decomposed (NFD).
**Why it happens:** Different input sources (copy-paste, keyboard, API) may deliver different Unicode forms.
**How to avoid:** ALWAYS canonicalize before hashing. The canonicalization step is the first thing in the pipeline, never optional.
**Warning signs:** Same-looking text producing different artwork.

### Pitfall 6: PapaParse Streaming for Large Files
**What goes wrong:** Using synchronous parse for large CSV causes UI freeze.
**Why it happens:** PapaParse can parse synchronously or via streaming. Default examples use synchronous.
**How to avoid:** For Phase 1, synchronous is fine (canonicalization only). Phase 6 (data analysis) should use streaming. Document this for future phases.
**Warning signs:** Not applicable yet, but note for DATA-05 (2-second requirement for 10K rows).

## Code Examples

### SHA-256 Hashing (Cross-Platform)
```typescript
// Works in browser, Node.js, and Edge Runtime
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### ESLint Math.random() Ban (Flat Config)
```javascript
// eslint.config.mjs
export default [
  // ... other configs
  {
    files: ['src/lib/render/**', 'src/lib/pipeline/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="Math"][property.name="random"]',
          message: 'Math.random() is banned in rendering/pipeline code. Use the seeded PRNG from lib/engine/prng.ts instead.',
        },
      ],
    },
  },
];
```

### next-themes Setup with Tailwind
```typescript
// src/app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="synesthesia-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### URL Canonicalization
```typescript
export function canonicalizeUrl(input: string): CanonResult {
  const changes: string[] = [];
  const url = new URL(input);

  // Lowercase scheme and host
  // URL API already lowercases these, but track it
  if (url.protocol !== url.protocol.toLowerCase()) {
    changes.push('Lowercased URL scheme');
  }

  // Remove default ports
  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
    changes.push('Removed default port');
  }

  // Sort query parameters alphabetically
  const params = new URLSearchParams(url.searchParams);
  const sortedParams = new URLSearchParams([...params.entries()].sort());
  if (sortedParams.toString() !== params.toString()) {
    changes.push('Sorted query parameters alphabetically');
  }
  url.search = sortedParams.toString();

  // Remove trailing slashes (but not root /)
  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.replace(/\/+$/, '');
    changes.push('Removed trailing slash');
    url.pathname = pathname;
  }

  // Remove fragment
  if (url.hash) {
    changes.push('Removed URL fragment');
    url.hash = '';
  }

  return {
    canonical: url.toString(),
    changes,
    inputType: 'url',
  };
}
```

### JSON Stable Serialization
```typescript
function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
      return sorted;
    }, {} as Record<string, unknown>);
}

export function canonicalizeJson(input: string): CanonResult {
  const changes: string[] = [];
  // Strip JSONC comments if present
  const stripped = input.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (stripped !== input) changes.push('Stripped JSON comments');

  const parsed = JSON.parse(stripped);
  const sorted = sortKeys(parsed);
  const canonical = JSON.stringify(sorted);

  if (JSON.stringify(JSON.parse(stripped)) !== canonical) {
    changes.push('Sorted keys alphabetically');
  }

  return { canonical, changes, inputType: 'json' };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | CSS-first @theme blocks | Tailwind v4 (2024) | No JS config needed, theme in CSS |
| next/font/google | geist npm package | Geist v1 (2024) | Direct import, optimized for Next.js |
| Jest for Next.js | Vitest (officially recommended) | Next.js 15 docs | Faster, Vite-native, Jest-compatible API |
| Node.js crypto module | Web Crypto API (globalThis.crypto) | Universal | Edge Runtime compatible, same API everywhere |
| HSL color space | OKLCH | CSS Color Level 4 (2023+) | Perceptually uniform, better for palette generation |

**Deprecated/outdated:**
- `tailwind.config.js` (v3 pattern) -- use CSS @theme in v4
- `@next/font` -- merged into `next/font` in Next.js 13.2+
- Node.js `require('crypto')` for hashing -- use `globalThis.crypto.subtle` for cross-runtime compatibility

## Open Questions

1. **OKLCH Violet Shade Selection**
   - What we know: OKLCH allows perceptual uniformity; violet hue is ~270-300 on the hue wheel
   - What's unclear: Exact L/C/H values for accent that works in both dark (#0a0a0a bg) and light modes
   - Recommendation: Start with oklch(0.65 0.25 285) for dark mode, adjust lightness for light mode variant. This is Claude's Discretion per CONTEXT.md.

2. **Tailwind v4 Dark Mode with next-themes**
   - What we know: next-themes adds `class="dark"` to `<html>`, Tailwind v4 supports `dark:` variant
   - What's unclear: Whether Tailwind v4's CSS-first config changes how dark mode variant is configured
   - Recommendation: Use `@variant dark (&:where(.dark, .dark *))` in CSS if needed, or rely on Tailwind v4's built-in `dark:` which should respect the class strategy by default.

3. **Web Crypto in Vitest jsdom**
   - What we know: jsdom doesn't implement Web Crypto; Node.js does
   - What's unclear: Whether there is a clean polyfill for jsdom, or if we should use a different test environment
   - Recommendation: Run crypto-dependent tests with `// @vitest-environment node` annotation, or create a test setup file with `globalThis.crypto = require('crypto').webcrypto`.

## Sources

### Primary (HIGH confidence)
- [seedrandom npm](https://www.npmjs.com/package/seedrandom) - API, algorithms (Alea, xor128, etc.)
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation) - create-next-app setup
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest) - Official test setup
- [MDN SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) - SHA-256 API
- [ESLint no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax) - AST selectors
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) - Dark mode configuration
- [geist npm](https://www.npmjs.com/package/geist) - Font package usage
- [MDN oklch()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch) - OKLCH CSS function

### Secondary (MEDIUM confidence)
- [Tailwind v4 Setup Guide](https://designrevision.com/blog/tailwind-nextjs-setup) - CSS-first config pattern
- [PapaParse npm](https://www.npmjs.com/package/papaparse) - CSV parsing configuration

### Tertiary (LOW confidence)
- None -- all findings verified against primary or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries are well-established with official documentation
- Architecture: HIGH - standard Next.js patterns, no novel architecture needed
- Pitfalls: HIGH - common issues well-documented in library READMEs and GitHub issues

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days -- stable technology stack)