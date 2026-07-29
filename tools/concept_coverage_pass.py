#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PERSON_ID = 'https://www.banhalmi.art/norbert-banhalmi#person'
PROFILE_URL = 'https://www.banhalmi.art/norbert-banhalmi'

# Facts, links and narrative pillars agreed for the archive. This registry is deliberately
# explicit so future generators cannot silently discard source material.
REGISTRY = {
    'concept': {
        'name': 'The Anatomy of Presence',
        'since': 1999,
        'pillars': [
            'first-person human voice',
            'presence as the continuous curatorial question',
            'complete homepage curatorial selection',
            'books, exhibitions, moving image, press and community as one oeuvre',
            'art archive separated from the commercial service website',
        ],
    },
    'canonicalEntity': {
        '@id': PERSON_ID,
        'profile': PROFILE_URL,
        'wikidata': 'https://www.wikidata.org/wiki/Q56391118',
        'wikipedia': 'https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert',
        'commons': 'https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=Norbert%20Banhalmi',
    },
    'institutionalLinks': [
        {'name': 'OM SYSTEM ambassador network', 'url': 'https://www.milcclub.com/ambassadors'},
        {'name': 'Hungarian World Federation of Photographic Artists', 'url': 'https://www.mfvsz.com/hu/tagsag/'},
        {'name': 'WKO Vienna photographers', 'url': 'https://www.wko.at/'},
        {'name': 'AmCham Austria', 'url': 'https://amcham.at/'},
        {'name': 'BANHALMI professional practice', 'url': 'https://www.norbertbanhalmi.com/'},
    ],
    'documentaryHubs': [
        {'name': 'Press archive', 'url': 'https://www.banhalmi.art/press.html'},
        {'name': 'Moving-image archive', 'url': 'https://www.youtube.com/@norbert.banhalmi/playlists'},
        {'name': 'Péter Magyar portrait, Wikimedia Commons', 'url': 'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg'},
        {'name': 'EUFÓRIA project record', 'url': 'https://www.banhalmi.art/exhibitions/euforia.html'},
    ],
    'biographicalStories': [
        'Budapest, 1979; working between Vienna and Budapest',
        'engineering and communication background',
        'founding the Hungarian Defence Forces photo studio',
        'New York studies and international chapter',
        'the Greece accident as a restrained turning point',
        'OM SYSTEM ambassadorship since 2018',
        'Rege Gallery co-founding and curation',
        'Vienna community and teaching work',
    ],
    'designSystem': {
        'direction': 'Apple-like restraint and art-catalogue clarity',
        'gold': '#B79C44',
        'rules': ['no italics', 'dark backgrounds with readable contrast', 'compact hero', 'calm spacing', 'mobile-first hierarchy'],
    },
}

changed = []
for p in ROOT.rglob('*.html'):
    rel = p.relative_to(ROOT)
    if any(part in {'.git', 'node_modules', 'dist'} for part in rel.parts) or rel.parts[:2] == ('data', 'archive'):
        continue
    s = p.read_text(encoding='utf-8')
    original = s
    s = s.replace(f'"@id":"{PERSON_ID}","url":"https://www.norbertbanhalmi.com/about/"',
                  f'"@id":"{PERSON_ID}","url":"{PROFILE_URL}"')
    if s != original:
        p.write_text(s, encoding='utf-8')
        changed.append(rel.as_posix())

# Preserve the source registry as a machine-readable archive resource.
registry_path = ROOT / 'concept-source-registry.json'
registry_path.write_text(json.dumps(REGISTRY, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Expand the compact source map without pretending every source is independent evidence.
source_map_path = ROOT / 'archive-source-map.json'
if source_map_path.exists():
    data = json.loads(source_map_path.read_text(encoding='utf-8'))
    data['conceptRegistry'] = '/concept-source-registry.json'
    existing = {item.get('url') for item in data.get('sources', []) if isinstance(item, dict)}
    additions = [
        {'name': 'Press and moving-image archive', 'url': '/press.html', 'description': 'Curated public record with source links and audiovisual documentation'},
        {'name': 'Community and teaching record', 'url': '/community.html', 'description': 'Community-building, curation, education and social responsibility'},
        {'name': 'Writing and ambassadorship record', 'url': '/writing.html', 'description': 'Professional writing, institutional links and ambassador activity'},
        {'name': 'Curatorial dossier', 'url': '/curators.html', 'description': 'The complete curatorial proposition and oeuvre context'},
        {'name': 'Péter Magyar portrait source record', 'url': 'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg', 'description': 'Externally hosted source and authorship record for the 2026 portrait'},
    ]
    data.setdefault('sources', []).extend(item for item in additions if item['url'] not in existing)
    source_map_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Coverage is measured against actual repository text, not declared by hand.
all_text = '\n'.join(
    p.read_text(encoding='utf-8', errors='ignore')
    for p in ROOT.rglob('*')
    if p.is_file() and p.suffix.lower() in {'.html', '.json', '.txt'} and '.git' not in p.parts
)
checks = {
    'presenceThesis': ['A jelenlét kutatása', 'The investigation of presence', 'Die Erforschung der Präsenz'],
    'completeGallery': ['data-total="131"', 'numberOfItems":131'],
    'pressArchive': ['Presence in the public record', 'numberOfItems":27'],
    'peterMagyarPortrait': ['Peter-Magyar-portrait-2026.jpg', 'EUFÓRIA'],
    'entityIdentity': [PERSON_ID, 'Q56391118'],
    'community': ['Community & Teaching', 'Be Smart Kids Club'],
    'books': ['978-963-12-8663-2', '9786150000534', '978-615-00-1829-4'],
    'design': ['#B79C44', 'presence-core.css'],
}
coverage = {name: {'present': all(token in all_text for token in tokens), 'tokens': tokens} for name, tokens in checks.items()}
report = {
    'generatedBy': 'tools/concept_coverage_pass.py',
    'summary': {
        'covered': sum(1 for item in coverage.values() if item['present']),
        'total': len(coverage),
    },
    'coverage': coverage,
    'knownEditorialRisks': [
        'Some press records still use publisher homepages where the exact historical article URL is unavailable.',
        'Image-specific descriptions after the individually documented gallery images remain intentionally non-invented archive labels.',
        'Institutional membership and award claims must remain tied to verifiable source pages when richer source URLs become available.',
    ],
}
(ROOT / 'concept-coverage-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print(f'Concept coverage pass updated {len(changed)} HTML files and refreshed source registries.')
