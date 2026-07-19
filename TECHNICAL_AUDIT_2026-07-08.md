# Technikai audit és javítások — 2026-07-08

## Javított hibák

### 1. Lexikonlapok nem nyíltak meg láthatóan
A modális ablak eredeti `position: fixed` beállítását egy későbbi közös CSS-szabály `position: relative` értékre írta felül. Emiatt a tartalom megnyílt, de a dokumentum alján, a látható területen kívül jelent meg.

Javítás:
- a modal minden nézetben fix, teljes képernyős réteget kapott;
- mobilon biztonságos belső görgetést és safe-area térközt kapott;
- megnyitáskor lezárja a háttér görgetését;
- bezáráskor visszaadja a fókuszt a megnyitott lapnak;
- a statikus tartalék lexikonkártyák is eseménydelegálással működnek;
- Enter és Space billentyűvel is megnyitható.

### 2. Randomizáció finomhangolása
Az alap véletlenforrás már korábban is jó minőségű volt: Web Crypto `crypto.getRandomValues()`, torzításmentes rejection sampling és Fisher–Yates keverés.

Talált és javított problémák:
- a `global` előzmény bizonyos húzásoknál kétszer került eltárolásra;
- global módban ugyanaz az előzmény kétszer számíthatott bele a súlyozásba;
- a „Druida áramlás” négy friss lapot időnként teljesen kizárt, miközben a leírás szerint minden lapnak maradt esélye.

Új működés:
- nincs kemény tiltólista;
- minden elérhető lapnak mindig marad nem nulla esélye;
- a közeli ismétlések folyamatos, lágy súlycsökkentést kapnak;
- a pakliházak egyensúlyozása megmaradt;
- a „Tiszta sorsolás” továbbra is emlékezet nélküli, egyenletes kriptográfiai húzás.

### 3. Animált háttérpontok
A teljes oldalas `#stars` SVG-t egy későbbi statikus csillagmező-kód felülírta, ezért az előkészített animáció nem tudott megfelelően működni.

Javítás:
- asztali nézet: 52 finoman sodródó és pulzáló pont;
- mobilnézet: 28 pont, kisebb teljesítményterheléssel;
- `prefers-reduced-motion: reduce` esetén mobilon 16, asztali gépen 28 statikus pont;
- a pontok nem fogják el a kattintásokat;
- a pontok létrehozása is a közös biztonságos véletlenforrást használja;
- a korábbi `Math.random()` hívások megszűntek.

### 4. Kiegészítő technikai tisztítás
- eltávolítottam a `<body>` elején lévő felesleges záró `</div>` taget;
- az angol randomizációs mód leírása most valóban angol;
- frissült az alkalmazás belső verzióazonosítója: `2026.07.08-audit-2`.

## Ellenőrzések

- Magyar oldal: JavaScript szintaxis rendben.
- Angol oldal: JavaScript szintaxis rendben.
- JSON-LD blokkok: mindkét oldalon szintaktikailag érvényesek.
- Duplikált HTML ID: nincs.
- Hibás `aria-controls` cél: nincs.
- Lexikon: mind a 76 kártya megjelenik.
- Modal: asztali és mobil nézetben látható, `position: fixed`, bezárható.
- Háttérpontok: 52 desktop / 28 mobil; csökkentett mozgásnál statikusak.
- 100 000 darab `randInt(10)` próba eloszlása kiegyensúlyozott tartományban maradt.
- Fisher–Yates próba: mind a 76 elem egyedi maradt.
- Böngészőteszt közben JavaScript konzolhiba nem jelentkezett.
