#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PERSON_ID = 'https://www.banhalmi.art/norbert-banhalmi#person'
PROFILE_URL = 'https://www.banhalmi.art/norbert-banhalmi'

HOME_META = {
    'index.html': {
        'title': 'Norbert Bánhalmi — The Anatomy of Presence | Official Art Archive',
        'description': 'The official archive of Norbert Bánhalmi’s oeuvre since 1999, organised around the investigation of presence through photography, books, exhibitions, moving image and public reception.',
    },
    'hu/index.html': {
        'title': 'Bánhalmi Norbert — A jelenlét anatómiája | Hivatalos művészeti archívum',
        'description': 'Bánhalmi Norbert 1999 óta épülő életművének hivatalos archívuma: a jelenlét kutatása fényképeken, könyveken, kiállításokon, mozgóképen és nyilvános recepción keresztül.',
    },
    'de-at/index.html': {
        'title': 'Norbert Bánhalmi — Die Anatomie der Präsenz | Offizielles Kunstarchiv',
        'description': 'Das offizielle Archiv des Werks von Norbert Bánhalmi seit 1999, geordnet als Erforschung der Präsenz in Fotografie, Büchern, Ausstellungen, Bewegtbild und öffentlicher Rezeption.',
    },
}

changed = []
for rel, meta in HOME_META.items():
    p = ROOT / rel
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    original = s

    # The art archive owns the canonical Person profile; the commercial site remains worksFor/publisher.
    s = s.replace(f'"@id":"{PERSON_ID}","url":"https://www.norbertbanhalmi.com/about/"',
                  f'"@id":"{PERSON_ID}","url":"{PROFILE_URL}"')

    # Align WebPage schema with visible metadata and the central curatorial thesis.
    s = re.sub(
        r'("@type":\["WebPage","CollectionPage"\],"@id":"[^"]+#webpage","url":"[^"]+","name":")[^"]*(","headline":")[^"]*(","description":")[^"]*',
        lambda m: m.group(1) + meta['title'] + m.group(2) + meta['title'] + m.group(3) + meta['description'],
        s,
        count=1,
    )

    # Keep share-image alternative text consistent with the new page identity.
    s = re.sub(r'(<meta property="og:image:alt" content=")[^"]*(">)',
               lambda m: m.group(1) + meta['title'] + m.group(2), s, count=1)

    # Build date is the archive publication date, not a manually frozen historical value.
    s = re.sub(r'"dateModified":"[0-9]{4}-[0-9]{2}-[0-9]{2}"',
               '"dateModified":"2026-07-27"', s, count=1)

    if s != original:
        p.write_text(s, encoding='utf-8')
        changed.append(rel)

print(f'Aligned schema and social metadata in {len(changed)} home pages.')
for rel in changed:
    print(rel)
