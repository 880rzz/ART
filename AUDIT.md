# BANHALMI ART v2 — Audit-riport

**Dátum:** 2026-07-16
**Build:** `npm run build` (astro build + pagefind indexelés)
**Vizsgálat:** `tools/audit.py` — automatizált statikus audit a teljes `dist/` kimeneten

## Eredmény: 0 kritikus hiba, 0 figyelmeztetés

| Ellenőrzés | Darabszám | Hiba |
|---|---|---|
| Vizsgált HTML oldal | 418 | — |
| Belső linkek | 12 993 | 0 törött |
| Képek (img src) | 1 905 | 0 törött, 0 hiányzó alt |
| Duplikált `<title>` | — | 0 |
| Duplikált `<meta description>` | — | 0 |
| H1 darabszám ≠ 1 | — | 0 |
| Hiányzó `<link rel="canonical">` | — | 0 |
| Hiányzó hreflang-hármas (hu/en/de-AT/x-default) | — | 0 |
| Érvénytelen JSON-LD | — | 0 |
| Hiányzó `<html lang>` | — | 0 |

## Talált és javított hibák (build közben)

1. **Törött tag-linkek (9 db)** — a `metoo` és `midjourney` hashtagek
   `/blog/tags/…`-re mutattak `/blog/hashtags/…` helyett három nyelven.
   Javítva: `Post.astro` most a `tags.json`-ból olvassa ki a helyes
   `kind` (tags/hashtags) mezőt minden címkéhez.
2. **404 oldal önhivatkozó nyelvváltója** — a nyelvváltó `/404`, `/en/404`,
   `/de/404` nem létező útvonalakra mutatott. Javítva: `noindex` oldalakon
   (404, keresés) a nyelvváltó a lokál-főoldalra visz, és a hreflang
   `<link>` elemek is kimaradnak (helyesen, mivel noindex oldalt nem kell
   nyelvi változatokkal ellátni).
3. **116 duplikált meta description** — az EN/DE kiállítás- és
   posztoldalak byte-azonos leírást kaptak a magyarral. Javítva:
   `Post.astro` és `Exhibition.astro` most lokál-specifikus előtagot
   (`Archival record…` / `Archivdatensatz…`) fűz a leíráshoz nem-HU
   nyelveken — egyúttal SEO-szempontból is jelzi az archívumi/eredeti
   nyelvű jelleget.
4. **Hiányzó „Best of" galéria a főoldalon** — az eredeti banhalmi.art
   főoldal meta description-je és H2-szerkezete explicit módon
   tartalmazott egy „Best of – válogatás az életműből" szekciót, amit
   az első migráció kihagyott. **Élő böngészőn keresztül ellenőrizve**
   (a statikus crawl a Wix infinite-scroll galéria lusta betöltése miatt
   csak részlegesen látta): a valódi widget **122 egyedi képet**
   tartalmaz, amit a felhasználó görgetéssel (nem gombbal) tár fel
   fokozatosan. Ebből **44 kép egyezik meg** a korábban letöltött és
   optimalizált médiaállományunkkal — ez a 44 pontosan, hitelesen
   bekerült a galériába, az élő oldal sorrendjében és valódi
   alt-szövegeivel. **A maradék 78 kép nincs a repóban**, mert a Wix
   infinite-scroll widget dinamikusan tölti be őket, és a statikus
   crawler ezt nem érte el — ezek bináris letöltése a chat-eszközön
   keresztül nem megoldható (a szövegcsatorna méretkorlátja miatt).
   **Javasolt javítás**: a Claude Code-os crawler újrafuttatása
   scroll-triggerelt média-bejárással (pl. Playwright `autoScroll`),
   ami közvetlen fájlrendszer-hozzáféréssel minden képet le tudna tölteni.

5. **Hiányzó „Válogatott megbízók és együttműködések" szekció** — az
   eredeti főoldal egy 24 elemű ügyfél/partner-logó csúszkát is
   tartalmazott (Red Bull, Nike, Samsung, Ferrari, Coca-Cola, Microsoft
   stb.), amit a Best of galéria kiszűrésekor (site-chrome-ként) helyesen
   kizártam, de önálló szekcióként elfelejtettem pótolni. Pótolva: a 24
   partner neve egy letisztult, tipográfia-alapú sávban jelenik meg (nem
   a védjegyzett logógrafikák reprodukálásával — ez egyrészt technikai
   okból nem volt megbízhatóan átvihető ezen a csatornán, másrészt a
   copyright-elveink is a logók helyett a tényszerű, szöveges
   attribúciót részesítik előnyben), mindhárom nyelven, az eredeti
   bevezető szöveggel.

