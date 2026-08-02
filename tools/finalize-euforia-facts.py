from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SELF = Path(__file__).resolve()

REPLACEMENTS = {
    "hu/exhibitions/euforia.html": [
        (
            "Az EUFÓRIA első alkotása. Amikor szabad licenccel feltöltöttem, titkon bíztam benne, hogy van benne saját élet — láttam az előzményeit. Aztán kitört minden buborékból: több mint tizennégy Wikipédia-nyelv vezető képe lett, a közösség Magyarország miniszterelnökének hivatalos portréjául választotta, a Wikimedia védett státuszba tette, és bejárta a legkülönbözőbb politikai színezetű lapokat. Elengedtem egy képet, a többit elvégezte a világ.",
            "Az EUFÓRIA első alkotása. Amikor szabad licenccel feltöltöttem, abban bíztam, hogy a kép önálló életre kelhet. A Wikimedia Commons minőségi képként tartja nyilván, több Wikipédia-nyelvi változat használja Magyar Péter portréjaként, és a Wikidata képei között is szerepel. Elengedtem egy képet, a folytatást a nyilvánosság és a közösségi felhasználás története alakította.",
        ),
        (
            '<li><strong>2026.05.10.</strong> — A Wikipédia közössége Magyarország miniszterelnökének hivatalos portréjául választja.</li>',
            '<li><strong>2026. május</strong> — A kép több Wikipédia-nyelvi változatban Magyar Péter vezető portréjaként jelenik meg, és a Wikidata képei között is szerepel.</li>',
        ),
    ],
    "exhibitions/euforia.html": [
        (
            "The first work of EUFÓRIA. When I uploaded it under a free licence I secretly hoped it had a life of its own in it — I had seen the signs. Then it broke out of every bubble: it became the lead image of more than fourteen Wikipedia language editions, the community chose it as the official portrait of Hungary&#x27;s Prime Minister, Wikimedia placed it under protected status, and it travelled through publications of every political colour. I let one picture go free, and the world did the rest.",
            "The first work of EUFÓRIA. When I released it under a free licence, I hoped the image could acquire a life of its own. Wikimedia Commons lists it as a Quality Image, multiple Wikipedia language editions use it as a portrait of Péter Magyar, and it also appears among the images on his Wikidata item. I released one image, and public and community use shaped what followed.",
        ),
        (
            '<li><strong>10.05.2026</strong> — The Wikipedia community selects it as the official portrait of Hungary&#x27;s Prime Minister.</li>',
            '<li><strong>May 2026</strong> — The image appears as a lead portrait of Péter Magyar in multiple Wikipedia language editions and among the images on his Wikidata item.</li>',
        ),
    ],
    "de-at/exhibitions/euforia.html": [
        (
            "Die erste Arbeit von EUFÓRIA. Als ich sie unter freier Lizenz hochlud, hoffte ich insgeheim, dass ein Eigenleben in ihr steckt — die Zeichen hatte ich gesehen. Dann brach sie aus jeder Blase aus: Sie wurde zum Leitbild von mehr als vierzehn Wikipedia-Sprachversionen, die Gemeinschaft wählte sie zum offiziellen Porträt des ungarischen Ministerpräsidenten, Wikimedia stellte sie unter Schutzstatus, und sie reiste durch Publikationen aller politischen Farben. Ich ließ ein Bild frei, und die Welt erledigte den Rest.",
            "Die erste Arbeit von EUFÓRIA. Als ich sie unter freier Lizenz veröffentlichte, hoffte ich, dass das Bild ein Eigenleben entwickeln könnte. Wikimedia Commons führt es als Qualitätsbild, mehrere Wikipedia-Sprachversionen verwenden es als Porträt von Péter Magyar, und es erscheint auch unter den Bildern seines Wikidata-Eintrags. Ich ließ ein Bild frei; seine weitere Geschichte formten Öffentlichkeit und gemeinschaftliche Nutzung.",
        ),
        (
            '<li><strong>10.05.2026</strong> — Die Wikipedia-Gemeinschaft wählt es zum offiziellen Porträt des ungarischen Ministerpräsidenten.</li>',
            '<li><strong>Mai 2026</strong> — Das Bild erscheint in mehreren Wikipedia-Sprachversionen als führendes Porträt von Péter Magyar und unter den Bildern seines Wikidata-Eintrags.</li>',
        ),
    ],
}

changed = []
for relative, replacements in REPLACEMENTS.items():
    path = ROOT / relative
    text = path.read_text(encoding="utf-8")
    original = text
    for old, new in replacements:
        if old not in text:
            raise RuntimeError(f"Expected factual wording not found in {relative}: {old[:80]}")
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    if text != original:
        changed.append(relative)

SELF.unlink(missing_ok=True)
print(f"Corrected EUFÓRIA factual wording on {len(changed)} pages.")
