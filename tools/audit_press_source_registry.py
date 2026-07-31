#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['press.html','hu/press.html','de-at/press.html']
errors = []

registry_path = ROOT / 'press-source-registry.json'
if not registry_path.exists():
    errors.append('press-source-registry.json is missing')
else:
    try:
        registry = json.loads(registry_path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'press-source-registry.json is invalid: {exc}')
        registry = {'languages': {}}

    expected = {'en':'press.html','hu':'hu/press.html','de-AT':'de-at/press.html'}
    for lang, rel in expected.items():
        path = ROOT / rel
        if not path.exists():
            errors.append(f'{rel}: missing press page')
            continue
        text = path.read_text(encoding='utf-8')
        ids = re.findall(r'<article\b[^>]*\bid="(press-\d{2})"', text, re.I)
        articles = len(re.findall(r'<article\b', text, re.I))
        if articles < 27:
            errors.append(f'{rel}: only {articles} press records; expected at least 27')
        if len(ids) != articles:
            errors.append(f'{rel}: {articles} articles but {len(ids)} deep-link ids')
        if len(set(ids)) != len(ids):
            errors.append(f'{rel}: duplicate press deep-link ids')
        expected_ids = [f'press-{i:02d}' for i in range(1, articles + 1)]
        if ids != expected_ids:
            errors.append(f'{rel}: press ids are not sequential and stable')

        data = registry.get('languages', {}).get(lang)
        if not data:
            errors.append(f'{rel}: missing {lang} registry branch')
            continue
        records = data.get('records', [])
        if data.get('recordCount') != len(records) or len(records) != articles:
            errors.append(f'{rel}: registry/page count mismatch')
        for record in records:
            for field in ('position','anchor','archiveUrl','title','sourceUrl','sourceQuality'):
                if field not in record or record[field] in ('', None):
                    errors.append(f'{rel}: record {record.get("position","?")} missing {field}')
            if record.get('sourceQuality') not in {
                'exact-source','archived-exact-source','internal-record',
                'publisher-homepage-needs-exact-url','channel-collection'
            }:
                errors.append(f'{rel}: invalid source quality on record {record.get("position","?")}')

if errors:
    print('PRESS SOURCE REGISTRY AUDIT FAILED')
    for error in errors:
        print('-', error)
    sys.exit(1)

print('PRESS SOURCE REGISTRY AUDIT PASSED')
for lang, data in registry['languages'].items():
    placeholders = [r for r in data['records'] if r['sourceQuality'] == 'publisher-homepage-needs-exact-url']
    print(f"{lang}: {len(data['records'])} records; {len(placeholders)} exact-URL research tasks")
    for item in placeholders:
        print(f"  - {item['anchor']}: {item['title']} -> {item['sourceUrl']}")
