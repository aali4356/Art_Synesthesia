---
id: S01
parent: M001
milestone: M001
provides:
  - Next.js 16 app shell with TypeScript strict mode
  - Vitest test runner with jsdom and Web Crypto polyfill
  - Geist Sans and Geist Mono font loading via next/font/google
  - Directory structure for engine, canonicalize, cache, components
  - Core type definitions (VersionInfo, ParameterVector, CanonResult, ParameterProvenance)
  - Seeded PRNG (seedrandom Alea) with deterministic sequence generation
  - SHA-256 hashing via Web Crypto API
  - Engine version object (4-component versioning)
  - Cache key generation (analysis keys and render keys)
  - ESLint rule banning Math.random() in render/pipeline code
  - Text canonicalization (NFC, newline normalization, whitespace trimming)
  - JSON canonicalization (recursive key sorting, JSONC comment stripping)
  - CSV canonicalization (PapaParse, cell trimming, empty-to-null)
  - URL canonicalization (scheme/host lowercase, default port removal, query sorting)
  - Unified canonicalize router dispatching by input type
  - ThemeProvider with dark default, system detection, localStorage persistence
  - ThemeToggle component (ghost-style, hydration-safe)
  - Responsive Shell layout with Header
  - OKLCH design tokens (violet accent, dark/light palettes)
  - Gallery-padding responsive utility
  - Ghost and accent button styles
requires: []
affects: []
key_files: []
key_decisions:
  - "Used next/font/google for Geist fonts (create-next-app default) rather than geist npm package import"
  - "Web Crypto polyfill uses Uint8Array assertions instead of ArrayBuffer instanceof (jsdom compatibility)"
  - "Installed all Phase 1 dependencies upfront to avoid repeated package installs"
  - "Alea algorithm chosen for seedrandom (fast, good distribution, deterministic)"
  - "SHA-256 via crypto.subtle.digest for cross-platform compatibility (browser + Node)"
  - "deriveSeed concatenates input+style+version with | separator before hashing"
  - "ESLint ban targets src/lib/render/ and src/lib/pipeline/ directories only"
  - "URL default port detection reads from original input string (URL API auto-strips default ports)"
  - "JSON canonicalization strips JSONC-style comments (// and /* */) before parsing"
  - "CSV uses PapaParse with dynamicTyping:false to keep all values as strings for canonical consistency"
  - "Empty CSV cells normalized to 'null' string in canonical output"
  - "Violet accent: oklch(0.65 0.25 285) — high chroma at 285 hue for vibrant purple"
  - "Dark mode background: oklch(0.09 0.005 250) approximating #0a0a0a per user requirement"
  - "ThemeProvider uses storageKey='synesthesia-theme' for namespaced localStorage"
  - "Gallery-padding scales from 2rem (mobile) to 4rem (desktop at 1024px)"
  - "No borders or shadows on containers (gallery aesthetic, user locked decision)"
patterns_established:
  - "Test setup: src/__tests__/setup.ts with Web Crypto polyfill for all test files"
  - "Type definitions: src/types/engine.ts as central type registry"
  - "Directory layout: src/lib/{domain}/ for library code, src/__tests__/{domain}/ for tests"
  - "All randomness through createPRNG(seed) — never Math.random()"
  - "Hash function returns lowercase hex string"
  - "Cache keys are composites of hash + version components"
  - "Barrel exports via index.ts in each library module"
  - "All canonicalizers return CanonResult {canonical, changes, inputType}"
  - "Changes array tracks each normalization applied for transparency"
  - "canonicalize() router auto-detects input type and dispatches"
  - "Design tokens in @theme block using Tailwind v4 CSS-first config"
  - "Dark/light mode via CSS custom properties + .dark class selector"
  - "Hydration-safe client components: useState(false) + useEffect(() => setMounted(true))"
  - "Shell wraps all pages with Header + responsive main content area"
  - "Ghost buttons as default interactive style; accent for primary actions only"
observability_surfaces: []
drill_down_paths: []
duration: 10min
verification_result: passed
completed_at: 2026-03-02
blocker_discovered: false
---
# S01: Foundation Determinism Infrastructure

**# Plan 01-01: Project Scaffold Summary**

## What Happened