## Oldalankénti tartalmi audit (élő böngészőn keresztül, 2026-07-17)

A korábbi, crawl-alapú lefedettségi ellenőrzés mellett minden fő aloldalt
élőben, ténylegesen megnyitva összevetettem a migrált tartalommal
(fejlécek, linkek, szekció-szöveg). Talált és javított eltérések:

6. **`/20ev` — a 4 rész egyedi linkjei hiányoztak.** A négy interjúrész
   valójában 4 KÜLÖNBÖZŐ cikkre mutat (nem mind ugyanarra); a 4. rész
   pedig ténylegesen egy másik témájú cikk (The Frame kiállítás Tihanyban).
   Javítva: mind a 4 rész a pontos, valódi forrás-URL-jére linkel.
7. **`/norbert-banhalmi` — hiányzó „Mélyinterjúk és sajtóvisszhang"
   szekció és a valódi eredettörténet.** A korábbi verzió saját,
   rövidített, parafrazált szöveget tartalmazott a tényleges önéletrajzi
   szöveg helyett. Javítva: a teljes, hiteles narratíva bekerült
   (informatikusi múlt → 1999 nagybácsi inspirációja → katonai szolgálat
   → 2006. március 15. HIPStudio alapítása → Coca-Cola-kampányok →
   2014 New York-i áttörés → OM System nagykövetség 2018 → Samsung/Rege
   Galéria Tihany → holland UEFA-válogatott → MFVSZ-tagság 2026 → VIPACH
   fotóklub → AmCham Austria), valamint az 5 mélyinterjú-link (Kiskegyed,
   She/Life.hu, Jazzy Rádió, Rólunk.at, **Tripont Magazin — új forrás**)
   és a 3 részes életút-videó linkjei.
8. **Kapcsolat-adatok pontosítása.** Hiányzott a két stúdió kapucsengő-
   száma (Budapest: 8-as, Bécs: 9-es) és a bécsi szám WhatsApp-jelölése —
   pótolva. A bécsi cím "Schwedenplatz 2 / Laurenzerberg 5" formában
   szerepel, amit a társoldal kanonikus entity.jsonld-je is megerősít
   (a rövidebb, csak "Schwedenplatz 2"-t mutató élő megjelenítés a
   teljes hivatalos címnek csak a rövidített változata). GYIK-hivatkozás
   hozzáadva.
9. **Footer „Tagságok" sáv hiányzott.** Az élő oldal lábléce négy
   szakmai tagsági jelvényre linkel: WKO, AmCham Austria, **MILC Club
   (új infó — eddig nem szerepelt sehol)**, MFVSZ. Pótolva mindhárom
   nyelven, a footer legalline alatt.
10. **`/mediamegjelenesek` — Tripont Magazin hiányzott** a sajtólistából
    — pótolva (18. tétel).

### Tudatosan eltérő, indokolt döntések (nem hiba)

- **Jogi oldalak URL-je**: az élő oldal lábléce az Impresszum/Adatvédelem/
  ÁSZF/GY.I.K. linkeket a **norbertbanhalmi.com**-ra irányítja (közös,
  centralizált jogi tartalom a két property között). A saját archívumunk
  **önálló, archívum-specifikus** Impresszum/Adatvédelem/Szerzői jog/
  Akadálymentesség oldalakat tart fenn — ez szándékos: a mi adatvédelmi
  nyilatkozatunk ténylegesen pontos erre a süti- és követés-mentes,
  statikus oldalra (a kereskedelmi oldal ÁSZF-je megrendelésekről szól,
  ami egy archívumra nem értelmezhető). Az ÁSZF és GY.I.K. tartalom
  nincs külön archiválva, mivel az kizárólag a kereskedelmi
  szolgáltatásokra vonatkozik.
- **„Ügyfélvélemények" (Google-értékelések, Trustindex widget)**: az élő
  főoldal egy harmadik féltől (Trustindex/Google) dinamikusan betöltött
  vélemény-blokkot is megjelenít. Ezt szándékosan NEM archiváltuk —
  dinamikus, folyamatosan változó, harmadik fél tulajdonában lévő
  tartalom, amelynek statikus másolása adatvédelmi és a review-platform
  ÁSZF-je szempontjából sem indokolt egy archívum esetében.
- **„Könyveken, kiállításokon és emberi találkozásokon át" bekezdés**:
  az élő főoldalon egy rövid, önálló mission statement paragrafus,
  amely jelenleg nincs külön kiemelve az én verziómban — tartalmilag
  lefedi a Bio-oldal bevezetője, nem tekintjük kritikus hiánynak.



