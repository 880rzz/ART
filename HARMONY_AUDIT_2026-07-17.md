# BANHALMI ART — cross-domain harmony audit

Date: 2026-07-17

## Scope

Compared the reduced static `banhalmi.art` build with:

- the current `880rzz/BANHALMI` repository architecture,
- the live `www.norbertbanhalmi.com` public site,
- the live `www.banhalmi.art` public site,
- the shared Person and Organization entity model.

Audit areas: SEO, GEO/entity consistency, Schema.org, LLM-facing files, language routing, content roles, cross-domain links and static-site integrity.

## Final role split

- `www.banhalmi.art`: official artistic oeuvre and source archive.
- `www.norbertbanhalmi.com`: current professional site for services, pricing, enquiries and commercial conversion.
- Shared canonical Person ID: `https://www.banhalmi.art/norbert-banhalmi`.
- Current four principal service areas:
  1. Portrait Photography
  2. Brand Photography
  3. C-Level Event Photography
  4. Fine Art Photography

## Corrections applied

### SEO

- Expanded sitemap from 34 Hungarian `<url>` records to 102 explicit language URLs.
- Added reciprocal `hu`, `en`, `de-AT` and `x-default` hreflang entries to every sitemap record.
- Normalized canonical and hreflang URLs to directory-style trailing-slash URLs.
- Preserved exactly one canonical, one H1 and one meta description per indexable page.
- Rewrote homepage descriptions so they no longer claim that removed blog posts remain in the static build.

### Cross-domain links

Corrected obsolete sister-site language paths:

- English no longer uses `/en/...` routes.
- German no longer uses `/de/...` routes; it now uses `/de-at/...`.
- English legal links now use the actual English slugs.
- German legal links now use the actual German slugs.
- Generic sister-site links now resolve to `/`, `/hu/` or `/de-at/` according to page language.

### Content architecture

- Removed the empty “writings / írások / Texte” homepage section left behind after blog removal.
- Added a four-card bridge to the current professional service architecture in HU, EN and DE.
- Clarified that the archive contains books, exhibitions, media appearances, curatorial records, chronology and selected works.
- Clarified that current commissions, pricing and enquiries belong to `norbertbanhalmi.com`.

### Schema / entity graph

- Preserved the shared canonical Person node.
- Harmonized professional titles and `knowsAbout` terms with the four-service architecture.
- Strengthened the Organization description around the four principal service areas.
- Added explicit relationship references between the archive website and professional website.
- Preserved the archive as the canonical biographical and oeuvre source rather than duplicating commercial Service nodes locally.

### LLM / GEO files

- Updated `ai.txt` and `llms.txt` to state the exact role of each domain.
- Added the canonical four-service list.
- Declared that blog posts are intentionally excluded from this reduced static build.
- Preserved entity, sitemap and archive-index references.

## Validation results

- Files in final build: 531 including this report.
- HTML files: 103.
- Indexable language pages: 102.
- Sitemap URLs: 102.
- Sitemap duplicate URLs: 0.
- Sitemap records with incomplete hreflang set: 0.
- Invalid embedded JSON-LD blocks: 0.
- Missing canonical links: 0.
- Incorrect H1 counts: 0.
- Broken local links: 0.
- Remaining `/blog` or `/post/` references: 0.
- Remaining obsolete `norbertbanhalmi.com/en/` or `/de/` links: 0.
- Four service bridge links: 12 total, 4 per language.

## Important deployment observation

The live professional homepage still publicly renders older six-service wording in some visible sections, while the repository’s machine-readable `services.json` defines four principal service areas. The archive build now follows the repository’s newer four-service architecture. The professional site deployment should be checked so the visible homepage and the repository remain synchronized.

## Final assessment

The reduced static archive is now structurally aligned with the intended cross-domain architecture. It complements rather than competes with the professional site: the archive establishes authorship, biography, exhibitions, books and source authority; the professional domain owns services, pricing and enquiry conversion.
