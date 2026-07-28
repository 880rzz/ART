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
    'Q138416887': 'vipach',
    'Q138414682': 'rege-gallery',
    'Q138413788': 'focus-education',
    'Q941534': 'dennis-gabor-university',
    'Q1109408': 'new-york-institute-of-photography',
    'Q1781': 'budapest',
    'Q1741': 'vienna',
    'Q28': 'hungary',
    'Q138458277': 'the-great-rescue',
    'Q138426842': 'awakening-book',
    'Q138426876': 'womans-world-book',
    'Q138454278': 'milestone-56',
    'Q138454296': 'hungarian-women-new-york',
    'Q138454309': 'awakening-exhibition',
    'Q138454318': 'balerina-project-new-york',
    'Q138454332': 'the-mens-dream',
    'Q138454346': 'the-frame',
    'Q138454365': 'touch',
    'Q138454422': 'different-in-a-different-way',
    'Q138454436': 'i-became-a-father',
    'Q138667343': 'meses-konyv',
    'Q138667529': 'szosszenetek-book',
    'Q138717398': 'euforia-project',
    'Q124488292': 'peter-magyar',
}
EXPECTED_RECORDS = {
    'book-ebredes': 'Q138426842',
    'book-anovilaga': 'Q138426876',
    'book-szosszenetek': 'Q138667529',
    'merfoldkovek1956': 'Q138454278',
    'fotokiallitas3': 'Q138454296',
    'ebredes': 'Q138454309',
    'balerina-project-new-york': 'Q138454318',
    'themensdream': 'Q138454332',
    'theframe': 'Q138454346',
    'touch-wien': 'Q138454365',
    'mas-kepp-mas': 'Q138454422',
    'fotokiallitas5': 'Q138454436',
    'euforia': 'Q138717398',
}
errors = []
entities = {}
if not REGISTRY.exists():
    errors.append('wikidata-entity-registry.json is missing')
else:
    data = json.loads(REGISTRY.read_text(encoding='utf-8'))
    if data.get('sourceEntity') != 'https://www.wikidata.org/wiki/Q56391118':
        errors.append('registry sourceEntity is not Q56391118')
    entities = data.get('entities', {})
    for qid, key in EXPECTED.items():
        item = entities.get(key)
        if not item:
            errors.append(f'missing entity {key}')
            continue
        if not str(item.get('wikidata', '')).endswith('/'+qid):
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
    required_affiliations = {'Q138413481','Q138416887','Q138414682'}
    actual_affiliations = {x.rsplit('/',1)[-1] for x in data.get('affiliationsWikidata', [])}
    if not required_affiliations.issubset(actual_affiliations):
        errors.append('archive registry missing one or more affiliation Wikidata entities')
    records = data.get('records', [])
    for slug, qid in EXPECTED_RECORDS.items():
        matches = [r for r in records if str(r.get('slug','')).lower() == slug]
        if not matches:
            errors.append(f'archive record missing for {slug}')
            continue
        for record in matches:
            if f'https://www.wikidata.org/wiki/{qid}' not in record.get('sameAs', []):
                errors.append(f"{record.get('id')}: missing {qid}")
    # EUFÓRIA itself must not be declared as being about one depicted person.
    for record in [r for r in records if str(r.get('slug','')).lower() == 'euforia']:
        if 'https://www.wikidata.org/wiki/Q124488292' in record.get('about', []):
            errors.append(f"{record.get('id')}: project-level about incorrectly points to Péter Magyar")
else:
    errors.append('archive-record-registry.json missing before Wikidata audit')

if errors:
    print('WIKIDATA ENTITY ALIGNMENT AUDIT FAILED')
    for error in errors:
        print('-', error)
    sys.exit(1)
print(f'WIKIDATA ENTITY ALIGNMENT AUDIT PASSED: {len(EXPECTED)} entities from Q56391118')