# M001: Migration

**Vision:** A full-stack web application that converts any input (text, URLs, CSV/JSON data) into unique, deterministic algorithmic artwork.

## Success Criteria


## Slices

- [x] **S01: Foundation Determinism Infrastructure** `risk:medium` `depends:[]`
  > After this: Scaffold the Next.
- [x] **S02: Parameter System Color** `risk:medium` `depends:[S01]`
  > After this: Build the quantile-based normalization engine, weighted-blend parameter mapping tables, and provenance generation system.
- [x] **S03: Text Analysis Input Ui** `risk:medium` `depends:[S02]`
  > After this: Build the real text analyzer that replaces `extractMockSignals` with genuine NLP features: AFINN-165 sentiment, syllable counting via the `syllable` package, and all statistical text features.
- [x] **S04: Geometric Renderer Canvas Ui** `risk:medium` `depends:[S03]`
  > After this: Build the pure-function geometric composition engine that transforms a ParameterVector + PaletteResult into a deterministic SceneGraph of drawing instructions, with all composition laws enforced.
- [x] **S05: Additional Renderers** `risk:medium` `depends:[S04]`
  > After this: unit tests prove additional-renderers works
- [x] **S06: Url Data Input** `risk:medium` `depends:[S05]`
  > After this: unit tests prove url-data-input works
- [x] **S07: Database Sharing Privacy** `risk:medium` `depends:[S06]`
  > After this: unit tests prove database-sharing-privacy works
- [x] **S08: Gallery Compare** `risk:medium` `depends:[S07]`
  > After this: unit tests prove gallery-compare works
- [ ] **S09: Export & Accessibility** `risk:medium` `depends:[S08]`
  > After this: unit tests prove Export & Accessibility works