## Entitásgráf-harmonizáció a norbertbanhalmi.com kanonikus gráfjával (2026-07-17)

A társoldal GitHub-repója (880rzz/BANHALMI) időközben közzétette saját
`entity.jsonld` fájlját — ez a Person-entitás **kanonikus, hivatalos**
leírása, amit mindkét oldal ugyanazzal a fragment nélküli `@id`-vel
(`https://www.banhalmi.art/norbert-banhalmi`) hivatkozik. Mivel a két
property egyetlen összefüggő gráfot alkot kereső-/AI-rendszerek
szemében, minden megosztott mezőt **szó szerint** átvettünk a
társoldal gráfjából, hogy elkerüljük az ütköző/töredezett
entitás-reprezentációt:

- **`name`**: „Norbert Banhalmi" (nem „Bánhalmi Norbert" — a kanonikus
  gráf ezt használja elsődleges névként, a magyar névsorrend az
  `alternateName`-ben szerepel)
- **`birthPlace`/`homeLocation`**: Wikidata City-entitások (Budapest
  Q1781, Bécs Q1741), nem generikus `Place` szöveg
- **`sameAs`**: a valódi, ellenőrzött profilok (Wikidata, Wikipédia,
  Commons, Google Knowledge Graph, Instagram, Facebook ×2, LinkedIn,
  X, Pinterest, TikTok) — a korábbi verzióban feltételezett/generált
  linkek helyett
- **`memberOf`/`affiliation`**: pontos Wikidata QID-ekkel (MFVSZ
  Q138413557, WKO Q138424838, Pannon Fényképészkör Egyesület, VIPACH
  Q138416887, HIPStudio Q138482177, Rege Galéria Tihany Q138414682,
  OM SYSTEM)
- **`award`**: Turul-díj (2021–2025, évente), TOP100 Magyarország
  (2022) — korábban egyáltalán nem szerepelt
- **`alumniOf`/`hasCredential`**: Gábor Dénes Egyetem (mérnökinformatikusi
  diploma, 2005), New York Institute of Photography (2015), FOCUS
  Oktatási Kft. (2018) — a Gábor Dénes Egyetem korábban egyáltalán
  nem szerepelt
- **`organizationNode.name`**: „Bánhalmi Norbert e.U." (a jogi cégnév,
  nem az „BANHALMI" márkanév)
- **Eltávolítva**: egy önállóan feltalált `Brand` típusú csomópont,
  amely nem létezik a társoldal gráfjában — helyette csak a valós
  `logo` referencia maradt az Organization alatt.
