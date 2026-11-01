# EUFÓRIA — galéria- és műrekordszabályzat

Verzió: 1.3 · 2026-10-16 · Hatókör: az EUFÓRIA minden meglévő és később érkező műve, EN / HU / DE-AT.

Ez a szabályzat az `APPLE-DESIGN-CONTRACT.md` galériaspecifikus kiegészítése. A három nyelv azonos tartalmi struktúrát használ. A dokumentáció hossza művenként eltérhet: az adat hiánya megengedett, feltételezett adat közlése nem.

## 1. A látható műblokk

Egy mű egyetlen `section.euforia-artwork-section` elem. Stabil azonosítója `euforia-work-<slug>`; későbbi átnevezéskor a meglévő hivatkozásokat meg kell őrizni.

Sorrend minden képernyőméreten:

1. Teljes, aránytartó fénykép; nincs levágás vagy nyújtás.
2. Képaláírás: személy, helyszín, dátum; képspecifikus forráshivatkozás megengedett.
3. Mű sorszáma, H2 cím, legfeljebb egy rövid bevezető bekezdés.
4. Egy alapértelmezetten zárt, natív `details.euforia-record` elem.

Asztali nézetben (821 px-től) minden műblokk két egyenrangú oszlopot használ: az egyik oszlop a teljes, aránytartó képet, a másik a képaláírást, műcímet, rövid bevezetőt és a dokumentációs lenyílót tartalmazza. A váltakozó műblokkoknál a kép és a szöveg oldala felcserélhető. 820 px-ig a blokk egy oszlopra törik, kép → szöveg sorrendben. A cél, hogy desktopon a mű és az alapinformáció együtt áttekinthető legyen, a kép ne nőjön indokolatlanul teljes tartalomszélességre; a képet továbbra sem szabad vágni vagy nyújtani. A hosszú életrajz, sajtólista, statisztika, történet és forrásjegyzék a saját kép lenyílójába kerül. Más személy blokkjába nem kerülhet. A projekt egészére vonatkozó bevezető és életműkapcsolat a műblokkokon kívül marad.

## 2. A lenyíló kötelező rovatai

Minden mű `data-euforia-record="<slug>"` attribútumot kap. A belső konténer `.euforia-record-content`. Az alábbi öt `.euforia-record-part` kötelező, ebben a sorrendben:

| `data-record-part` | HU cím | Tartalom és határ |
|---|---|---|
| `context` | Az ember és a kontextus | Rövid, semleges, forrásolható életrajz; a személy szerepe a felvételkor; az esemény háttere. |
| `photograph` | A felvétel adatai | Dátum, ismert pontos idő és időzóna, helyszín, fotográfus; ellenőrzött technikai adatok, ha rendelkezésre állnak. Ismeretlen időpontot vagy eszközt tilos kikövetkeztetni. |
| `interpretation` | Művészeti értelmezés | A kép olvasata, képi döntések és EUFÓRIA-kapcsolat. A művészi értelmezést el kell választani a tényállítástól; a szereplő érzései és szándékai nem állíthatók bizonyíték nélkül. |
| `provenance` | Források és eredet | Eredeti fájl/Commons/Flickr, szerzőség, licenc, azonosítók, életrajzi források és a bizonyíték ellenőrzési állapota. |
| `circulation` | A kép nyilvános utóélete | Kronológia, sajtó, közösségi megosztások, feldolgozások, ellenőrzött Wikimedia-felhasználás. Minden tételnél pontos URL és a dokumentált kapcsolat típusa. |

EN címek: Person and context; Photograph record; Artistic reading; Sources and provenance; Public circulation.

DE címek: Person und Kontext; Aufnahmedaten; Künstlerische Lesart; Quellen und Provenienz; Öffentliches Nachleben.

Summary: HU „Részletek és dokumentáció”; EN „Details and documentation”; DE „Details und Dokumentation”.

Hosszú sajtólisták a nyilvános utóélet rovaton belül kaphatnak külön lenyílót. A külső főlenyíló ettől továbbra is egyetlen mű teljes dokumentációját tartalmazza.

## 3. Hiányzó és később érkező adatok

Ha egy rovat még nem dokumentált, a rovat és címe maradjon meg. Szövege legyen rövid, konkrét és az oldal nyelvére fordított:

- HU: „Dokumentáció gyűjtés alatt.”
- EN: „Documentation in progress.”
- DE: „Dokumentation im Aufbau.”

A jelölő bekezdés `data-record-status="collecting"` attribútumot kap. Adatgyűjtés nem jelent megtörtént sajtómegjelenést, létező felhasználást vagy automatikus jövőbeli frissítést. A már ismert adatokat meg kell tartani; csak a további dokumentációra vonatkozhat a hiányjelzés. Nincs mesterségesen azonos szöveghossz, kitalált történet vagy nulla értékkel megjelenített ismeretlen statisztika.

Új adat érkezésekor az érintett rovatot és mindhárom fordítást együtt kell frissíteni. A bizonyíték nélküli jelölt forrás különüljön el az ellenőrzött felhasználástól. Megosztás vagy publikáció önmagában nem jelent megrendelést, támogatást, politikai kapcsolatot vagy ajánlást.

## 4. Pontos tipográfia és térközök

Az egyetlen CSS-forrás az `assets/css/site.css`, az `EUFORIA-EDITORIAL-ARTWORKS-V1` blokk. Új inline stílus, runtime helyreállító CSS és párhuzamos felülírás nem készülhet.

