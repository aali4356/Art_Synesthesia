# Phase 1: Foundation & Determinism Infrastructure - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold (Next.js App Router + TypeScript + Tailwind), seeded PRNG infrastructure, input canonicalization suite (text, JSON, CSV, URL), engine versioning system, ESLint Math.random() ban, and the design system shell with dark/light mode. This phase delivers the foundation that all subsequent code inherits.

</domain>

<decisions>
## Implementation Decisions

### Aesthetic direction
- Art gallery / museum vibe — generous whitespace (darkspace), understated typography, content floats in space
- UI should disappear so artwork is the hero — think MoMA website, Artsy
- Ultra-minimal chrome: no visible borders or shadows on containers
- Separation achieved through spacing and subtle background tints only
- Buttons are text or ghost-style — no heavy visual weight on interactive elements

### Typography
- Curated font pair: Geist (sans-serif) + Geist Mono (monospace)
- Geist for all UI text, Geist Mono for parameter panel and technical elements
- Fits the gallery aesthetic and the Next.js/Vercel ecosystem

### Landing experience
- Pre-generated showcase piece displayed on first visit — shows what the app produces before user types anything
- Showcase randomly selected from a curated set of 5-10 pre-generated examples on each visit
- Keeps it fresh for returning users while demonstrating variety
- Minimal tagline: one evocative line, gallery-placard style (e.g., "Turn anything into art." or similar — exact copy TBD)
- Quick-start buttons provide additional guidance below the input zone

### Landing transition
- Claude's Discretion: transition from showcase artwork to user-generated artwork — pick what feels natural with the progressive build animation

### Accent color palette
- Single vibrant accent color: violet / purple
- Accent used only as sparse touches: primary buttons, focus rings, active tab indicators, links
- Everything else stays neutral gray — the accent is a whisper, not a shout
- Near-black background (~#0a0a0a) for dark mode — true gallery feel, maximum contrast with artwork, great on OLED
- Light mode: Claude's Discretion on exact background shade, maintaining the gallery feel

### Claude's Discretion
- Exact violet shade selection (should work in OKLCH color system and look good in both dark/light modes)
- Light mode color scheme details (maintain gallery aesthetic, readable, artwork still pops)
- Showcase-to-user-artwork transition style
- Exact tagline copy
- Specific spacing scale and layout grid

</decisions>

<specifics>
## Specific Ideas

- "Like a gallery wall" — the dark background should make artwork feel like it's floating in a gallery space
- MoMA / Artsy as reference points for the overall feel
- The showcase piece on landing should immediately communicate "this turns input into art" without needing explanation
- Gallery-placard style tagline — short, evocative, not instructional

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes all patterns for subsequent phases

### Integration Points
- SYNESTHESIA_MACHINE_SPEC.md exists at project root with detailed specification (can be referenced during implementation)
- .planning/ directory already set up with PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-determinism-infrastructure*
*Context gathered: 2026-03-02*