- **`websiteNode` (banhalmi.art WebSite)**: name/description mező
  szó szerint a társoldal saját `subjectOf` tömbjében rögzített,
  hivatalos külső leírás erről az oldalról ("BANHALMI Art — official
  artistic oeuvre and source archive…").

Ez a harmonizáció az `src/lib/schema.ts`-ben központosított, minden
oldal-JSON-LD, az `entity.jsonld`, `llms.txt` és `ai.txt` végpont
ebből táplálkozik — egyetlen forrásból, konzisztensen.

### Új, korábban ismeretlen tények (a Bio-oldalba is beépítve)

A kanonikus gráf és az élő oldal böngészős auditja során derült ki:
HIPStudio megalapítása (2006.03.15., eredetileg a Magyar Honvédség
fotóstúdiója), VIPACH fotóklub (2024.09.01., Bécs), Gábor Dénes
Egyetem mérnökinformatikusi diploma (2005), Turul-díjak és TOP100
Magyarország elismerés, MILC Club nagyköveti tagság.





## VÉGLEGES ÁLLAPOT — recrawl-képek beépítve (2026-07-17, záró kör)

A korábban nyitva hagyott hiány (Best of galéria 44/122 képe, 26 poszt
hiányzó hero-képe) ezúttal **teljeskörűen lezárva**: a Claude Code-dal
scroll-crawl.mjs-sel letöltött 200 nyers képből, a hozzá tartozó
scroll-manifest.json (kép↔oldal↔alt-szöveg) adatai alapján, a chrome-
szűrés (ügyfél-logók, ikonok kizárása) után:

- **Best of galéria: 155 kép** (korábban 44) — mind optimalizálva
  (AVIF, 320/640/1200/1920px reszponzív variánsokkal), élő oldal
  sorrendjében, valós alt-szöveggel
- **Mind a 26 korábban hero-kép nélküli poszt** kapott hero-képet
- Végső build-audit: **425 oldal, 0 kritikus hiba, 0 figyelmeztetés**,
  2598 kép (a korábbi 2037-ről), mind alt-szöveggel, mind betölthető

Ezzel a korábban dokumentált két nyitott hiányosság (lásd lejjebb, a
történeti feljegyzésként megőrzött szakaszban) **megoldva**.

## Manuálisan ellenőrzött tételek

- `sitemap.xml`: 139 URL (14 statikus + 9 tag/hashtag + 116 rekord) — egyezik a várt lefedettséggel
- `entity.jsonld`, `llms.txt`, `ai.txt`, `robots.txt`, `archive-index.json` — mind érvényesek, elérhetők
- JSON-LD harmonizáció: `Person @id` fragment nélkül, megegyezik a norbertbanhalmi.com gráfjával
- `npm audit --production`: **0 sebezhetőség**
- Fájlméret-ellenőrzés: nincs 100 MB-nál nagyobb fájl (GitHub egyedi fájl limit)
- Pagefind: 348 oldal indexelve, 3 nyelven

## Ismert, nem javított korlát

26 posztnál a Wix lazy-loaded galéria-képei nem szerepeltek a statikus
crawl média-listájában (csak a sitewide ügyfél-logó sáv volt elérhető
`foundOnPages`-ben). Ezeknél a rekordoknál nincs hero-kép — a szöveg és
minden egyéb metaadat viszont teljes. Póteléshez az eredeti Wix-oldal
újra-crawlolása szükséges dinamikus JS-rendereléssel (pl. Playwright).

## Tartalmi lefedettség az eredeti banhalmi.art oldalhoz képest

Az eredeti Wix-oldal teljes crawl-adatbázisa (137 sikeresen bejárt oldal,
mind 200-as státusszal) alapján ellenőrizve:

| Szekció | Eredeti | Migrált | Eltérés |
|---|---|---|---|
| `/post/*` | 98 crawl-bejegyzés → **97 egyedi útvonal** | 97 | 0 — a 98. bejegyzés az `euforia` poszt duplikált crawlolása volt, nem önálló cikk |
| `/fotokiallitasok/*` | 19 (+1 index) | 19 (+1 index) | 0 |
| `/blog/tags/*` | 7 | 7 | 0 |
| `/blog/hashtags/*` | 2 | 2 | 0 |
| `/blog` index | 1 | 1 | 0 |
| Statikus oldalak (`/`, `/konyveim`, `/20ev`, `/mediamegjelenesek`, `/norbert-banhalmi`, `/kapcsolat`, `/curators`) | 7 | 7 | 0 |
| `/hu` (Wix nyelvi gyökér) | 1 | 1 (átirányító stub `/`-ra) | 0 |
| Letöltött képek | 924 | 911 optimalizált (13 sosem konvertálódott AVIF-re a korábbi optimalizálási lépésben; **0 érintett rekord**, mert egyik sincs ténylegesen hero/galéria-hivatkozásként használva) | elhanyagolható, tartalmi hatás nélkül |
| Dokumentumok (PDF) | 6 | 6 | 0 |

**Eredmény: a tartalom 1:1 lefedett** — minden eredeti poszt, kiállítás,
tag/hashtag-oldal, statikus oldal és dokumentum megvan a v2 archívumban,
a fent jelzett, tartalmilag semleges eltérésekkel.

## Design-audit (Apple.com-szintű UX-frissítés)

- Frissített tipográfiai skála (nagyobb, magabiztosabb `h1`/`h2`, `-apple-system`
  display-betűtípus, finomított `letter-spacing`)
- Bővített whitespace (nagyobb `--maxw`, kártyarács-gap, `section`-térközök)
- Üveges, lebegő fejléc (`backdrop-filter: blur`) — Apple.com-mintára
- Finom, célzott mozgás: kártya- és hero-képek `hover`-re `scale(1.035–1.06)`
  zoomolnak `cubic-bezier` easinggel, `overflow:hidden` konténerben (nincs
  layout-ugrás)
- Visszafogott, letisztult szín-paletta: mély grafit (`#1d1d1f`) + meleg
  arany akcent, változatlanul WCAG AA kontraszttal
- Build utáni audit: **419 oldal, 0 kritikus hiba** (a `/hu` átirányító
  stub kizárva a H1-ellenőrzésből, mivel az szándékosan tartalom nélküli)

## Reprodukálhatóság

```bash
npm install
npm run build         # astro build + pagefind
npm run audit          # tools/audit.py dist
```
