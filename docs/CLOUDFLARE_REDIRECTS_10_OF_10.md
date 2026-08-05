# BANHALMI ART — valódi 301-es átirányítások

A `banhalmi.art` GitHub Pages tárhelyen fut. A repó `_redirects` fájlja dokumentációs és más statikus tárhelyekkel kompatibilis forrás, de GitHub Pages önmagában nem hajtja végre útvonalszintű 301-es szabályként. A valódi HTTP 301 választ a Cloudflare adja ki még a GitHub Pages elérése előtt.

## Beállítás Cloudflare-ben

1. A `banhalmi.art` zónában ellenőrizze, hogy az apex és a `www` DNS-rekord **Proxied** állapotú, vagyis narancssárga felhővel jelenik meg.
2. Nyissa meg: **Rules → Redirects → Bulk Redirects**.
3. Hozzon létre egy listát `banhalmi-art-legacy-redirects` néven.
4. Importálja a repó gyökerében található `cloudflare-bulk-redirects.csv` fájlt. A fájl nem tartalmaz fejlécsort, közvetlenül megfelel a Cloudflare importformátumának.
5. Hozzon létre és engedélyezzen egy Bulk Redirect Rule-t, amely ezt a listát használja.
6. A szabály legyen aktív a teljes `banhalmi.art` zónára. Az importált sorok maguk korlátozzák a találatokat az apex és `www` hostokra.

## Kötelező ellenőrzés

Az alábbi URL-eknek `301` státuszt és pontos `Location` fejlécet kell adniuk:

- `/norbert-banhalmi` → `https://www.norbertbanhalmi.com/about/`
- `/hu/norbert-banhalmi` → `https://www.norbertbanhalmi.com/about/`
- `/de-at/norbert-banhalmi` → `https://www.norbertbanhalmi.com/about/`
- `/kapcsolat` → `https://www.norbertbanhalmi.com/hu/kapcsolat/`
- `/fotozas-arak` és `/arak` → `https://www.norbertbanhalmi.com/hu/ajanlatkeres/`
- `/gyakori-kerdesek` → `https://www.norbertbanhalmi.com/hu/gyik/`
- `/post/euforia` → `https://www.banhalmi.art/hu/exhibitions/euforia.html`
- egy másik régi `/post/...` URL → ugyanazzal a sluggal a `blog.banhalmi.art` oldalra

A kérdőjelek utáni kampányparamétereket a szabályok megőrzik.

## Google Search Console

- Mind a `banhalmi.art`, mind a `norbertbanhalmi.com` domain property legyen igazolva.
- Küldje be újra mindkét sitemapet.
- Az URL Inspection eszközben kérjen ellenőrzést a három régi Person URL-re, a `/fotozas-arak`, `/kapcsolat` és `/post/euforia` útvonalra, majd a céloldalakra is.
- Ne irányítson minden ismeretlen URL-t a főoldalra. A tartalmi megfelelő nélküli címek maradjanak valódi 404-esek, különben a Google soft 404-ként kezelheti őket.
- A 301-es szabályokat legalább egy évig, lehetőleg véglegesen tartsa meg.

## Forrásigazság

- `redirects.json` — kanonikus emberileg és gépileg olvasható útvonaltérkép
- `_redirects` — statikus tárhely-kompatibilis tükör
- `cloudflare-bulk-redirects.csv` — a tényleges Cloudflare-import
- `tests/audit-edge-redirects.mjs` — eltérés elleni állandó regressziós teszt
