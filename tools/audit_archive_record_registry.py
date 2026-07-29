#!/usr/bin/env python3
from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'archive-record-registry.json'
errors=[]
if not path.exists():
    errors.append('archive-record-registry.json is missing')
else:
    data=json.loads(path.read_text(encoding='utf-8'))
    records=data.get('records',[])
    if data.get('concept') != 'The investigation of presence':
        errors.append('registry concept drifted from the investigation of presence')
    if data.get('origin') != 'MOL Project':
        errors.append('MOL Project is no longer the declared origin')
    if data.get('recordCount') != len(records):
        errors.append('recordCount does not match records length')
    if len(records) < 60:
        errors.append(f'too few canonical records: {len(records)}')
    ids=set(); canonicals=set(); languages=set(); periods=set(); kinds=set()
    for r in records:
        rid=r.get('id'); url=r.get('canonicalUrl')
        if not rid or rid in ids: errors.append(f'missing or duplicate id: {rid}')
        ids.add(rid)
        if not url or url in canonicals: errors.append(f'missing or duplicate canonical URL: {url}')
        canonicals.add(url)
        for key in ('title','description','language','type','presenceResearchPeriod','creator','isPartOf','factualStatus'):
            if not r.get(key): errors.append(f'{url}: missing {key}')
        languages.add(r.get('language')); periods.add(r.get('presenceResearchPeriod')); kinds.add(r.get('type'))
        if r.get('factualStatus') != 'verified-record-with-separated-interpretation':
            errors.append(f'{url}: factual/interpretive boundary missing')
        if r.get('creator') != 'https://www.banhalmi.art/norbert-banhalmi#person':
            errors.append(f'{url}: creator entity drift')
    if languages != {'en','hu','de-AT'}: errors.append(f'language coverage incomplete: {sorted(languages)}')
    # MOL is the self-initiated origin, not a book or exhibition record.
    # Canonical public records must cover the four documented periods II–V.
    if not {'II','III','IV','V'}.issubset(periods): errors.append(f'documented-period coverage incomplete: {sorted(periods)}')
    if 'I' in periods: errors.append('MOL origin must not be represented as a public book/exhibition evidence record')
    if kinds != {'Book','ExhibitionEvent'}: errors.append(f'record type coverage incomplete: {sorted(kinds)}')

if errors:
    print('ARCHIVE RECORD REGISTRY AUDIT FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('ARCHIVE RECORD REGISTRY AUDIT PASSED: self-initiated origin plus documented periods II–V')
