# Nyelvi tisztaság, belső és külső linkek — audit és javítási terv

**Dátum:** 2026-08-01 · **Vizsgált állapot:** az élő `banhalmi.art`, `20260801-museum-v2` kiadás

---

## Összefoglalás

| Terület | Vizsgált | Hiba | Súly |
|---|---|---|---|
| Nyelvi tisztaság | 88 oldal, 1 309 leíró szövegrész | **6 szövegrész, 4 oldalon** | kicsi, de látszik |
| Belső linkek | 3 693 hivatkozás | **2 link** (+ 0 törött cél) | közepes |
| Külső linkek | 149 egyedi URL | **0** | — |

---

## 1. Nyelvi tisztaság

### Módszer

Minden oldal `<main>` tartalmából kiszedtem a szövegblokkokat, gondolatjelnél és
elválasztóknál szegmensekre bontottam, és nyelvenként egyedi funkciószavakkal
(névelők, kötőszavak, ragok) mértem. Két dolgot külön kezeltem:

- **Tulajdonneveket kihagytam.** Ha egy szegmens szavainak 60%-a nagybetűs, az név,
  nem próza. Egy magyar cikkcím a német oldalon is magyar marad — ez archívumi
  pontosság, nem hiba.
- **A nyelvek közt kétértelmű szavakat kizártam.** Az „a" egyszerre magyar névelő és
  angol határozatlan névelő; az „in" és a „was" angol és német is. Amíg ezek benne
  voltak a mintában, a detektor angol prózát jelentett magyarnak — 50 találatból
  34 hamis riasztás volt. Tisztított szólistával 16 találat maradt, ebből 6 valódi.

### Valódi hibák

**1.1 · EUFÓRIA-oldal, „Merre járt a kép" lista — `hu/` és `de-at/`**

A kiadványnevek és a cikkcímek helyesen maradnak eredetiben. A **leírók** viszont
mind a három nyelven angolul állnak:

| jelenleg | magyar | német |
|---|---|---|
| `critical commentary` | kritikai kommentár | kritischer Kommentar |
| `report in Russian` | orosz nyelvű beszámoló | Bericht auf Russisch |
| `the story of the photograph` | a kép története | die Geschichte des Bildes |
| `interview on the motivation` | interjú a motivációról | Interview über die Motivation |

Változatlan marad: *„Ein talentierter Schlawiner"*, *Opinion: The End of the Strongman
Spell*, *The Hungarian Spring*, *A new dawn for Hungary* — ezek a cikkek valódi címei.

**1.2 · Közösségi oldal, műfajmegjelölés — `hu/` és `de-at/`**

| jelenleg | magyar | német |
|---|---|---|
| `(photography)` | (fotográfia) | (Fotografie) |
| `(digital photography)` | (digitális fotográfia) | (digitale Fotografie) |

A kiállításcímek (*A természet csendje*, *Szemek a nagyvilágból*, *The Frame*) maradnak.

### Amit megvizsgáltam és **nem** hiba

- **`writing.html` magyar cikkcímei az angol és német oldalon.** A bevezető mindhárom
  nyelven kimondja: *„mostly in Hungarian" / „überwiegend auf Ungarisch"*. A címek
  valódiak, a lap őszinte róluk.
- **„In meinen eigenen Worten"** 19 német oldalon — ez német, a detektor tévedett.
- **Kiállítás-, kiadvány- és szervezetnevek** (Rege Galerie, WKO Wien, OM SYSTEM,
  AmCham Austria, Kiskegyed, Tripont Problog).
- **Az '56-os életutak** — a 6. lépésben mindhárom nyelven elkészültek.

---

## 2. Belső linkek

3 693 belső hivatkozás, **0 törött cél**. A nyelvváltón kívül 9 link vált nyelvet:

| eset | db | ítélet |
|---|---|---|
| `/archive-source-map.json`, `/wikipedia-source-registry.json` | 5 | **helyes** — közös, gépi olvasásra szánt adatfájlok, nincs nyelvi változatuk |
| `/post/60-perc` a magyar oldalról | 1 | **helyes** — magyar nyelvű átirányító a régi blogra |
| **EUFÓRIA „archive record" link** | **2** | **hiba** |

**2.1 · Az angol és a német EUFÓRIA-oldal a magyar változatra mutat**

```
exhibitions/euforia.html        <a href="/hu/exhibitions/euforia.html">EUFÓRIA — archive record</a>
de-at/exhibitions/euforia.html  <a href="/hu/exhibitions/euforia.html">EUFÓRIA – Archivdatensatz</a>
```

Egy angol olvasó a saját nyelvű oldalról magyar szövegre érkezik, pedig a
`/exhibitions/euforia.html` és a `/de-at/exhibitions/euforia.html` létezik.
A `hreflang` sorok helyesek, csak ez a törzsbeli link rossz.

Mellette: a horgony szövege duplikálódik („EUFÓRIA — archive record**Archive record**"),
ezt is megnézem.

---

## 3. Külső linkek

**149 egyedi külső URL, mind elérhető.** Nincs `target="_blank"` `rel="noopener"` nélkül,
és nincs egyetlen `http://` hivatkozás sem.

A böngészőből futtatott `no-cors` próba 9 hibát jelzett — **mind hamis**. A `no-cors`
mód csak hálózati szintű hibát lát; a YouTube, az X és a Google kereszt-eredetű
lekérést blokkol, ezért „hibának" látszanak. A két valóban gyanús domaint valódi
navigációval ellenőriztem:

- **tinkmara.com** — él, a 2014-es interjú olvasható
- **fotozasturul.eu** — él, a szakmai profil megvan

**Egy megjegyzés a mérésről.** A crawl első körben elavult példányokat kapott
(`regaleria.hu`, `http://tinkmara.com`), miközben a friss lekérés szerint az élő oldal
már a javított `regegaleria.hu`-t és `https`-t tartalmazza. A deploy propagálása közben
mértem. Ez arra emlékeztet, hogy élesítés után érdemes néhány percet várni a
verifikációval.

---

## Javítási terv

| # | Mit | Hol | Kockázat |
|---|---|---|---|
| 1 | 4 leíró lefordítása a „Merre járt a kép" listában | `hu/` + `de-at/exhibitions/euforia.html` | alacsony |
| 2 | 2 műfajmegjelölés lefordítása | `hu/` + `de-at/community.html` | alacsony |
| 3 | EUFÓRIA „archive record" link saját nyelvre állítása + horgonyszöveg duplikáció | `exhibitions/euforia.html`, `de-at/exhibitions/euforia.html` | alacsony |
| 4 | **Új teszt:** `audit-language-purity` — a fenti detektor beépítve, tulajdonnév-szűréssel és kétértelmű szavak nélkül | `tests/` | — |
| 5 | **Új teszt:** belső link nem hagyhatja el a saját nyelvét, kivéve a nyelvváltót és a nyelvsemleges adatfájlokat | `tests/` | — |
| 6 | Release token léptetése és `npm run bump:release` | `data/design-release.json` | — |

A 4. és 5. pont a lényeg: e nélkül ugyanez a két hibaosztály csendben visszatér.
A fordításokat egy szerkeszthető adatfájlba teszem, nem a HTML-be, hogy a
generátorlánc ne írhassa vissza őket.

Minden egy commitba fér. Pusholni továbbra is te fogsz.
