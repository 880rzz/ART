# Strict Apple Web Design Contract

This repository treats the following as a release-blocking visual contract for every published page, every supported language, and every audited viewport.

## Typography
- System/SF-style sans-serif hierarchy.
- H1: 34–50 px on small mobile, 34–58 px through tablet, 38–76 px on desktop.
- H2: 24–42 px on mobile, up to 48 px on larger viewports.
- H3: 18–34 px.
- Long-form body copy: 16–21.5 px.
- H1 line-height: 0.98–1.18. H2/H3 line-height: 1.02–1.30.
- Long-form body line-height: 1.40–1.72.
- Body weight: 300–600. Heading weight: 500–750.
- Body tracking must remain effectively neutral; heading tracking must remain restrained.

## Alignment and reading measure
- Long-form prose is left/start aligned. No justified body copy.
- Centered text is reserved for short hero, CTA, statement, error, footer, or equivalent editorial display copy.
- Long prose must never be centered merely for decoration.
- Long prose width is capped at 860 px; normal reading measure should remain narrower where possible.
- Text columns must not collapse below a usable reading width.
- Curators remains a readable editorial flow and must never regress into the former narrow two-column dossier geometry.
- Writing remains left-aligned editorial prose.

## Layout and full-width surfaces
- Colored top-level section surfaces span the full viewport width.
- Content inside those surfaces uses centered constrained wrappers.
- Desktop content wrappers are capped at 1280 px.
- Standard wrappers remain geometrically centered.
- Mobile/tablet content keeps visible side gutters unless the element explicitly declares full-bleed or gallery semantics.
- No horizontal document overflow.
- No `content-visibility:auto` on top-level sections where it can create blank visual bands.

## Spacing rhythm
- Related heading/copy blocks remain visually attached without collision or arbitrary voids.
- Colored editorial sections require meaningful vertical breathing room.
- Spacing follows a small, repeated rhythm rather than arbitrary one-off values.

## Cards, cells, rows, and columns
- Cards are used only for real content units, not as decoration around every paragraph.
- Card/cell corner radius is capped at 28 px.
- Bordered/colored cards keep sufficient inner padding.
- Text-bearing grid columns must remain wide enough to read.
- Dense desktop grids must collapse or reflow before text becomes cramped.

## Controls
- Mobile/tablet interactive controls use at least a 44 px touch height; button-like controls also require a 44 px touch width.
- Primary and secondary CTAs remain visually distinct and concise.

## Release rule
A visual failure on any published page, language, or audited viewport blocks release. The automated browser contract is implemented in `tools/audit-apple-visual-quality.mjs` and must run together with the repository's exhaustive browser, first-principles, accessibility, contrast, Lighthouse, SEO, schema, GEO, GDPR, AI/LLM, trust, and exact-live gates.
