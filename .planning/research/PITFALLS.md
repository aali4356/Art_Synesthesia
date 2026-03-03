# Pitfalls Research

**Domain:** Deterministic generative art web application (Synesthesia Machine)
**Researched:** 2026-03-02
**Confidence:** MEDIUM-HIGH (verified across multiple sources; some claims rely on well-established domain knowledge)

## Critical Pitfalls

### Pitfall 1: Cross-Browser Canvas Non-Determinism

**What goes wrong:**
The same rendering code produces visually identical but byte-different canvas output across browsers, operating systems, and GPU hardware. Anti-aliasing algorithms, subpixel rendering, color management profiles, and floating-point precision differences in GPU drivers all contribute pixel-level variance. This is the exact mechanism behind canvas fingerprinting -- browsers are *designed* to differ at this level. A user creates art on Chrome/macOS, shares a link, and a friend on Firefox/Windows sees subtly different output. The determinism promise ("same input = same art always") breaks silently.

**Why it happens:**
The Canvas 2D spec does not mandate bit-exact rendering. Browsers delegate to platform graphics libraries (Skia in Chromium, Core Graphics in Safari, etc.) which apply different anti-aliasing, text rasterization, and image interpolation algorithms. GPU drivers introduce further variance in floating-point operations. `toDataURL()` also uses different PNG compression implementations across browsers, and alpha channel handling differs -- pixels with non-opaque alpha produce cross-browser inconsistencies during encode/decode.

**How to avoid:**
1. Accept that client-side rendering will have cosmetic cross-browser differences -- this is unavoidable and explicitly acknowledged in PROJECT.md.
2. Define determinism at the *parameter level*, not the pixel level. Same parameters = same visual intent, rendered by whatever browser the viewer uses.
3. For canonical/sharable output (exports, gallery thumbnails, social previews), always use server-side rendering with a pinned environment (skia-canvas on Node.js, or headless Chromium with a locked version). This eliminates browser/OS/GPU variance entirely.
4. Avoid using `globalCompositeOperation` modes that compound floating-point differences across layers.
5. Keep alpha channels fully opaque in intermediate rendering steps to avoid encode/decode inconsistencies.

**Warning signs:**
- Visual diff tests between browsers show pixel differences exceeding anti-aliasing tolerance
- Users report "my art looks different on my phone"
- `canvas.toDataURL()` produces different hashes for the same input on different machines
- Gallery thumbnails don't match what users see locally

**Phase to address:**
Phase 1 (Foundation) -- Establish server-side rendering for canonical output from the start. Do not defer this to "export" phase. The rendering architecture must assume client rendering is approximate and server rendering is authoritative.

---

### Pitfall 2: PRNG Seeding That Silently Breaks Determinism

**What goes wrong:**
The PRNG produces different sequences for the "same" seed because: (a) the string-to-seed hash function loses information or collides, (b) the PRNG is called a different number of times due to conditional logic in rendering, (c) `Math.random()` leaks into a code path, or (d) JavaScript's number precision silently truncates 64-bit seed values. xoshiro256** requires BigInt seeds in JavaScript because the Number type cannot represent 64-bit integers without precision loss. Mulberry32 avoids this but has only a 32-bit state space, making birthday collisions likely at scale.

**Why it happens:**
JavaScript's `Number` is IEEE 754 double-precision (53 bits of mantissa), which cannot losslessly represent 64-bit integers. Developers write `xoshiro256(seed)` where `seed` is a regular Number, silently truncating bits. Separately, rendering code that uses `if/else` branches consuming random values in some branches but not others creates "PRNG drift" -- the sequence diverges based on rendering path, not seed alone. Finally, any use of `Math.random()` (even in a third-party library) introduces true non-determinism.

