# BANHALMI ART — final full audit and design harmonisation

Date: 2026-07-17

## Scope

- Static archive build without blog/post content
- 103 HTML files
- SEO, GEO, Schema.org, LLM files, links, language parity, accessibility and responsive presentation
- Visual alignment with `880rzz/BANHALMI` / norbertbanhalmi.com

## Design system applied

- Shared Apple-like editorial system
- System/SF font stack
- White and soft-white surfaces
- Graphite `#202530` / `#1C1C1E`
- BANHALMI gold `#B79C44`; accessible text gold `#8A681F`
- 1080 px content width
- 64 px sticky header without blur
- Pill controls and restrained 14 px card rounding
- Matching spacing, heading scale, cards, footer and language selector
- Archive identity retained through record rails, chronology and archival information architecture

## Domain roles

- `banhalmi.art`: canonical artistic oeuvre and source archive
- `norbertbanhalmi.com`: canonical current professional services, pricing, quote and contact site
- Shared Person entity: `https://www.banhalmi.art/norbert-banhalmi`
- Professional Organization entity: `https://www.norbertbanhalmi.com/#organization`

## Content architecture

Blog and `/post/` content remains excluded. The archive retains exhibitions, books, media, chronology, curator resources and the canonical profile. Professional service links point to the four-service architecture on norbertbanhalmi.com.

## Implemented changes

- Added `/assets/banhalmi-design.css` to all HTML documents.
- Added or normalized `theme-color` metadata.
- Updated web manifest colors.
- Disabled visual blur in the shared header.
- Normalized typography, layout width, navigation, cards, galleries, CTA bridge and footer.
- Added safe external-link relationship attributes.
- Preserved canonical, hreflang and structured-data payloads.

## Validation

A machine validation pass checks canonical URLs, hreflang sets, JSON-LD parsing, duplicate IDs, local links/assets, sitemap membership and removal of blog/post routes. See `audit-results.json`.
