# Hello It's Me — végső UI/UX, tartalmi, technikai, működési és nyelvi audit

Dátum: 2026. július 19.
Érintett nézetek: magyar és angol főalkalmazás, magyar és angol Igen/Nem inga, mobil, tablet és asztali elrendezés.

## Vezetői összefoglaló

A vizuális hiba nem egyetlen színbeállításból eredt. Több, időben egymásra épült CSS- és JavaScript-réteg egyszerre próbálta irányítani ugyanazokat az elemeket. Emiatt a belépő nézet részben világos „papírlappá” vált, a dekoratív erdő- és ködréteg a holdgrafika fölé kerülhetett, a fejléc elveszíthette a biztos felső pozícióját, a mobilmenü pedig egy korábbi eseménykezelő hibájától függött.

A végső javítás külön, legutolsóként betöltődő CSS- és JavaScript-réteget kapott. Ez nem törli az alkalmazás funkcionális magját, hanem egyértelműen felülírja az ütköző megjelenítési szabályokat, és önálló, korábbi kódtól független navigációs vezérlést ad.

## Feltárt hibák, hatások és javítások

### 1. Világos háttér a belépő blokk körül — magas vizuális súlyosság

**Hiba:** A `.gate-hero`, `.view`, illetve örökölt világos felületi szabályok egymással ütköztek. A sötétzöld kártyák körül nagy, fehér felület jelent meg.

**Hatás:** Megtörte a kelta, sötét vizuális rendszert; a tartalom beágyazott dokumentumnak tűnt; mobilon és keskeny asztali nézetben jelentősen csökkent a prémium érzet és a vizuális hierarchia.

**Javítás:** A belépő nézet, a nézetgyökerek és a kapcsolódó konténerek átlátszó/sötét hátteret kaptak. A „Hogyan lépj be?” rész sötét, kontrasztos panelként marad meg, világos papírréteg nélkül.

### 2. A holdat takaró zöld réteg — magas tartalmi és vizuális súlyosság

**Hiba:** A köd-, erdő- és háttér-SVG rétegek stacking contextje nem volt következetes. Egy dekoratív zöld réteg a hold vagy a holdkártya fölé kerülhetett.

**Hatás:** A napi holdinformáció vizuálisan sérült, a holdfázis nehezen értelmezhetővé vált, és úgy tűnt, mintha maga a grafika lenne hibás.

**Javítás:** A dekorációk negatív háttérrétegbe kerültek, `pointer-events:none` beállítást kaptak. A holdgrafikák külön izolált, magasabb réteget kaptak, a belépő blokk korábbi zöld pszeudo-overlayei pedig teljesen megszűntek.

### 3. Fejléc nem stabilan az oldal tetején — magas UX-súlyosság

**Hiba:** Több CSS-réteg eltérő `position`, `top`, magasság és z-index értékeket rendelt a fejlécnek.

**Hatás:** Görgetéskor vagy egyes viewportokon a fejléc elmozdulhatott, a navigáció ráfedhetett a tartalomra, illetve a felső vezérlők elveszíthették a vizuális elsőbbségüket.

**Javítás:** A fejléc minden oldalon egységes, safe-area kompatibilis, 66 px magas, sticky felső sáv. A legmagasabb alkalmazási z-indexet kapta, ezért a tartalom és a dekoráció nem takarhatja ki.

### 4. Nem működő mobilmenü — kritikus működési hiba

**Hiba:** A menü működése a korábban betöltött runtime-kód és több eseménykezelő együttműködésétől függött. Egy korábbi hiba vagy eseményütközés elég volt ahhoz, hogy a gomb ne nyissa meg a navigációt.

**Hatás:** Mobilon az alkalmazás fő funkciói elérhetetlenné válhattak. Ez teljes feladatmegszakítást okozott, nem csupán kényelmetlenséget.

**Javítás:** Önálló, capture fázisban működő menüvezérlő készült. Kezeli a nyitást, zárást, külső kattintást, Escape billentyűt, fókuszcsapdát, resize eseményt és az ARIA-állapotokat. Nem függ a régi eseménykezelő sikerétől.

### 5. Nézetváltás sérülékenysége — kritikus működési kockázat

**Hiba:** A navigációs gombok és a hozzájuk tartozó `.view` elemek aktiválása kizárólag az alapalkalmazás eseménykezelésére támaszkodott.