**How to avoid:**
1. Use Mulberry32 (32-bit, no BigInt needed, full 2^32 period) for rendering unless you genuinely need more state. It is simpler and avoids the 64-bit precision trap entirely in JavaScript.
2. Use a well-tested hash function (xmur3 or cyrb128) to convert string seeds to numeric seeds deterministically.
3. Ban `Math.random()` from the entire rendering pipeline with a lint rule (`no-restricted-globals` or a custom ESLint rule that flags `Math.random`).
4. Structure rendering so the PRNG is consumed in a fixed, deterministic order regardless of conditional branches -- consume random values even when unused to maintain sequence alignment.
5. Write snapshot tests: for each rendering style, pin 5+ seed/parameter combinations and assert the PRNG call count and output hash remain identical.

**Warning signs:**
- Art changes visually when you refactor rendering logic without changing parameters
- Hash comparisons fail intermittently
- `Math.random` appears in `node_modules` of rendering dependencies
- Two "identical" inputs produce different art when style parameter triggers different branches

**Phase to address:**
Phase 1 (Foundation) -- PRNG infrastructure and `Math.random()` ban must be established before any rendering code is written. Snapshot tests should be added in the rendering phase.

---

### Pitfall 3: Normalization Calibration That Produces Boring or Clustered Art

**What goes wrong:**
The quantile-based normalization maps raw analysis values (sentiment, entropy, word count, etc.) to the 0-1 parameter range. If the calibration dataset is biased (e.g., mostly English prose, mostly short texts), then real-world inputs cluster into narrow parameter bands. Result: 80% of inputs produce art that looks nearly identical. Alternatively, if calibration uses too few reference inputs, the quantile breakpoints are unstable and shift dramatically when you add a few more reference inputs -- destroying reproducibility of previously generated art.

**Why it happens:**
Quantile normalization is sensitive to the reference distribution. If calibration texts are all similar in length/sentiment/entropy, the quantile function becomes nearly flat across the range of real user inputs. This is the "class-effect proportion" problem from bioinformatics applied to art: when calibration data doesn't represent the diversity of real inputs, normalization compresses the output distribution rather than spreading it. The PROJECT.md requires 30+ text, 15+ URL, and 15+ data reference inputs -- but the *composition* of those inputs matters more than the count.

**How to avoid:**
1. Design the calibration corpus deliberately: include extreme inputs (single character, 10,000-word essay, pure numbers, emoji-only, multiple languages, code snippets, poetry, legal text).
2. After initial calibration, visualize the parameter distribution across the calibration set as a histogram per dimension. If any dimension has >50% of values in a 0.2-wide band, the calibration is biased.
3. Version the calibration dataset alongside the normalizer version. When the calibration set changes, the normalizerVersion must increment.
4. Implement a "parameter diversity score" that measures how spread the ~15 parameters are for a given input -- warn internally during development if inputs consistently score low diversity.
5. Split calibration by input type (text, URL, data) rather than normalizing across types. Each type has fundamentally different distributions.

**Warning signs:**
- Users say "all the art looks the same"
- Parameter histograms across test inputs show tight clustering
- Adding a single reference input to calibration dramatically changes existing parameter mappings
- One input type (e.g., short text) always maps to the same narrow parameter range

**Phase to address:**
Phase 2 (Analysis Pipeline) -- Calibration design must happen before any normalization code. Build the calibration harness and visualization tooling first, then tune. Revisit after user testing in a later phase.

---

### Pitfall 4: NLP Analysis Producing Meaningless Parameters from Short/Unusual Inputs

**What goes wrong:**
Sentiment analysis, syllable counting, and entropy calculation all degrade severely on short text (< 20 characters), non-English text, emoji-heavy input, URLs-as-text, and code snippets. Sentiment models trained on product reviews return "neutral" for everything that isn't a movie review. Syllable counters fail on proper nouns and non-dictionary words. The result: the parameter vector for "Hello" and "Ahmad" and "XYZ123" all map to nearly identical values, producing nearly identical art for very different inputs.

