#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
TARGETS = {
    'ebredes': {'sources':4, 'contexts':4},
    'anovilaga': {'sources':2, 'contexts':2},
    'merfoldkovek1956': {'sources':1, 'contexts':1},
    'euforia': {'sources':2, 'contexts':1},
    'szosszenetek': {'sources':1, 'contexts':0},
}

errors = []
checked = 0
for folder in ('books', 'exhibitions'):
    for base in (ROOT / folder, ROOT / 'hu' / folder, ROOT / 'de-at' / folder):
        if not base.exists():
            continue
        for path in sorted(base.glob('*.html')):
            slug = path.stem.lower()
            key = next((k for k in TARGETS if k in slug), None)
            if not key:
                continue
            checked += 1
            text = path.read_text(encoding='utf-8')
            rel = path.relative_to(ROOT).as_posix()
            if text.count('<!-- PROJECT-EVIDENCE:START -->') != 1 or text.count('<!-- PROJECT-EVIDENCE:END -->') != 1:
                errors.append(f'{rel}: missing or duplicated project-evidence block')
                continue
            block = re.search(r'<!-- PROJECT-EVIDENCE:START -->(.*?)<!-- PROJECT-EVIDENCE:END -->', text, re.S)
            if not block:
                errors.append(f'{rel}: unreadable project-evidence block')
                continue
            body = block.group(1)
            hrefs = re.findall(r'href="([^"]+)"', body)
            external = [h for h in hrefs if h.startswith('http')]
            contexts = [h for h in hrefs if re.search(r'press\.html#press-\d{2}$', h)]
            if len(hrefs) < TARGETS[key]['sources'] + 1:
                errors.append(f'{rel}: too few evidence links ({len(hrefs)})')
            if len(contexts) != TARGETS[key]['contexts']:
                errors.append(f'{rel}: expected {TARGETS[key]["contexts"]} press-context links, found {len(contexts)}')
            if not any(h.endswith('press.html') for h in hrefs):
                errors.append(f'{rel}: missing language-local press archive link')
            if rel.startswith('hu/') and any(h.startswith('/de-at/') for h in hrefs):
                errors.append(f'{rel}: German internal link leaked into Hungarian record')
            if rel.startswith('de-at/') and any(h.startswith('/hu/') for h in hrefs if 'euforia' not in h):
                errors.append(f'{rel}: Hungarian internal link leaked into German record')
            if not rel.startswith(('hu/', 'de-at/')) and any(h.startswith(('/hu/', '/de-at/')) for h in hrefs if 'euforia' not in h):
                errors.append(f'{rel}: translated internal link leaked into English record')
            for href in external:
                if 'target="_blank"' not in body or 'noopener noreferrer' not in body:
                    errors.append(f'{rel}: unsafe external-link attributes')
                    break
            if rel.startswith('hu/') and 'The man who looks' in body:
                errors.append(f'{rel}: English evidence title leaked into Hungarian record')
            if rel.startswith('de-at/') and 'The man who looks' in body:
                errors.append(f'{rel}: English evidence title leaked into German record')

css = (ROOT / 'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ('.project-evidence', '.project-evidence-grid', '.evidence-item', '.evidence-link', '.evidence-context'):
    if token not in css:
        errors.append(f'presence-core.css: missing {token}')

if checked == 0:
    errors.append('No project records were checked')

if errors:
    print('PROJECT EVIDENCE AUDIT FAILED')
    for error in errors:
        print('-', error)
    sys.exit(1)

print(f'PROJECT EVIDENCE AUDIT PASSED: {checked} records checked')