**Hatás:** Menühhiba esetén a nézetváltás is megszakadhatott; előfordulhatott, hogy egyszerre több nézet maradt aktív vagy egyetlen nézet sem jelent meg.

**Javítás:** A végső navigációs réteg ellenőrzi a `data-v` és `v-*` kapcsolatokat, aktiválja a kiválasztott nézetet, frissíti az `aria-selected`, `aria-hidden`, `tabindex` és `hidden` állapotokat.

### 6. Mobil és asztali menü eltérő viselkedése — közepes UX-súlyosság

**Hiba:** Korábbi szabályok dokumentumfolyamban megjelenő mobilmenüt, más szabályok fix modális panelt hoztak létre.

**Hatás:** Tartalomugrás, oldalhossz-változás, kiszámíthatatlan görgetés és átfedés jelentkezhetett.

**Javítás:** Mobilon fix, teljes szélességű, görgethető menülap és háttérfátyol működik. Asztalon a menü a fejléc alatt, stabil és vízszintesen görgethető marad.

### 7. Kontraszt és szövegszín öröklési ütközések — magas hozzáférhetőségi súlyosság

**Hiba:** Világos felületre szánt sötét szöveg és sötét panelre szánt világos szöveg egymást felülírhatta.

**Hatás:** Egyes leírások, segédszövegek és címkék nehezen olvashatóvá válhattak.

**Javítás:** A végső réteg minden sötét komponens teljes tipográfiai hierarchiáját világosra rögzíti, a fókuszállapotokat 3 px-es arany körvonallal jelzi, a csökkentett mozgás beállítást tiszteletben tartja.

### 8. Dekoratív elemek eseményblokkolása — magas működési kockázat

**Hiba:** Teljes képernyős SVG- és ködrétegek nem minden esetben rendelkeztek `pointer-events:none` szabállyal.

**Hatás:** Láthatatlan felületek elnyelhették a kattintást vagy érintést, ami a menü és egyes gombok „véletlenszerű” működésképtelenségének tűnhetett.

**Javítás:** Minden dekoratív háttérréteg eseményáteresztő és `aria-hidden` állapotú.

### 9. Nyelvi állapot és oldalpárok — közepes SEO/GEO és használhatósági kockázat

**Ellenőrzés:** A magyar oldalak `hu`, az angol oldalak `en` dokumentumnyelvet használnak; a fő- és Igen/Nem oldalpárok külön belépési pontként megmaradnak. A végső audit ellenőrzi a nyelvi egyezést, a viewport metaadatot és a fő navigáció meglétét.

**Javítás:** A menü nyitási/zárási címkéi dokumentumnyelv alapján magyarul vagy angolul jelennek meg. A csomagolási audit hibára fut, ha egy nyelvi oldal rossz `lang` értékkel kerülne ki.

### 10. Relatív assetútvonalak és cache — magas technikai kockázat

**Hiba:** A relatív CSS/JS útvonalak egyes Pages- vagy domainkonfigurációkban hibás helyre mutathattak; a böngésző régi stílusverziót tarthatott meg.

**Hatás:** A teljes oldal formázatlanul vagy részlegesen formázva jelenhetett meg.

**Javítás:** A kiadási folyamat minden HTML-ben gyökérből induló `/assets/...` útvonalat és egységes cache-verziót használ. A végső CSS és JavaScript legutolsóként töltődik be.

## Automatizált kiadási kapuk

A kiadás csak akkor folytatódik, ha mind a négy belépési oldal létezik, helyes nyelvi attribútummal, viewporttal, fejléccel, menügombbal és navigációval rendelkezik; nincs duplikált HTML-azonosító; minden `data-v` navigációs gombhoz tartozik nézet; a holdgrafika jelen van; a kritikus CSS/JS fájlok léteznek; a végső javítórétegek be vannak injektálva; nem maradt relatív CSS- vagy JavaScript-útvonal.

## Eredmény

A javított szerkezet egységes sötétzöld–arany vizuális rendszert használ. A fejléc minden nézetben felül marad, a belépő box sötét, a hold nincs dekorációval lefedve, a menü és a nézetváltás önállóan működik, a magyar és angol oldalak azonos technikai és hozzáférhetőségi követelmények szerint kerülnek kiadásra.