**Why it happens:**
NLP tools are trained on specific corpora (product reviews, news articles, social media) and their accuracy drops precipitously outside that domain. Short text lacks sufficient context for sentiment algorithms. Lexicon-based approaches fail on polysemous words, sarcasm, and domain-specific vocabulary. Most JavaScript NLP libraries (natural, compromise, sentiment) are lightweight by design and sacrifice accuracy for size/speed. The project analyzes arbitrary user input, not curated text -- the worst case for NLP accuracy.

**How to avoid:**
1. Use NLP features (sentiment, readability scores) as *contributing signals*, never as dominant parameters. Weight character-level statistics (entropy, frequency distribution, character class ratios) more heavily because they are robust to input type and length.
2. Implement input-length-aware weighting: for inputs under 20 characters, reduce NLP-derived parameter weights to near zero and increase weight on character-level features (bigram entropy, unicode block distribution, character frequency deviation from English).
3. Design a "feature confidence" score per analysis dimension that attenuates the parameter contribution when the analyzer has low confidence (e.g., sentiment confidence < 0.3 means sentiment contributes minimally to the parameter vector).
4. Test the analysis pipeline against an adversarial input set: single characters, emoji strings, code blocks, non-Latin scripts, repeated words, URLs pasted as text.
5. The parameter provenance display ("why does my art look this way?") naturally surfaces weak signals -- if sentiment says "neutral 0.51" for a haiku, the user sees the explanation is meaningless, which is worse than the art looking wrong.

**Warning signs:**
- Sentiment returns 0.5 (neutral) for >60% of test inputs
- Short names all produce visually similar art
- Non-English text always maps to the same parameter range
- Parameter provenance panel shows one dimension dominating all others

**Phase to address:**
Phase 2 (Analysis Pipeline) -- Build the adversarial test suite before implementing analysis. Test-driven: define expected parameter diversity for edge-case inputs, then build analyzers to meet that bar.

---

### Pitfall 5: Engine Versioning That Breaks Saved Art

**What goes wrong:**
A user generates art, shares a link, and bookmarks it. Later, you update the rendering algorithm, normalization calibration, or analysis pipeline. The shared link now produces different art because the engine changed. Saved gallery entries that stored only parameters (not pixels) now render differently. Users lose trust in the "deterministic" promise.

**Why it happens:**
The project has four versioned components (engineVersion, analyzerVersion, normalizerVersion, rendererVersion) but implementing version-locked replay is hard. Developers either: (a) forget to bump a version when changing behavior, (b) don't keep old code paths for backward compatibility, or (c) version at too coarse a granularity (e.g., bumping "engine v2" when only the organic renderer changed, invalidating all styles).

**How to avoid:**
1. Store the full version tuple (analyzer + normalizer + renderer + engine) alongside every saved parameter set and every share link.
2. Keep old rendering code paths frozen and importable by version. Use a registry pattern: `renderers['geometric-v1']`, `renderers['geometric-v2']`.
3. When rendering a saved piece, always use the stored version's renderer, not the current one.
4. Automate version bump detection: a CI test generates art for 10 pinned seeds using the current version tuple, and fails if output hashes change without a version increment.
5. Version at the style level, not the engine level. If only the organic renderer changes, only `organic-renderer` version increments. Geometric art is unaffected.

**Warning signs:**
- Gallery art "shifts" after a deployment
- Share links produce different art than when created
- CI rendering tests break unexpectedly
- No automated test catches rendering behavior changes

**Phase to address:**
Phase 1 (Foundation) -- Version schema and the registry pattern must be designed upfront. Rendering snapshot tests must be established when each style is implemented. The version-locked replay strategy must be part of the data model from day one.

---

### Pitfall 6: Input Canonicalization That Misses Edge Cases

**What goes wrong:**
Two inputs that a user considers "the same" produce different art because canonicalization missed an edge case. Examples: (a) Unicode text with combining characters vs. precomposed characters (cafe vs. cafe with combining accent), (b) JSON with different key orders or whitespace, (c) CSV with trailing newlines vs. without, (d) URLs with/without trailing slashes, with/without www, with/without scheme, percent-encoded vs. decoded characters. Each missed case breaks the determinism promise for that user.

