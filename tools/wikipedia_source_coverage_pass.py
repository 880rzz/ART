#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "data" / "wikipedia-source-inventory.json"
MASTER_INPUT = ROOT / "wikipedia-source-registry.json"

VIDEO_TITLES = {
    "AfK29ELPWBY": {
        "en": "Fifty Shades of Woman — exhibition film",
        "hu": "A Nő 50 árnyalata — kiállítási film",
        "de": "Fünfzig Schattierungen der Frau — Ausstellungsfilm",
    },
    "rkSlrX6kEyg": {
        "en": "Awakening — The New Beginning! — exhibition interview",
        "hu": "Ébredés – az Új kezdet! — kiállítási interjú",
        "de": "Erwachen – Der neue Anfang! — Ausstellungsinterview",
    },
    "Q9vXitVpo7Y": {
        "en": "Milestones ’56 — portraits and life stories",
        "hu": "Mérföldkövek ’56 — portrék és életutak",
        "de": "Meilensteine ’56 — Porträts und Lebenswege",
    },
    "zCHkRlv-ZB0": {
        "en": "Person of the Week — conversation with Andor Schmuck",
        "hu": "A Hét Embere — beszélgetés Schmuck Andorral",
        "de": "Mensch der Woche — Gespräch mit Andor Schmuck",
    },
    "nyKyRWrtn7Q": {
        "en": "Retouched cover photographs and impossible ideals",
        "hu": "Retusált címlapfotók és nem létező ideálok",
        "de": "Retuschierte Titelfotos und unerreichbare Ideale",
    },
    "ch66zZp4--w": {
        "en": "The fourth Budapest photography contest — report",
        "hu": "A IV. Budapesti Fotósviadal — beszámoló",
        "de": "Der vierte Budapester Fotowettbewerb — Bericht",
    },
    "npJ6YeYxQ64": {
        "en": "Awakening — a twenty-year artistic reflection",
        "hu": "Ébredés — húsz év művészi távlatából",
        "de": "Erwachen — eine künstlerische Reflexion nach zwanzig Jahren",
    },
    "ZzZj0ompifI": {
        "en": "Everything that can happen to a woman — interview",
        "hu": "Minden, ami egy nővel megtörténhet — interjú",
        "de": "Alles, was einer Frau widerfahren kann — Interview",
    },
}

