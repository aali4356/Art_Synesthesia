# Decisions Register

| # | When | Scope | Decision | Choice | Rationale | Revisable? |
|---|------|-------|----------|--------|-----------|------------|
| D001 | M001/S01 | library | Font loading | next/font/google for Geist | Matches project scaffold and avoids extra font-loading complexity | No |
| D002 | M001/S01 | library | PRNG algorithm | Alea via seedrandom | Fast, deterministic, and already integrated across render paths | No |
| D003 | M001/S01 | convention | Randomness policy | Ban Math.random() in render/pipeline code | Determinism is a product promise, not an implementation detail | No |
| D004 | M001/S01 | convention | Theme default | Dark mode default with persisted user choice | Dark backgrounds better frame generated artwork | Yes — if future brand direction changes |
| D005 | M001/S02 | pattern | Normalization strategy | Quantile-based scaling against calibration corpus | Produces more expressive stable distributions than min/max normalization | No |
| D006 | M001/S02 | library | Palette color space | OKLCH via culori | Best fit for perceptual palette control and contrast-safe tuning | No |
| D007 | M001/S03 | pattern | Pipeline orchestration | Module-level cached calibration in client hooks | Avoids recalculating calibration data per render/generation | Yes — if server orchestration changes |
| D008 | M001/S04 | pattern | Renderer architecture | Pure scene-graph builders plus style-specific canvas components | Keeps composition deterministic and testable while isolating Canvas side effects | No |
| D009 | M001/S07 | arch | Cache/database access boundary | Route handlers call boundary modules (`db-cache`, `db-gallery`) instead of inline DB code | Improves isolation, testing, and future refactor safety | No |
| D010 | M001/S09 | pattern | Accessibility/export metadata source | Scene graphs carry source ParameterVector | Enables deterministic alt text and export diagnostics without recomputing pipeline state | No |
| D011 | M002 | scope | Post-M001 sequencing | Use a design-first multi-milestone sequence (M002 art engine, M003 full-site redesign, M004 product coherence, M005 launch hardening) | Matches user intent to expand ambition rather than shrink to an MVP cleanup | Yes — if scope changes materially |
| D012 | M002 | design | Core aesthetic direction | Editorial gallery luxe | User wants super artsy, sleek, premium presentation rather than neutral SaaS polish | Yes — if user changes art direction |
| D013 | M002 | design | Palette strategy | Wide curated deterministic palette families | Directly addresses the user complaint that current outputs feel stuck in repetitive purple/orange/green bands | No |
| D014 | M002 | scope | Milestone focus | M002 prioritizes palette + renderer expressiveness before full-site redesign | Better artwork quality should precede broader visual shell redesign so later polish showcases stronger output | No |
| D015 | M002 | product | Product identity | Treat Synesthesia Machine as a distinct branded art product, not just a nicer portfolio demo | User wants a full product and public launch readiness, not only cosmetic cleanup | Yes — if launch strategy changes |
| D016 | M005 | operability | Launch target | Optimize for public portfolio launch | Balances ambition with realistic launch scope; does not require full SaaS commercialization yet | Yes — if user later pursues commercial productization |
