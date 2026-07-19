# Hello It's Me — teljes UX/UI audit és újratervezés

Dátum: 2026-07-18

## Auditált területek

- tipográfiai hierarchia
- szövegkontraszt és háttérkontraszt
- desktop és mobil térközök
- érintési célok
- fő navigáció
- főoldali hero
- mitológiai forrásmagyarázó blokk
- kártya- és funkciórácsok
- űrlapmezők és gombok
- igen/nem oldal
- reduced motion és increased contrast támogatás

## Kiinduló problémák

1. Több, egymásra írt CSS-réteg egymásnak ellentmondó színeket és méreteket adott.
2. A mitológiai forrásblokk sötét hátteret használt, miközben a globális világos téma sötét szövegszíneket örökített bele.
3. Mobilon a rendszer a desktop rácsokat egyszerűen összenyomta, nem pedig mobil információs architektúrát használt.
4. A navigáció túl sok elemet próbált egyszerre megjeleníteni és kis kijelzőn teljes szélességű sorokra váltott.
5. A főoldali szövegek középre rendezése mobilon gyengítette a gyors olvashatóságot.
6. A komponensek radiusa, árnyéka, háttere és belső margója nem egyetlen rendszerből származott.
7. Több vezérlő nem garantált 44 px-es mobil érintési célméretet.

## Új design system

### Színek

- oldalháttér: `#f5f5f7`
- felület: `#ffffff`
- fő szöveg: `#1d1d1f`
- másodlagos szöveg: `#424245`
- kiegészítő szöveg: `#6e6e73`
- visszafogott arany akcentus: `#765a18`

A fő szöveg, másodlagos szöveg, kiegészítő szöveg, akcentus és elsődleges gomb kontrasztja automatikusan ellenőrzött.

### Tipográfia

- rendszerbetű: `-apple-system`, BlinkMacSystemFont, SF Pro fallback
- alap szöveg: 17 px
- hero: 44–80 px reszponzív skála
- fő szakaszcím: 32–56 px
- bevezető szöveg: 18–22 px
- kerülve: vékony fontok, túlzott uppercase és túl nagy betűköz

### Térközök

- desktop oldalmaximum: 1180 px
- szövegoszlop: 720 px
- szakaszritmus: 64–112 px
- komponensgap: 16–24 px
- mobil oldalmargó: 16 px, nagyon keskeny kijelzőn 12 px
- safe-area támogatás iPhone kijelzőkön

### Komponensek

- 44 px minimum interaktív magasság
- egységes 16–24 px radius
- világos, magas kontrasztú felületek
- visszafogott árnyék, csak hierarchia jelzésére
- egyértelmű kék fókuszgyűrű billentyűzetes használathoz

## Mobil újratervezés

- a teljes kijelzőszélességet használja safe-area margókkal
- vízszintesen görgethető, kompakt felső navigáció
- balra zárt hero és tartalmi címek
- egyoszlopos kártyák
- teljes szélességű fő CTA-k
- házkártyák mobil listanézetben ikonnal és szöveggel
- a barlanggrafika szélesebb, edge-to-edge vizuális elem
- a forrásmagyarázó blokk nem sötét panel, hanem világos tartalmi kártya
- az igen/nem folyamat ugyanazt a vizuális rendszert használja

## Automatikus UX-audit

A `scripts/ux-design-test.mjs` ellenőrzi:

- design tokenek jelenlétét
- 44 px érintési célokat
- safe-area szabályokat
- mobil egyoszlopos struktúrát
- vízszintesen használható navigációt
- reduced-motion támogatást
- increased-contrast támogatást
- öt kritikus színpár kontrasztját
- a régi sötét mitológiai panel visszatérésének tilalmát

## Apple-alapelvek alkalmazása

A redesign a következő elveket követi:

- világos vizuális hierarchia
- következetes komponensviselkedés
- rendszerbetű és jól olvasható alapméret
- adaptív layout, nem puszta zsugorítás
- megfelelő kontrollméret és kontrollköz
- tartalomközpontú, visszafogott vizuális anyaghasználat
- akadálymentes fókusz, kontraszt és mozgáskezelés

## Auditkorlát

Az automatikus audit forráskód-, kontraszt-, szerkezet- és regresszióellenőrzést végez. A tényleges fizikai eszközökön végzett vizuális és érintéses teszt külön manuális QA-kör marad.