**Why it happens:**
Unicode NFC normalization handles the canonical equivalence case, but there are many other normalization dimensions: whitespace normalization (tabs vs. spaces, trailing whitespace, BOM characters), case sensitivity decisions, JSON key ordering (RFC 8785 JCS defines one standard, but few libraries implement it), CSV quoting variations, and URL normalization (scheme, trailing slash, query parameter ordering, fragment removal). Developers implement the obvious cases and miss the long tail.

**How to avoid:**
1. For text: Apply Unicode NFC normalization, trim leading/trailing whitespace, collapse internal whitespace runs to single spaces, strip BOM. Document that canonicalization is case-sensitive (intentional -- "Hello" and "hello" should produce different art).
2. For JSON: Use RFC 8785 (JSON Canonicalization Scheme) or a simplified version that recursively sorts keys and normalizes number representation. Strip whitespace.
3. For CSV: Normalize line endings to `\n`, trim trailing empty rows, standardize quoting. Use a deterministic CSV parser, not regex.
4. For URLs: Normalize scheme to https, remove default ports, remove fragments, sort query parameters, decode unnecessary percent-encoding, remove trailing slashes. Use the WHATWG URL parser (built into Node.js and browsers).
5. Write a canonicalization test suite with 50+ edge cases per input type. If an edge case isn't tested, assume it's broken.

**Warning signs:**
- Users report "I typed the same thing and got different art"
- Copy-pasting text from different sources (Word, web, terminal) produces different art
- JSON/CSV inputs with different formatting produce different art
- URL with and without `www.` produces different art

**Phase to address:**
Phase 1 (Foundation) -- Canonicalization is part of the determinism contract. Define and test it before building analysis pipelines that consume canonicalized input.

---

### Pitfall 7: SSRF Vulnerability in URL Input

**What goes wrong:**
The URL input feature fetches arbitrary user-supplied URLs server-side. An attacker submits URLs targeting internal services (cloud metadata endpoints like `169.254.169.254`, internal APIs, localhost services), exfiltrating sensitive data or triggering internal actions. DNS rebinding attacks bypass hostname validation: the attacker's domain resolves to a public IP during validation, then to an internal IP when the actual fetch occurs.

**Why it happens:**
URL validation that only checks the hostname string (blocklist of "localhost", "127.0.0.1") is trivially bypassed with IP encoding tricks (decimal IP `2130706433` = `127.0.0.1`), IPv6 notation (`::1`), DNS rebinding, or redirect chains. Many Node.js HTTP clients follow redirects by default, allowing an attacker to redirect from a "safe" URL to an internal target.

**How to avoid:**
1. Resolve the hostname to an IP address *before* making the request, then validate the resolved IP against a blocklist of private ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, fc00::/7).
2. Pin the resolved IP for the actual request (pass the resolved IP to the HTTP client, not the hostname) to prevent DNS rebinding between validation and request.
3. Disable automatic redirect following, or re-validate each redirect target against the same blocklist.
4. Restrict allowed protocols to `https:` only (block `file:`, `gopher:`, `ftp:`, `data:` schemes).
5. Set strict timeouts (5s connect, 10s total) and response size limits (5MB) to prevent slowloris and resource exhaustion.
6. Consider using the `agent-fetch` library or a similar sandboxed HTTP client specifically designed for SSRF protection.

**Warning signs:**
- No integration test that attempts to fetch `http://169.254.169.254/latest/meta-data/` and expects a block
- URL fetching follows redirects without re-validation
- Validation uses string matching instead of IP range checking
- No timeout on URL fetching