# Plan 01-01: Project Scaffold Summary

**Next.js 16 app with Geist fonts, Vitest runner, TypeScript strict mode, and full Phase 1 dependency set**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 8+

## Accomplishments
- Next.js 16 with TypeScript strict mode, Tailwind v4, ESLint flat config
- Vitest configured with jsdom environment and Web Crypto polyfill
- Geist Sans and Geist Mono loaded via next/font/google
- Core type definitions (ParameterVector with 15 fixed dimensions, VersionInfo, CanonResult, ParameterProvenance)
- All Phase 1 dependencies installed (seedrandom, next-themes, papaparse, etc.)

## Task Commits

1. **Task 1-2: Full scaffold** - `070ea1d` (feat)

## Files Created/Modified
- `package.json` - Project manifest with all Phase 1 dependencies
- `vitest.config.mts` - Vitest with jsdom, tsconfigPaths, react plugin
- `src/__tests__/setup.ts` - Web Crypto polyfill for test environment
- `src/__tests__/sample.test.ts` - Baseline tests (TS config, crypto.subtle)
- `src/types/engine.ts` - Core interfaces (VersionInfo, ParameterVector, CanonResult, ParameterProvenance)
- `src/app/layout.tsx` - Root layout with Geist fonts and suppressHydrationWarning
- `src/app/page.tsx` - Minimal placeholder page
- `src/app/globals.css` - Tailwind v4 import with basic setup

## Decisions Made
- Used Uint8Array instead of ArrayBuffer for crypto hash assertions (jsdom returns Buffer-like objects that fail instanceof ArrayBuffer)
- Polyfill check uses `!globalThis.crypto?.subtle` instead of `typeof globalThis.crypto === 'undefined'` because jsdom defines crypto without subtle

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
- jsdom provides a partial crypto object (without subtle), requiring a more specific polyfill check
- Resolved by checking `!globalThis.crypto?.subtle` and using `writable: true, configurable: true` in property definition

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All dependencies installed, test runner working, types defined
- Wave 2 plans (01-02, 01-03, 01-04) can execute in parallel

---
*Phase: 01-foundation-determinism-infrastructure*
*Completed: 2026-03-02*

# Plan 01-02: Determinism Infrastructure Summary

**Seeded PRNG via seedrandom Alea, SHA-256 hashing via Web Crypto, 4-component engine versioning, and ESLint Math.random() ban**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3
- **Files modified:** 7
- **Tests:** 26 passing

## Accomplishments
- SHA-256 hashing with Web Crypto API producing deterministic hex digests
- Seeded PRNG (Alea) generating reproducible [0,1) sequences from any seed string
- deriveSeed function combining input hash + style + version into unique render seeds
- Engine version system with 4 independent components (engine, analyzer, normalizer, renderer)
- Cache key generators for analysis and render operations
- ESLint rule blocking Math.random() in render/pipeline code paths

## Task Commits

1. **Tasks 1-3: Full determinism infrastructure** - `3229e95` (feat)

## Files Created/Modified
- `src/lib/engine/version.ts` - CURRENT_VERSION object and getVersionString()
- `src/lib/engine/hash.ts` - sha256() via crypto.subtle.digest
- `src/lib/engine/prng.ts` - createPRNG() and deriveSeed()
- `src/lib/engine/index.ts` - Barrel exports
- `src/lib/cache/keys.ts` - analysisKey() and renderKey()
- `src/lib/cache/index.ts` - Barrel export
- `eslint.config.mjs` - Math.random() ban via no-restricted-syntax AST selector

## Decisions Made
- Used MemberExpression AST selector `[object.name="Math"][property.name="random"]` for precise Math.random() detection
- Cache key separators use `|` to prevent collision between similar inputs

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Determinism contract established: all future rendering/pipeline code must use createPRNG()
- Cache keys ready for Phase 7 caching infrastructure
- Version system ready for Phase 4 translation panel display

---
*Phase: 01-foundation-determinism-infrastructure*
*Completed: 2026-03-02*

# Plan 01-03: Input Canonicalization Suite Summary

**Four canonicalizers (text, JSON, CSV, URL) with unified router, producing stable canonical output for all input types**

## Performance

