#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'wikidata-entity-registry.json'
EXPECTED = {
    'Q56391118': 'norbert-banhalmi',
    'Q138425941': 'banhalmi-organization',
    'Q138413481': 'amcham-austria',
    'Q138717398': 'euforia-project',
    'Q124488292': 'peter-magyar',
    'Q1781': 'budapest',
    'Q28': 'hungary',
}
errors = []
if not REGISTRY.exists():
    errors.append('wikidata-entity-registry.json is missing')
else:
    data = json.loads(REGISTRY.read_text(encoding='utf-8'))
    entities = data.get('entities', {})
    for qid, key in EXPECTED.items():
        item = entities.get(key)
        if not item:
            errors.append(f'missing entity {key}')
            continue
        if not str(item.get('wikidata', '')).endswith('/' + qid):
            errors.append(f'{key}: wrong or missing {qid}')
    for key, item in entities.items():
        url = str(item.get('wikidata', ''))
        if not re.fullmatch(r'https://www\.wikidata\.org/wiki/Q\d+', url):
            errors.append(f'{key}: malformed Wikidata URL')

archive = ROOT / 'archive-record-registry.json'
if archive.exists():
    data = json.loads(archive.read_text(encoding='utf-8'))
    if data.get('creatorWikidata') != 'https://www.wikidata.org/wiki/Q56391118':
        errors.append('archive registry missing creator Wikidata')
    if data.get('publisherWikidata') != 'https://www.wikidata.org/wiki/Q138425941':
        errors.append('archive registry missing publisher Wikidata')
    euforia = [r for r in data.get('records', []) if 'euforia' in str(r.get('slug', '')).lower()]
    if not euforia:
        errors.append('no EUFÓRIA records found')
    for record in euforia:
        if 'https://www.wikidata.org/wiki/Q138717398' not in record.get('sameAs', []):
            errors.append(f"{record.get('id')}: missing EUFÓRIA Wikidata")
        if 'https://www.wikidata.org/wiki/Q124488292' not in record.get('about', []):
            errors.append(f"{record.get('id')}: missing depicted-person Wikidata")
else:
    errors.append('archive-record-registry.json missing before Wikidata audit')

if errors:
    print('WIKIDATA ENTITY ALIGNMENT AUDIT FAILED')
    for error in errors:
        print('-', error)
    sys.exit(1)
print(f'WIKIDATA ENTITY ALIGNMENT AUDIT PASSED: {len(EXPECTED)} verified identifiers')