**Phase to address:**
Phase 2 (Analysis Pipeline) -- SSRF protection must be implemented and tested before the URL analysis feature goes live. It is a security-critical blocker, not a "nice to have."

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `Math.random()` in a rendering utility "just for testing" | Faster prototyping | Breaks determinism guarantee, hard to find later | Never -- use seeded PRNG from day one |
| Hardcoding calibration values instead of loading from the calibration harness | Faster initial development | Normalization breaks when calibration corpus changes; impossible to re-calibrate without code changes | Never -- calibration data should be externalized from the start |
| Server-side rendering with a different canvas library than the browser uses | Faster server setup | Pixel differences between client preview and exported image | Acceptable in MVP if documented; use skia-canvas on server to match Chromium's Skia backend |
| Storing raw input in the database "temporarily" for debugging | Easier debugging of analysis issues | Privacy violation, data breach risk, violates core product promise | Never -- log parameter vectors and analysis intermediates, never raw input |
| Skipping version bumps during rapid iteration | Fewer version numbers to manage | Saved art silently changes, share links break, user trust eroded | Only during pre-launch development with no persisted data |
| Using `node-canvas` (Cairo-based) for server rendering | Widely used, more documentation | Different rendering engine than browsers (Cairo vs. Skia), causing client/server visual mismatch | Use skia-canvas instead for Chromium parity |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| URL fetching (web scraping) | Not respecting `robots.txt`, not handling GDPR implications of scraping personal data from pages | Respect `robots.txt`, strip personally identifiable information from scraped content before analysis, set a descriptive User-Agent, handle HTTP errors gracefully |
| Font loading for Typographic style | Assuming system fonts are available on the server and across browsers | Bundle specific web fonts (WOFF2), register them explicitly in both browser canvas and server-side skia-canvas. Never rely on system fonts for deterministic rendering |
| OKLCH color space in canvas | Using OKLCH values directly in canvas context (which only accepts sRGB) | Convert OKLCH to sRGB for canvas `fillStyle`/`strokeStyle`. Use OKLCH for palette *generation* math, then convert. Gamut-map out-of-range colors gracefully -- clamp chroma, not lightness |
| PostgreSQL + Drizzle ORM | Not indexing the version columns, making version-locked queries slow | Add composite indexes on (shareId, engineVersion) and (galleryId, rendererVersion) from the initial migration |
| Cloud metadata endpoints | Deploying on AWS/GCP/Azure without blocking metadata endpoint access from the application | Block `169.254.169.254` and equivalent cloud metadata IPs at both the application level (SSRF protection) and network level (firewall rules) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 4096x4096 canvas render on client side | Browser tab crashes, "canvas area exceeds maximum limit" errors, mobile devices freeze | Always render high-res exports server-side. Client renders at display resolution only (800x800 or device pixel ratio). A 4096x4096 RGBA canvas requires ~67MB of memory. | Immediately on most mobile devices; on desktop browsers at ~8192x8192 |
| Particle system with too many particles on mobile | Frame drops, battery drain, janky animation | Cap particle count based on device capability detection. Use `navigator.hardwareConcurrency` and canvas size to set limits. Target 1000 particles mobile, 5000 desktop | >500 particles on low-end mobile (2GB RAM devices) |
| Perlin noise recalculation per frame without caching | Animation stutters, high CPU usage, rendering exceeds 1s budget | Pre-compute noise grid at generation time, cache in a typed array (Float32Array). Only animate particle positions, not the noise field | Immediately visible with octave-based noise (4+ octaves at 800x800 = millions of noise evaluations) |
| Synchronous URL fetching blocking the analysis pipeline | UI shows "Analyzing..." for 10+ seconds with no progress feedback | Use streaming analysis: fetch with a timeout, show progress as each analysis step completes. Implement a 5-second hard timeout with partial results fallback | URLs with slow responses, large pages (>2MB HTML), redirect chains |
| Gallery queries without pagination | Page load time increases linearly with gallery size | Implement cursor-based pagination from the start (not offset-based, which degrades at high page numbers). Limit gallery API to 20 items per request | >500 gallery entries |
| Calibration harness loading all 60+ reference inputs on every analysis | Analysis startup takes seconds, burns memory | Load calibration quantile breakpoints (pre-computed), not raw reference inputs. Compute breakpoints offline during calibration, serialize as a small JSON lookup table | Immediately -- 60 full NLP analyses at startup would add 30+ seconds |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing raw input server-side "just for the gallery title" | Data breach exposes sensitive user text (passwords, personal notes, financial data users pasted to "see what art it makes") | Store only: parameter vector, style choice, user-provided title (optional, separate from input), version tuple. Never store or log raw input. |
| Share links containing parameter values in URL query strings | Parameter values in URLs get logged in server access logs, browser history, analytics tools, referrer headers | Use opaque share IDs (random UUIDs) that map to stored parameter sets. Share URL = `app.com/art/abc123`, not `app.com/art?params=...` |
| Gallery input preview reconstructed from parameters | Even without storing raw input, if parameter-to-input is invertible, privacy is compromised | Ensure the analysis pipeline is a one-way function (lossy). Parameters should not be invertible to reconstruct original input. Document this property. |
| Profanity filter only on English text | Non-English profanity, Unicode homoglyph attacks (e.g., Cyrillic 'a' replacing Latin 'a'), and zero-width characters bypass the filter | Use a Unicode-aware profanity filter. Normalize Unicode homoglyphs before filtering. Apply to user-provided gallery titles only (not to the input itself, which is never stored). |
| No CSRF protection on gallery save/report endpoints | Attackers trick authenticated users into saving/reporting content via cross-site requests | Use SameSite cookies and CSRF tokens on all state-mutating endpoints. Next.js server actions provide CSRF protection by default -- use them. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing a loading spinner during the entire analysis+render pipeline | Users don't know if the app is working or broken, abandon after 3 seconds | Staged progress animation: "Parsing..." -> "Analyzing..." -> "Normalizing..." -> "Rendering..." with a progress bar. Each stage updates independently. |
| Translation panel that uses technical jargon | Users see "entropy: 0.73, bigram frequency deviation: 0.41" and learn nothing | Plain-English explanations: "Your text has moderate randomness -- mixing common and unusual letter patterns" with the technical values available on hover/expand |
| Art that looks too similar across different inputs | Users try their name, their friend's name, and both look alike -- they leave | Ensure the rendering pipeline amplifies small parameter differences visually. Use a diverse default color palette. Test with common first names -- they should produce noticeably different art |
| No "undo" or "go back" after style selection | User picks a style, doesn't like it, has to re-enter input | Preserve the parameter vector across style changes. Style selection should re-render instantly without re-analysis. |
| Export produces different art than the on-screen preview | User carefully adjusted style, exported, and the PNG looks different | Show a brief "rendering for export..." message and display the server-rendered result in a confirmation dialog before download. Explain that the export is the "definitive" version. |
| Compare mode with no visual highlighting of differences | Users open compare mode but can't tell what's different between two artworks | Auto-highlight the parameter bars that differ most. Generate a plain-English summary: "These pieces differ most in rhythm and color warmth." |

