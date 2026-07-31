#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'period-evidence-backbone.json'
errors = []

if not PATH.exists():
    errors.append('period-evidence-backbone.json is missing')
else:
    data = json.loads(PATH.read_text(encoding='utf-8'))
    periods = data.get('periods', [])
    if len(periods) != 5:
        errors.append(f'expected 5 periods, found {len(periods)}')
    expected = ['I', 'II', 'III', 'IV', 'V']
    found = [p.get('number') for p in periods]
    if found != expected:
        errors.append(f'period order must be {expected}, found {found}')

    for period in periods:
        number = period.get('number', '?')
        project = period.get('anchorProject') or {}
        if not project.get('id') or not project.get('name') or not project.get('recordUrl'):
            errors.append(f'period {number}: incomplete anchor project')

        evidence = period.get('evidence') or []
        status = period.get('status')

        if number == 'I':
            if status != 'self-initiated-origin':
                errors.append('period I: must be marked self-initiated-origin')
            if evidence:
                errors.append('period I: must not claim external evidence')
            if period.get('evidenceRequirement') != 'not-applicable-self-initiated-material':
                errors.append('period I: missing explicit evidence exemption')
            if not period.get('curatorialNote'):
                errors.append('period I: missing curatorial explanation')
            continue

        if status != 'evidence-backed-period':
            errors.append(f'period {number}: must be marked evidence-backed-period')
        if not evidence:
            errors.append(f'period {number}: no evidence source')
            continue

        inspectable = 0
        for item in evidence:
            url = str(item.get('url', ''))
            if not item.get('type') or not item.get('role') or not item.get('quality'):
                errors.append(f'period {number}: evidence item lacks type, role or quality')
            parsed = urlparse(url)
            if parsed.scheme in ('http', 'https') and parsed.netloc:
                inspectable += 1
            else:
                errors.append(f'period {number}: non-inspectable evidence URL {url!r}')
        if inspectable < 1:
            errors.append(f'period {number}: requires at least one inspectable public source')

    required_projects = {
        'I': 'Early corporate assignment',
        'II': 'Mérföldkövek ’56',
        'III': 'Ébredés – az Új kezdet!',
        'IV': 'Te is Lehetsz',
        'V': 'EUFÓRIA – The Anatomy of Presence',
    }
    for period in periods:
        number = period.get('number')
        expected_name = required_projects.get(number)
        if expected_name and period.get('anchorProject', {}).get('name') != expected_name:
            errors.append(f'period {number}: expected anchor project {expected_name!r}')

    if data.get('evidenceBackedPeriodCount') != 4:
        errors.append('expected exactly four evidence-backed periods after the MOL origin')

if errors:
    print('PERIOD EVIDENCE BACKBONE AUDIT FAILED')
    for error in errors:
        print('-', error)
    sys.exit(1)

print('PERIOD EVIDENCE BACKBONE AUDIT PASSED: one self-initiated origin and four evidence-backed periods')