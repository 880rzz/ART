# Haptikus visszajelzés – 2026-07-09

- Finom rezgés a vetés, ingaülés, tükörvizsgálat és tisztítás indításakor.
- Külön rezgésminta a lépésekhez, eredmény megjelenéséhez, tisztításhoz és lezáráshoz.
- A funkció csak felhasználói kattintás és látható böngészőlap mellett működik.
- Támogatás hiányában automatikusan, hiba nélkül kikapcsol.
- Programozott API: `CeridwenHaptics.vibrate('start'|'step'|'reveal'|'cleanse'|'complete')`.
- Kikapcsolható: `CeridwenHaptics.setEnabled(false)`; a beállítás helyben megmarad.

Megjegyzés: a webes Vibration API Android Chromium-alapú böngészőkön általában működik. Safari és iOS jelenleg nem biztosítja ezt a webes API-t, ezért iPhone-on a weboldalból nem garantálható a rezgőmotor elérése.