## "Looks Done But Isn't" Checklist

- [ ] **Determinism:** Art "looks deterministic" in casual testing but hasn't been verified across browsers, OS versions, and device types -- run automated cross-platform snapshot tests (BrowserStack or similar)
- [ ] **Canonicalization:** Text input works for ASCII but hasn't been tested with Unicode combining characters, RTL text, emoji sequences, or zero-width characters
- [ ] **Calibration:** Normalization "works" on the 60 reference inputs but hasn't been tested against adversarial inputs (empty string, 100KB text, single emoji, binary-looking strings)
- [ ] **SSRF Protection:** URL input blocks `localhost` and `127.0.0.1` but hasn't been tested against decimal IPs, IPv6, DNS rebinding, redirect chains, or `file://` scheme
- [ ] **Rate Limiting:** Limits work per-IP but haven't been tested against X-Forwarded-For spoofing, distributed attacks, or cookie rotation
- [ ] **Privacy:** Raw input isn't in the database but may be in server access logs, error logs, analytics events, or browser localStorage
- [ ] **Accessibility:** Alt text generation works but hasn't been tested with screen readers, keyboard navigation hasn't been tested with the translation panel, reduced-motion preference hasn't been tested with all animation states
- [ ] **High-res Export:** 4096x4096 export works on the developer's machine but hasn't been tested under concurrent load (multiple users exporting simultaneously) or with complex particle-style art
- [ ] **Gallery Moderation:** Profanity filter works for English but hasn't been tested with Unicode homoglyph attacks, leetspeak, or non-Latin scripts
- [ ] **Version Locking:** Saved art renders correctly today but there is no automated test that previous versions still render identically after code changes

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Canvas non-determinism discovered after launch | MEDIUM | Server-side re-render all gallery thumbnails with pinned environment. Add disclaimer about cross-browser cosmetic differences. Treat server render as canonical. |
| PRNG drift discovered after gallery has saved art | HIGH | Requires keeping the broken PRNG path as "v1" and fixing forward in "v2". All existing saved art must be tagged with v1 to preserve rendering. Cannot silently fix. |
| Calibration bias producing boring art | LOW | Re-run calibration with expanded reference corpus. Bump normalizerVersion. Existing saved art continues to use old calibration via version locking. |
| NLP accuracy issues on short text | LOW | Adjust parameter weights to reduce NLP contribution for short inputs. No version bump needed if weight adjustment is treated as a normalization change (bump normalizerVersion). |
| SSRF vulnerability exploited | HIGH | Immediate: block all URL input temporarily. Fix: implement proper IP validation and DNS pinning. Audit logs for exploitation scope. Incident response per deployment platform. |
| Raw input found in logs | MEDIUM | Purge affected log storage immediately. Audit all logging paths. Add log sanitization middleware that strips request bodies from log output. Notify affected users if personal data was exposed. |
| Version not bumped after rendering change | HIGH | Identify all gallery entries and share links created between the unversioned change and discovery. These are "orphaned" -- their art changed silently. Must choose: re-tag them with a new version (art changes acknowledged), or revert the rendering change and re-deploy. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cross-browser canvas non-determinism | Phase 1: Foundation | Server-side rendering produces identical output across deployments; client rendering tested in 3+ browsers with tolerance-based visual diff |
| PRNG seeding errors | Phase 1: Foundation | Snapshot tests for 10+ seed/parameter combinations; ESLint rule blocking `Math.random()` in rendering paths |
| Normalization calibration bias | Phase 2: Analysis Pipeline | Parameter distribution histograms show spread across full 0-1 range for diverse calibration inputs; no dimension has >50% clustering in 0.2 band |
| NLP accuracy on edge inputs | Phase 2: Analysis Pipeline | Adversarial test suite of 30+ unusual inputs produces diverse parameter vectors; short-text weighting attenuates NLP signals |
| Engine versioning breaks | Phase 1: Foundation (schema) + each rendering phase | CI test generates art for pinned seeds and fails if output changes without version bump |
| Input canonicalization gaps | Phase 1: Foundation | Test suite of 50+ edge cases per input type; Unicode NFC, JSON key ordering, URL normalization all verified |
| SSRF in URL input | Phase 2: Analysis Pipeline | Integration tests attempt to fetch private IPs, metadata endpoints, redirect chains; all blocked |
| Parameter injection in share links | Phase 3: Gallery/Sharing | Share IDs are opaque UUIDs; parameter values never appear in URLs; server validates parameter bounds on render |
| Privacy leaks in logs | Phase 1: Foundation | Log sanitization middleware active from first deployment; audit confirms no raw input in any log stream |
| High-res export memory issues | Phase 3: Gallery/Sharing (Export) | Load test: 10 concurrent 4096x4096 exports complete without OOM; server-side memory monitoring alerts configured |
| Gallery abuse/spam | Phase 3: Gallery/Sharing | Rate limiting tested against header spoofing; CAPTCHA on gallery save after threshold; pagination tested at 10K entries |
| Font rendering inconsistency (Typographic style) | Phase with Typographic renderer | Bundled WOFF2 fonts registered in both client and server canvas; visual diff test for text rendering |

