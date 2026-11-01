# Private photography — human + conversion rewrite (2026-11-01)

## Before
- H1 led with service categories (artistic portraits / fashion / intimate).
- First major block asked visitors to “choose the work you need”.
- Spectrum was correct, but non-specialists met jargon first.
- Human voice from Oct 2026 (“Egy kép, amely az Öné”) was diluted.

## After (IA)
1. Hero — human problem + spectrum sentence + “tell me your idea”
2. Situations you may arrive with (pain → short solution)
3. How I can help (services as translation of situations)
4. You do not need to know how to pose
5. If you have an idea / if you do not
6. How we work (conversation → written proposal → session → selection)
7. Boundaries and discretion
8. Related artistic references (context, not fake testimonials)
9. Scope and fee → tailored quote (no invented ART prices)
10. Closing CTA + collectors + further reading

## Routing preserved
- Artistic nude → Ébredés (`data-artistic-nude-entry`)
- Personal ART commissions → mailto tailored quote (`data-private-enquiry`)
- Career artist/performer portfolios → Professional site + existing quote URLs
- Executive/corporate → Professional (stated, not sold here)

## Source of truth
- `data/private-photography-copy.json` (expanded keys)
- Three HTML pages kept as authored surfaces; headings audited via `tools/audit-heading-plain-language.mjs`