| Elem | Méret és ritmus |
|---|---|
| Betűcsalád | Örökölt `--art-sans`; rendszerbetűk, nincs új webfont. |
| Summary | 1rem; 600; 1.5 sormagasság; 0 betűköz; 1rem × 1.25rem belső tér. |
| Tartalmi konténer | Legfeljebb 72ch; `clamp(1rem,2vw,1.5rem)` belső tér. |
| Rovatcím / belső alcím | `clamp(1.125rem,1.2vw,1.375rem)`; 600; 1.3 sormagasság; −.01em betűköz; 1.5rem felső, .75rem alsó margó. |
| Belső alcím (H4) | 1rem; 600; 1.4 sormagasság; 0 betűköz; 1.25rem felső, .75rem alsó margó. |
| Törzsszöveg | 1rem; 400; 1.65 sormagasság; 0 betűköz; max. 66ch; 1rem bekezdésköz. |
| Metaadat, dt/dd | .875rem; 1.6 sormagasság; a dt 600-as súlyú. |
| Rovatok között | 2rem. |
| Adatsorok | 1:2 arányú oszlopok, 1rem oszlopköz, .75rem sorköz; minden oszlop zsugorodhat és tördelhet. |
| Képek közötti műblokk | A meglévő `clamp(32px,5vw,76px)` függőleges ritmus. |

A dokumentációs/evidence linkcsoportok asztali nézetben kétoszlopos, közös kezdővonalú rácsot használnak; páratlan elemszámnál az utolsó link a bal oszlopban kezdődik. A linkek közötti önálló `·` szeparátort a HTML-ből el kell távolítani; nem elegendő CSS-sel elrejteni. 700 px-ig a linkrács egy oszlopra törik. Egyedi linken (például sajtóforráson) tilos margin/transform/pozicionálási korrekcióval igazítani.\n\nAlapszínek a meglévő archívum színei; az arany `#B79C44` hangsúlyhoz használható. Gyűjtés alatt álló adat nem válhat nehezen olvashatóvá halványítással. A lenyílón belül korábbi teljes szélességű háttérdekoráció nem lóghat ki a konténerből.

Az ART teljes oldalrendszerében a külső linkek aláhúzás és dekoratív alsó vonal nélkül jelennek meg, pontosan egy, a feliratban szereplő `↗` nyíllal. CSS vagy JavaScript nem adhat hozzá második nyilat. A `↗` a megelőző szóhoz nem törhető szóközzel (`NBSP`, U+00A0) kapcsolódik, hogy ne kerülhessen önállóan új sorba. A footer hivatkozásai sem kaphatnak aláhúzást; a billentyűzetes fókuszjelzés kötelező.\n\n## 5. Hozzáférhetőség és reszponzivitás

Natív details/summary, billentyűzetes használat és látható fókusz kötelező. Summary legalább 44px magas. Hosszú URL-ek tördelhetők; vízszintes túlcsordulást tilos elfedni. A kép saját alt szöveget, ismert szélességet/magasságot és a hero alatti képeknél lazy betöltést kapjon. A nyitott és zárt állapot egyaránt ellenőrizendő.

Kötelező szélességek: 375, 390, 621, 768, 1024, 1180, 1280, 1440, 1600, 1920, 2560, 3840 px. A nagy kijelző nem indok a bekezdések olvashatósági korlátjának feloldására.

## 6. SEO / GEO / schema / LLM / E-E-A-T

A tartalom a szerver által kiszolgált HTML-ben szerepel; megnyitáskor nem kell hálózatról lekérni. Canonical, hreflang és stabil műazonosítók megőrzendők. A projekt művészeti intentje megmarad; a személy hírneve nem indok kereskedelmi szolgáltatási célzásra.

Minden új műnek saját Photograph/ImageObject azonosító, dokumentált szerző, ábrázolt személy és projektkapcsolat kell. Ismeretlen mező kimarad a JSON-LD-ből. A „gyűjtés alatt” jelzés nem kerülhet ellenőrzött sajtókapcsolatként, díjként vagy licencként a sémába. A Commons Quality Image és Featured Picture különböző minősítés. Event schema csak ténylegesen meghirdetett eseményre készülhet; a tervezett kiállítás nem kap kitalált időpontot vagy helyszínt.

## 7. Új kép felvétele és élesítés

1. Ellenőrizd a felvétel forrását, személyét, projektstátuszát, engedélyét/licencét és ismert alapadatait.
2. Hozd létre a műblokkot, a stabil slugot és mind az öt rovatot a három nyelven.
3. Az ismeretlen rovatokba helyezd a megfelelő gyűjtési státuszt; a forrásokat a megfelelő műhöz kösd.
4. Frissítsd a projekt térképét, a kapcsolódó gépi műrekordokat és a sitemap dátumát.
5. Futtasd az `npm test` ellenőrzést, benne a `tests/audit-euforia-record-contract.mjs` szerkezeti ellenőrzéssel, majd a nyitott/zárt böngészőteszteket.
6. Feature branch → PR → sikeres kötelező CI → merge → deploy → háromnyelvű éles HTML, kép, lenyíló, schema és reszponzív ellenőrzés.

A szabályzat önmagában nem hoz létre adatgyűjtő automatizálást. Az új bizonyítékok beépítése ellenőrzött szerkesztői feladat.
