#!/usr/bin/env python3
from pathlib import Path
import json, sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

required_files = ('concept-source-registry.json', 'concept-coverage-report.json', 'archive-source-map.json')
for name in required_files:
    if not (ROOT / name).exists():
        errors.append(f'Missing concept coverage resource: {name}')

report_path = ROOT / 'concept-coverage-report.json'
if report_path.exists():
    try:
        report = json.loads(report_path.read_text(encoding='utf-8'))
        summary = report.get('summary', {})
        if summary.get('covered') != summary.get('total'):
            errors.append(f'Concept coverage incomplete: {summary.get("covered")}/{summary.get("total")}')
    except Exception as exc:
        errors.append(f'Invalid concept coverage report: {exc}')

registry_path = ROOT / 'concept-source-registry.json'
if registry_path.exists():
    try:
        registry = json.loads(registry_path.read_text(encoding='utf-8'))
        if registry.get('canonicalEntity', {}).get('@id') != 'https://www.banhalmi.art/norbert-banhalmi#person':
            errors.append('Concept registry uses the wrong Person @id')
        links = json.dumps(registry, ensure_ascii=False)
        for token in (
            'Q56391118',
            'Peter-Magyar-portrait-2026.jpg',
            'https://www.mfvsz.com/hu/tagsag/',
            'https://www.youtube.com/@norbert.banhalmi/playlists',
            '#B79C44',
        ):
            if token not in links:
                errors.append(f'Concept registry missing agreed source/design token: {token}')
    except Exception as exc:
        errors.append(f'Invalid concept source registry: {exc}')

# The archive Person profile must own its canonical URL on every deployable page.
legacy = '"@id":"https://www.banhalmi.art/norbert-banhalmi#person","url":"https://www.norbertbanhalmi.com/about/"'
for p in ROOT.rglob('*.html'):
    rel = p.relative_to(ROOT)
    if any(part in {'.git', 'node_modules', 'dist'} for part in rel.parts) or rel.parts[:2] == ('data', 'archive'):
        continue
    if legacy in p.read_text(encoding='utf-8', errors='ignore'):
        errors.append(f'Legacy commercial Person URL remains: {rel.as_posix()}')
        break

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('Concept, source and story coverage audit passed.')
