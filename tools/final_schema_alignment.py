#!/usr/bin/env python3
from datetime import date
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PERSON_ID = 'https://www.banhalmi.art/norbert-banhalmi#person'
PROFILE_URL = 'https://www.banhalmi.art/norbert-banhalmi'
TODAY = date.today().isoformat()

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


def replace_meta(source: str, attribute: str, name: str, value: str) -> str:
    pattern = rf'(<meta\s+{attribute}=["\']{re.escape(name)}["\']\s+content=["\'])[^"\']*(["\'])'
    return re.sub(pattern, lambda m: m.group(1) + value + m.group(2), source, count=1, flags=re.I)


def align_person_same_as(source: str) -> str:
    own_sites = {
        'https://www.norbertbanhalmi.com/',
        'https://www.banhalmi.art/',
        'https://www.banhalminorbert.hu/',
        'https://www.banhalmi.at/',
        'https://blog.banhalmi.art/',
    }

    def replace_json_ld(match: re.Match) -> str:
        try:
            data = json.loads(match.group(2))
        except json.JSONDecodeError:
            return match.group(0)
        graph = data.get('@graph', []) if isinstance(data, dict) else []
        changed = False
        for node in graph:
            if not isinstance(node, dict) or node.get('@type') != 'Person' or node.get('@id') != PERSON_ID:
                continue
            same_as = node.get('sameAs', [])
            filtered = [url for url in same_as if url not in own_sites]
            if filtered != same_as:
                node['sameAs'] = filtered
                changed = True
        if not changed:
            return match.group(0)
        encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        return match.group(1) + encoded + match.group(3)

    return re.sub(
        r'(<script[^>]+type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)',
        replace_json_ld,
        source,
        flags=re.I | re.S,
    )

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
    s = align_person_same_as(s)

    # Align WebPage schema with visible metadata and the central curatorial thesis.
    s = re.sub(
        r'("@type":\["WebPage","CollectionPage"\],"@id":"[^"]+#webpage","url":"[^"]+","name":")[^"]*(","headline":")[^"]*(","description":")[^"]*',
        lambda m: m.group(1) + meta['title'] + m.group(2) + meta['title'] + m.group(3) + meta['description'],
        s,
        count=1,
    )

    # Keep Open Graph and Twitter cards consistent with the same page identity.
    s = replace_meta(s, 'property', 'og:title', meta['title'])
    s = replace_meta(s, 'property', 'og:description', meta['description'])
    s = replace_meta(s, 'property', 'og:image:alt', meta['title'])
    s = replace_meta(s, 'name', 'twitter:title', meta['title'])
    s = replace_meta(s, 'name', 'twitter:description', meta['description'])
    s = replace_meta(s, 'name', 'twitter:image:alt', meta['title'])

    # Build date is generated from the actual production run.
    s = re.sub(r'"dateModified":"[0-9]{4}-[0-9]{2}-[0-9]{2}"',
               f'"dateModified":"{TODAY}"', s, count=1)

    if s != original:
        p.write_text(s, encoding='utf-8')
        changed.append(rel)

print(f'Aligned schema and social metadata in {len(changed)} home pages.')
for rel in changed:
    print(rel)
