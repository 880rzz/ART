#!/usr/bin/env python3
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PERSON_ID = 'https://www.banhalmi.art/norbert-banhalmi#person'
TODAY = '2026-07-27'
HOME = {
    'index.html': {
        'title': 'Norbert Bánhalmi — The Anatomy of Presence | Official Art Archive',
        'description': 'The official archive of Norbert Bánhalmi’s oeuvre since 1999, organised around the investigation of presence through photography, books, exhibitions, moving image and public reception.',
        'lang': 'en',
        'person_url': 'https://www.banhalmi.art/norbert-banhalmi',
    },
    'hu/index.html': {
        'title': 'Bánhalmi Norbert — A jelenlét anatómiája | Hivatalos művészeti archívum',
        'description': 'Bánhalmi Norbert 1999 óta épülő életművének hivatalos archívuma: a jelenlét kutatása fényképeken, könyveken, kiállításokon, mozgóképen és nyilvános recepción keresztül.',
        'lang': 'hu-HU',
        'person_url': 'https://www.banhalmi.art/hu/norbert-banhalmi',
    },
    'de-at/index.html': {
        'title': 'Norbert Bánhalmi — Die Anatomie der Präsenz | Offizielles Kunstarchiv',
        'description': 'Das offizielle Archiv des Werks von Norbert Bánhalmi seit 1999, geordnet als Erforschung der Präsenz in Fotografie, Büchern, Ausstellungen, Bewegtbild und öffentlicher Rezeption.',
        'lang': 'de-AT',
        'person_url': 'https://www.banhalmi.art/de-at/norbert-banhalmi',
    },
}

SCRIPT_RE = re.compile(r'(<script\s+type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', re.I | re.S)

def walk_nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_nodes(child)

def normalize_graph(data, meta):
    for node in walk_nodes(data):
        node_type = node.get('@type')
        types = node_type if isinstance(node_type, list) else [node_type]
        node_id = node.get('@id', '')
        if 'Person' in types and node_id == PERSON_ID:
            node['url'] = meta['person_url']
        if ('WebPage' in types or 'CollectionPage' in types) and node_id.endswith('#webpage'):
            node['name'] = meta['title']
            node['headline'] = meta['title']
            node['description'] = meta['description']
            node['inLanguage'] = meta['lang']
            node['dateModified'] = TODAY
        if 'ImageGallery' in types:
            media = node.get('associatedMedia')
            if isinstance(media, list) and len(media) > 24:
                node['associatedMedia'] = media[:24]
                node['numberOfItems'] = 24
                node['description'] = 'A curated homepage selection from the complete photographic archive. The complete record remains available through the project, exhibition and archive pages.'
    return data

def replace_jsonld(match, meta):
    raw = html.unescape(match.group(2).strip())
    try:
        data = json.loads(raw)
    except Exception:
        return match.group(0)
    data = normalize_graph(data, meta)
    return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)

def process(path, meta):
    source = path.read_text(encoding='utf-8')
    updated = SCRIPT_RE.sub(lambda m: replace_jsonld(m, meta), source)
    updated = re.sub(r'(<meta\s+property=["\']og:image:alt["\']\s+content=["\'])[^"\']*(["\'])', lambda m: m.group(1) + meta['title'] + m.group(2), updated, count=1, flags=re.I)
    if updated != source:
        path.write_text(updated, encoding='utf-8')
        return True
    return False

changed = []
for relative, meta in HOME.items():
    path = ROOT / relative
    if path.exists() and process(path, meta):
        changed.append(relative)

print(f'Archive quality pass updated {len(changed)} homepage files.')
for item in changed:
    print(item)