VIDEO_DESCRIPTIONS = {
    "AfK29ELPWBY": {
        "en": "A moving-image record of the exhibition examining the many emotional and social roles carried by women.",
        "hu": "Mozgóképes dokumentum a kiállításról, amely a női lét érzelmi és társadalmi szerepeit vizsgálta.",
        "de": "Eine filmische Dokumentation der Ausstellung über die emotionalen und gesellschaftlichen Rollen von Frauen.",
    },
    "rkSlrX6kEyg": {
        "en": "An interview made around Awakening, where illness, recovery and returning to one’s own body become a shared story.",
        "hu": "Az Ébredés kapcsán készült interjú betegségről, felépülésről és a saját testhez való visszatalálásról.",
        "de": "Ein Interview zu Erwachen über Krankheit, Genesung und die Rückkehr in den eigenen Körper.",
    },
    "Q9vXitVpo7Y": {
        "en": "Portraits and life stories from the Hungarian émigré community make the memory of 1956 present in New York.",
        "hu": "Az amerikai magyar emigráció portréi és életútjai teszik jelen idejűvé 1956 emlékezetét New Yorkban.",
        "de": "Porträts und Lebenswege der ungarischen Emigration in den USA vergegenwärtigen die Erinnerung an 1956 in New York.",
    },
    "zCHkRlv-ZB0": {
        "en": "A public conversation that preserves a personal chapter of the oeuvre’s reception and contemporary context.",
        "hu": "Nyilvános beszélgetés, amely az életmű fogadtatásának és korabeli közegének egy személyes fejezetét őrzi.",
        "de": "Ein öffentliches Gespräch als persönliches Zeugnis der Rezeption und des zeitgenössischen Umfelds des Lebenswerks.",
    },
    "nyKyRWrtn7Q": {
        "en": "A discussion of retouching, cover imagery and the distance between lived bodies and manufactured visual ideals.",
        "hu": "Beszélgetés a retusról, a címlapképekről és a megélt testek, valamint a gyártott vizuális ideálok távolságáról.",
        "de": "Ein Gespräch über Retusche, Titelbilder und die Distanz zwischen gelebten Körpern und konstruierten Bildidealen.",
    },
    "ch66zZp4--w": {
        "en": "A contemporary report from the Budapest photography contest, documenting an early public and professional context.",
        "hu": "Korabeli beszámoló a Budapesti Fotósviadalról, az életmű egyik korai nyilvános és szakmai közegéből.",
        "de": "Ein zeitgenössischer Bericht vom Budapester Fotowettbewerb als Dokument eines frühen öffentlichen und professionellen Umfelds.",
    },
    "npJ6YeYxQ64": {
        "en": "A later reflection on Awakening and on how the meaning of a vulnerable photographic encounter changes over time.",
        "hu": "Későbbi visszatekintés az Ébredésre és arra, hogyan változik az időben egy sérülékeny fotográfiai találkozás jelentése.",
        "de": "Eine spätere Reflexion über Erwachen und darüber, wie sich die Bedeutung einer verletzlichen fotografischen Begegnung verändert.",
    },
    "ZzZj0ompifI": {
        "en": "A Mindennap Könyv interview about The World of Woman and the life transitions held together by the book.",
        "hu": "A Mindennap Könyv interjúja A Nő világa kötetről és a könyvben összekapcsolódó női életfordulókról.",
        "de": "Ein Interview von Mindennap Könyv über Die Welt der Frau und die im Buch verbundenen Übergänge weiblicher Lebenswege.",
    },
}

LANG = {
    "press.html": {
        "key": "en",
        "note": "YouTube · verified from the current Wikipedia source list",
        "inventory": "Complete Wikipedia source inventory",
        "inventory_desc": "The full, deduplicated list of valid sources cited by the current biographical record.",
    },
    "hu/press.html": {
        "key": "hu",
        "note": "YouTube · a jelenlegi Wikipédia-forrásjegyzék alapján ellenőrizve",
        "inventory": "Teljes Wikipédia-forrásjegyzék",
        "inventory_desc": "A jelenlegi életrajzi rekordban hivatkozott érvényes források teljes, deduplikált listája.",
    },
    "de-at/press.html": {
        "key": "de",
        "note": "YouTube · anhand der aktuellen Wikipedia-Quellenliste geprüft",
        "inventory": "Vollständiges Wikipedia-Quellenverzeichnis",
        "inventory_desc": "Die vollständige, deduplizierte Liste gültiger Quellen des aktuellen biografischen Eintrags.",
    },
}


def classify(url):
    host = urlparse(url).netloc.lower()
    path = urlparse(url).path.lower()
    if "youtube.com" in host or "youtu.be" in host:
        return "VideoObject", ["moving-image", "public-reception"]
    if any(token in host for token in ("libri.hu", "noiegeszsegcentrum.hu")):
        return "BookSource", ["books", "publication-history"]
    if any(token in host for token in ("amcham", "mfvsz", "fenykepeszkor", "wko.at", "milcclub", "magyariskola", "vipach")):
        return "InstitutionalSource", ["memberships", "education", "institutions"]
    if any(token in host for token in ("facebook.com", "instagram.com")):
        return "SocialProfile", ["person", "public-profile"]
    if "banhalmi.art" in host or "norbertbanhalmi.com" in host:
        return "PrimarySource", ["official-archive", "projects"]
    if "web.archive.org" in host:
        return "ArchivedArticle", ["press", "historic-documentation"]
    if any(token in path for token in ("kiallitas", "gallery", "galeria")):
        return "ExhibitionSource", ["exhibitions", "public-reception"]
    return "Article", ["press", "public-reception"]


inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
records = []
for index, url in enumerate(inventory["sources"], 1):
    source_type, supports = classify(url)
    records.append({
        "id": f"wikipedia-source-{index:03d}",
        "url": url,
        "type": source_type,
        "supports": supports,
        "provenance": "current-hungarian-wikipedia",
        "language": "hu" if ".hu" in urlparse(url).netloc or "hu/" in url else None,
    })

registry = {
    "name": inventory["name"],
    "sourcePage": inventory["sourcePage"],
    "checkedAt": inventory["checkedAt"],
    "policy": inventory["policy"],
    "sourceCount": len(records),
    "sources": records,
    "excludedSources": inventory["excludedSources"],
}
MASTER_INPUT.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

exact_replacements = {
    "https://mandiner.hu/": "https://mandiner.hu/kultura/2016/10/papp-laszlo-1956-interju-epiteszet-forradalom",
    "https://mindennapkonyv.hu/": "https://mindennapkonyv.hu/mindennapi/olvastuk/a-noi-let-kilenc-fordulopontja-banhalmi-norbert-a-no-vilaga",
}

canonical_url_patterns = {
    r'https://mandiner\.hu/(?:kultura/2016/10/papp-laszlo-1956-interju-epiteszet-forradalom)+':
        exact_replacements["https://mandiner.hu/"],
    r'https://mindennapkonyv\.hu/(?:mindennapi/olvastuk/a-noi-let-kilenc-fordulopontja-banhalmi-norbert-a-no-vilaga)+':
        exact_replacements["https://mindennapkonyv.hu/"],
}

for relative, labels in LANG.items():
    path = ROOT / relative
    html = path.read_text(encoding="utf-8")
    for pattern, canonical in canonical_url_patterns.items():
        html = re.sub(pattern, canonical, html)
    for old, new in exact_replacements.items():
        html = html.replace(f'href="{old}"', f'href="{new}"')
    video_cards = []
    for video_id, titles in VIDEO_TITLES.items():
        url = f"https://www.youtube.com/watch?v={video_id}"
        source_note = f'{titles[labels["key"]]} · {labels["note"]}'
        if url in html:
            title_pattern = rf'(<article class="item"(?: id="[^"]+")?><a href="{re.escape(url)}"[^>]*>).*?(</a>)'
            html = re.sub(title_pattern, rf'\1{titles[labels["key"]]}\2', html, count=1)
            unique_description = VIDEO_DESCRIPTIONS[video_id][labels["key"]]
            pattern = rf'(<article class="item"(?: id="[^"]+")?><a href="{re.escape(url)}"[^>]*>.*?</a><p class="desc">).*?(</p>)'
            html = re.sub(pattern, rf'\1{unique_description}\2', html, count=1)
            note_pattern = rf'(<article class="item"(?: id="[^"]+")?><a href="{re.escape(url)}"[\s\S]*?<p class="note">).*?(</p></article>)'
            html = re.sub(note_pattern, rf'\1{source_note}\2', html, count=1)
            continue
        video_cards.append(
            f'<article class="item"><a href="{url}" target="_blank" rel="noopener">'
            f'{titles[labels["key"]]}</a><p class="desc">{VIDEO_DESCRIPTIONS[video_id][labels["key"]]}</p>'
            f'<p class="note">{source_note}</p></article>'
        )
    if video_cards:
        playlist_pattern = r'(<article class="item"(?: id="[^"]+")?><a href="https://www\.youtube\.com/@norbert\.banhalmi/playlists")'
        html, count = re.subn(playlist_pattern, "".join(video_cards) + r"\1", html, count=1)
        if count != 1:
            raise SystemExit(f"{relative}: complete playlist card not found")
    inventory_url = "/wikipedia-source-registry.json"
    if inventory_url not in html:
        marker = '</div><div class="actions">'
        card = (
            f'<a href="{inventory_url}"><strong>{labels["inventory"]}</strong>'
            f'<small>{labels["inventory_desc"]}</small></a>'
        )
        html = html.replace(marker, card + marker, 1)
    path.write_text(html, encoding="utf-8")

print(f"Wikipedia source coverage generated with {len(records)} valid sources and {len(inventory['excludedSources'])} documented exclusions.")
