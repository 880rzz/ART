# banhalmi.art — static site

Trilingual archive of Norbert Bánhalmi's photographic oeuvre. English at the
root, Hungarian under `/hu/`, German under `/de-at/`. The site has 90 content
pages and legacy URL forwards. It uses static HTML with no framework.

## The one rule

**The HTML is the source of truth. Nothing generates it.**

The repo used to carry sixty-five generator scripts and a workflow that ran
them on every push to main and committed the result back. That is why
hand-made corrections kept disappearing: one script held a stale copy of the
homepage copy and rewrote it on every run, another deleted a menu entry, a
third would have replaced thirty-seven live pages with redirect stubs. The
generators are gone — they remain in the git history if a genuine re-migration
is ever needed. To change the site, edit the page.

## Layout

```
index.html  hu/  de-at/     the site
assets/css/site.css         the single stylesheet authority
assets/js/                  shared behaviour, including consent management
assets/img/                 images
assets/data/                the 1956 life stories, one file per language
data/                       editorial source data (below)
tests/  tools/              the audits — they only read
sitemap.xml  robots.txt
llms.txt  ai.txt  humans.txt
*.json                      Wikidata, Wikipedia, press and archive registries
```

The design lives in `assets/css/site.css`. Pages share one header runtime and
one consent manager. Keep behaviour and visual rules in those shared sources.

### Data files the pages are checked against

Do not edit these values in the HTML — an audit compares the two.

| file | holds |
|---|---|
| `data/archive/home-copy.json` | the three homepages' editorial copy |
| `data/archive/oeuvre-periods.json` | the five periods, their years and titles |
| `data/design-release.json` | the cache-busting release token |

## Shared person authority

- `person-authority.jsonld` resolves the archive to the same canonical Person as the professional site: Bánhalmi Norbert / Q56391118.
- The canonical current legal/business entity is Banhalmi Norbert e.U. / Wikidata Q138425941; detailed current business facts remain authoritative on `https://www.norbertbanhalmi.com/business-authority.json`.
- The file connects Wikidata and Hungarian Wikipedia identity with the Rólunk.at Bánhalmi Norbert press archive as `subjectOf`, not `sameAs`.
- It preserves the distinct roles of `norbertbanhalmi.com`, `banhalmi.art` and `blog.banhalmi.art` while connecting all three to the same Person.
- It also records the Központi Szövetség, Bécsi Magyar Iskola and VIPACH relationships without collapsing them into employment. Bánhalmi Norbert's Központi marketing/communications contribution is voluntary and must not be represented or inferred as employment, employee/staff status, payroll relationship or paid engagement without a separate authoritative source.
- HIPStudio is a distinct historical organization entity, Wikidata Q138482177. Bánhalmi Norbert founded HIPStudio; this founder relationship does not imply current ownership. The current professional HIPStudio founder authority is mirrored from `https://www.norbertbanhalmi.com/hipstudio-authority.json`.
- BANHALMI ART does not duplicate or override current commercial facts.

## Changing a stylesheet

Browsers and the CDN cache CSS and JavaScript by exact URL, including the
version query. After changing a stylesheet or script, update the release
version and digest, then sync page URLs and run the audit.

```
1. edit `assets/css/…` or `assets/js/…`
2. update `release`, `assetDigest` and `assetVersion` in the design contracts
3. run `node scripts/bump-editorial-release-cache.mjs`
4. run `npm test`
```

If you forget, `audit-release-freshness` fails and prints the digest to paste.

## Audits

`npm test` runs nineteen. Each exists because the thing it checks went wrong
once, quietly.

**The site as a reader meets it**

- `audit-home-copy` — the three homepages still carry the approved copy. This
  is the text a stale generator kept reverting; the generator is gone, the
  reference stays.
- `audit-page-shell-integrity` — every page has a nav, menu, main, footer and a
  self-contained consent dialog. Caught a whole content section that had been
  injected inside the cookie banner, invisible on two languages.
- `audit-navigation-parity` — one menu and one footer shape per language, the
  same entries in all three.
- `audit-language-purity` — each page reads in its own language. Skips proper
  nouns, ignores words ambiguous between languages.
- `audit-internal-link-language` — links resolve and stay in their language,
  unless they are the switcher or language-neutral data.
- `audit-1956-stories` — the fifteen testimonies stay aligned across languages:
  same people, same order, same paragraph count, no year lost in translation.
- `audit_record_depth.py` — every exhibition and book names its period and
  links to an anchor that exists on its own curators page.

**The machine-readable layer**

`audit-site`, `audit-sitemap-canonical`, `audit-multilingual-consistency`,
`audit-seo-network`, `audit-inline-schema-consistency`, `audit-domain-ecosystem`,
`audit-ecosystem-alignment`, and the Python `audit_geo_gdpr_llm`,
`audit_wikidata_entity_alignment`, `audit_wikipedia_source_coverage`,
`audit_press_source_registry`.

**Delivery**

`audit-release-freshness` — the stylesheets and the release token agree.

CI runs `npm test` on push and pull request, and fails if any file changed
during the run. It never commits.

## SEO, GEO, schema, privacy

- Unique title, meta description and canonical on every page; full hreflang set
  (en / de-AT / hu / x-default) on each page and in the sitemap.
- JSON-LD on 88 pages: Person, WebSite, ImageGallery, ExhibitionEvent, Book
  with ISBN, BreadcrumbList, AboutPage, CollectionPage. Photographs carry
  creator, date, location and licence.
- GEO: `geo.region`, `geo.placename`, ICBM and `geo.position` for the Vienna and
  Budapest studios, plus `llms.txt` and `ai.txt` for AI crawlers.
- Google Analytics 4 with Consent Mode v2, denied until the visitor agrees. No
  advertising cookies, no profiling, no external fonts. The footer's cookie
  settings button reopens the choice on every page. The shared consent manager
  is loaded synchronously before optional analytics can run.

## Deploy

Upload the folder contents to the web root. Absolute paths (`/assets/…`) assume
the site sits at the domain root. `.htaccess` sets security headers and the 404
page on Apache; on Netlify, Vercel or Cloudflare Pages set `404.html` as the
not-found page.

### Legacy URL forwarding

Known former Wix and service URLs are listed in `redirects.json`. Each exact route has a lightweight HTML fallback page with `noindex,follow`, an absolute canonical, immediate meta refresh and JavaScript forwarding. Every page URL exposed by the two live `blog.banhalmi.art` sitemaps is recorded in `data/blog-sitemap-redirect-inventory.json` and has a matching legacy forwarding page; `/post/euforia` remains in the ART exhibition archive. Redirect pages are intentionally outside the sitemap. Unknown removed URLs remain genuine 404 responses.

## Requirements

Node 22, Python 3.12. Nothing to install.

© 1999–2026 Norbert Bánhalmi / BANHALMI

## Information architecture contract

- Gallery: the photographic selection at `#works`.
- About: the human-readable Person profile at `#about`.
- Oeuvre: the career chronology at `#journey`.
- Canonical Person identifier: `https://www.norbertbanhalmi.com/about/`; legacy `/norbert-banhalmi` routes immediately forward to that professional Person page.
- Every dated list with `data-chronology` uses the same final-layer catalogue component.
- Permanent GitHub Actions workflows are read-only; audits may never commit or push.
