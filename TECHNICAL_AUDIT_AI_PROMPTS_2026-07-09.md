# Teljes technikai audit és AI-prompt bővítés

Dátum: 2026-07-09

## Elvégzett ellenőrzések

- Magyar és angol JavaScript szintaxisellenőrzés (`node --check`): hibamentes.
- HTML script- és stílushivatkozások ellenőrzése.
- Duplikált HTML-azonosítók ellenőrzése.
- Kriptográfiai randomforrás ellenőrzése; `Math.random()` nincs használatban.
- Lexikon-, üst-, kártya-, tisztítási és SVT-inga folyamatok kódútjainak áttekintése.
- A promptok biztonságos HTML-beillesztése és vágólapkezelése.
- Mobilos promptmező és másolásgomb reszponzív stílusa.

## Beépített AI-promptok

Minden releváns eredmény alatt lenyitható, egy gombbal másolható prompt található:

- normál üstből húzott lapok;
- fordított lapok;
- árny- és kötéslapok;
- „Minden rendben” lezáró eredmény;
- az SVT-alapú inga minden feltárt programja és tisztítási eredménye.

A prompt automatikusan tartalmazza:

- a rendszer közérthető leírását;
- az eszköz és folyamat nevét;
- az eredeti kérdést vagy fókuszt;
- a vetés vagy ingaülés típusát;
- az aktuális lap/program nevét és jelentését;
- a gyakorlatot, tisztítást vagy korrekciót;
- az ugyanabban a folyamatban korábban megjelent eredményeket;
- földelt elemzési utasításokat;
- egyértelmű jelzést arról, hogy a tartalom önreflexiós metafora, nem diagnózis vagy objektív természetfeletti állítás.

## Technikai megoldás

- Egy közös promptépítő állítja össze a kontextust.
- A promptok csak a felhasználó böngészőjében készülnek el; nem kerülnek automatikusan külső szolgáltatóhoz.
- A másolás a meglévő vágólap-segédfüggvényt használja.
- Minden prompt külön az adott eredményhez tartozik, miközben megkapja a teljes addigi folyamat rövid előzménysorát.
- A komponens billentyűzettel elérhető natív `details/summary` elemet használ.

## Megjegyzés

Az AI-prompt szándékosan kéri a spekuláció és a hasznos önismereti felismerés elkülönítését, valamint azt, hogy egészségügyi, pszichológiai, jogi, pénzügyi vagy terápiás kérdésben szakember támogatását részesítse előnyben.