- **Duration:** ~15 min
- **Tasks:** 5
- **Files modified:** 5
- **Tests:** 43 passing

## Accomplishments
- Text canonicalization: NFC normalization, \r\n to \n, trailing whitespace trim per line
- JSON canonicalization: Recursive key sorting, JSONC comment stripping, number normalization
- CSV canonicalization: PapaParse integration, cell trimming, empty-to-null normalization
- URL canonicalization: Lowercase scheme/host, default port removal, query param sorting, fragment removal
- Unified router with auto-detection and barrel exports
- Comprehensive edge case coverage (Unicode, empty inputs, whitespace-only, special characters)

## Task Commits

1. **Tasks 1-5: Full canonicalization suite** - `1942fa0` (feat)

## Files Created/Modified
- `src/lib/canonicalize/text.ts` - NFC, newline normalization, whitespace trimming
- `src/lib/canonicalize/json.ts` - Recursive key sorting, comment stripping
- `src/lib/canonicalize/csv.ts` - PapaParse integration, cell normalization
- `src/lib/canonicalize/url.ts` - URL API normalization with default port detection
- `src/lib/canonicalize/index.ts` - Router and barrel exports

## Decisions Made
- Default port detection parses from original input string because URL API constructor auto-strips default ports (443 for https, 80 for http), making `url.port` always empty for default ports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] URL default port detection**
- **Found during:** Task 4 (URL canonicalization)
- **Issue:** URL API auto-strips default ports during construction, so `url.port === '443'` never matches
- **Fix:** Extract port from original input string via regex `/:\/\/[^/:]+:(\d+)/` and compare against defaults
- **Files modified:** src/lib/canonicalize/url.ts
- **Verification:** All 12 URL tests pass including explicit default port test cases
- **Committed in:** `1942fa0`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary for correctness. No scope creep.

## Issues Encountered
- URL API default port stripping behavior required alternative detection approach (documented above)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four input types can be canonicalized deterministically
- Router dispatches by type, ready for analysis pipeline integration in Phase 3
- CanonResult provides change tracking for future translation panel

---
*Phase: 01-foundation-determinism-infrastructure*
*Completed: 2026-03-02*

# Plan 01-04: Design System Summary

**Gallery-aesthetic design system with OKLCH color tokens, dark/light mode via next-themes, and responsive Shell layout**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 8
- **Tests:** 3 new (74 total passing)

## Accomplishments
- ThemeProvider wrapping app with dark default, system preference detection, localStorage persistence
- ThemeToggle with ghost-style button, sun/moon SVG icons, hydration-safe rendering
- OKLCH design tokens: violet accent at oklch(0.65 0.25 285), near-black dark background, warm white light mode
- Responsive Shell layout: Header (logo + toggle) and gallery-padded main content area
- Gallery-style landing page with placeholder artwork area and tagline
- Custom utility classes: btn-ghost, btn-accent, gallery-padding, text-muted, bg-muted

## Task Commits

1. **Tasks 1-2: Full design system** - `134bba6` (feat)

## Files Created/Modified
- `src/components/theme/ThemeProvider.tsx` - next-themes wrapper with dark default and enableSystem
- `src/components/theme/ThemeToggle.tsx` - Ghost button with sun/moon icons, hydration-safe
- `src/components/layout/Header.tsx` - Minimal header with logo text and ThemeToggle
- `src/components/layout/Shell.tsx` - Responsive layout shell with gallery-padding
- `src/app/globals.css` - Full OKLCH design token system, dark/light mode, utility classes
- `src/app/layout.tsx` - Updated to wrap with ThemeProvider
- `src/app/page.tsx` - Updated to use Shell with gallery-style landing
- `src/__tests__/components/ThemeToggle.test.tsx` - Rendering and accessibility tests

## Decisions Made
- Used inline SVG for sun/moon icons to avoid icon library dependency
- max-w-6xl (1152px) for main content area width constraint
- min-h-[70vh] for landing content to create gallery-like vertical centering

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Design system foundation established for all future UI work
- Shell layout ready for input zone (Phase 3), canvas (Phase 4), translation panel (Phase 4)
- Color tokens and button styles ready for interactive elements

---
*Phase: 01-foundation-determinism-infrastructure*
*Completed: 2026-03-02*