## Sources

- [Canvas Fingerprinting - BrowserLeaks](https://browserleaks.com/canvas) -- HIGH confidence, demonstrates cross-browser pixel variance
- [Floating-Point Determinism - Random ASCII](https://randomascii.wordpress.com/2013/07/16/floating-point-determinism/) -- HIGH confidence, authoritative reference on FP determinism challenges
- [Floating Point Determinism - Gaffer on Games](https://gafferongames.com/post/floating_point_determinism/) -- HIGH confidence, widely cited in game development
- [Canvas Fingerprinting - Fingerprint.com](https://fingerprint.com/blog/canvas-fingerprinting/) -- MEDIUM confidence, explains rendering variance mechanisms
- [PRNG shootout - Vigna/Blackman](https://prng.di.unimi.it/) -- HIGH confidence, official xoshiro reference from the algorithm's creators
- [Implausible Output from xoshiro256** - PCG](https://www.pcg-random.org/posts/implausible-output-from-xoshiro256.html) -- MEDIUM confidence, critical analysis of xoshiro state-space issues
- [Mulberry32 PRNG - GitHub Gist](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c) -- MEDIUM confidence, community-maintained reference implementation
- [JavaScript PRNGs - bryc/code](https://github.com/bryc/code/blob/master/jshash/PRNGs.md) -- MEDIUM confidence, comprehensive JS PRNG comparison
- [Quantile Normalization pitfalls - Nature Scientific Reports](https://www.nature.com/articles/s41598-020-72664-6) -- HIGH confidence, peer-reviewed paper on QN issues
- [Feature-specific QN - BMC Bioinformatics](https://bmcbioinformatics.biomedcentral.com/articles/10.1186/s12859-024-05759-w) -- HIGH confidence, peer-reviewed, details class-effect bias
- [Four Sentiment Analysis Accuracy Traps - Toptal](https://www.toptal.com/developers/deep-learning/4-sentiment-analysis-accuracy-traps) -- MEDIUM confidence, practical analysis of NLP pitfalls
- [Sentiment Analysis Challenges - AIM Research](https://research.aimultiple.com/sentiment-analysis-challenges/) -- MEDIUM confidence, survey of common NLP issues
- [SSRF Prevention in Node.js - OWASP](https://owasp.org/www-community/pages/controls/SSRF_Prevention_in_Nodejs) -- HIGH confidence, authoritative security reference
- [Bypassing SSRF Protection in nossrf - Node.js Security](https://www.nodejs-security.com/blog/bypassing-ssrf-protection-nossrf) -- HIGH confidence, demonstrates real bypass techniques
- [SSRF Prevention Cheat Sheet - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) -- HIGH confidence, authoritative security reference
- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785) -- HIGH confidence, IETF standard
- [UAX #15: Unicode Normalization Forms](https://unicode.org/reports/tr15/) -- HIGH confidence, Unicode Consortium standard
- [OKLCH in CSS - Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) -- MEDIUM confidence, well-researched technical blog
- [Canvas text rendering cross-browser - Ben Nadel](https://www.bennadel.com/blog/4320-rendering-text-to-canvas-with-adjusted-x-y-offsets-for-better-cross-browser-consistency.htm) -- MEDIUM confidence, practical experience with workarounds
- [Canvas Area Exceeds Maximum Limit - PQINA](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit) -- MEDIUM confidence, documents browser canvas size limits
- [skia-canvas - GitHub](https://github.com/samizdatco/skia-canvas) -- HIGH confidence, primary source for the library
- [Rate Limit Bypass Techniques - HackTricks](https://book.hacktricks.xyz/pentesting-web/rate-limit-bypass) -- MEDIUM confidence, comprehensive bypass reference

---
*Pitfalls research for: Deterministic generative art web application (Synesthesia Machine)*
*Researched: 2026-03-02*
