# BANHALMI ART v2 — Deploy útmutató

## Build
```bash
cd site
npm install
npm run build      # astro build && pagefind --site dist
```
A kimenet a `site/dist/` mappában lesz (kb. 107 MB, 418 statikus oldal).

## Ajánlott hosting: Cloudflare Pages
1. Repo pusholása GitHub-ra (vagy közvetlen mappa-feltöltés a Cloudflare Pages felületén).
2. Build parancs: `npm run build`; kimeneti könyvtár: `dist`.
3. Domain: `www.banhalmi.art` (CNAME rekord a Cloudflare Pages projekt felé).
4. `_redirects` fájl a `public/`-ba tehető a redirects.csv alapján, ha szükséges.

## Alternatíva: GitHub Pages (a társoldal mintájára)
1. `dist/` tartalma egy `gh-pages` branch-re vagy a `docs/` mappába kerül.
2. `CNAME` fájl a dist gyökerébe: `www.banhalmi.art`.
3. DNS: A-rekordok a GitHub Pages IP-kre, vagy CNAME ha subdomain.

## Fontos build utáni ellenőrzés
- `sitemap.xml` — hreflang-hármasok minden rekordhoz ✓ (ellenőrizve)
- `robots.txt` — Sitemap-hivatkozással ✓
- `entity.jsonld`, `llms.txt`, `ai.txt` — GEO/AI-discovery fájlok ✓
- Pagefind keresés a `/kereses` oldalon ✓ (348 oldal indexelve, 3 nyelven)

## Ismert korlátok
- 26 posztnál a Wix lazy-loaded galéria képei nem szerepeltek a statikus crawl média-listájában
  (csak az oldalankénti ügyfél-logó sáv volt elérhető) → ezeknél nincs hero-kép, csak szöveg.
  Póteléshez az eredeti Wix-oldal kézi újra-crawlolása szükséges dinamikus JS-rendereléssel.
- 3 könyvrekord (`statusz: publikalt`) tartalma a /konyveim crawl-oldal szövegéből lett gazdagítva;
  a teljes borító-kép és részletes leírás még kiegészíthető, ha a user rendelkezésre bocsátja.
