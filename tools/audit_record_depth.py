#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors=[]
checked=0
for folder in ('books','exhibitions'):
    for base in (ROOT/folder, ROOT/'hu'/folder, ROOT/'de-at'/folder):
        if not base.exists(): continue
        for path in sorted(base.glob('*.html')):
            checked += 1
            text=path.read_text(encoding='utf-8')
            rel=path.relative_to(ROOT).as_posix()
            if text.count('<!-- RECORD-DEPTH:START -->') != 1 or text.count('<!-- RECORD-DEPTH:END -->') != 1:
                errors.append(f'{rel}: missing or duplicated record-depth block')
                continue
            block=re.search(r'<!-- RECORD-DEPTH:START -->(.*?)<!-- RECORD-DEPTH:END -->',text,re.S)
            if not block:
                errors.append(f'{rel}: unreadable record-depth block')
                continue
            body=block.group(1)
            if body.count('<article>') != 4:
                errors.append(f'{rel}: record-depth block must contain four curatorial fields')
            if '<!-- RECORD-RELATIONSHIPS:START -->' in text and text.find('<!-- RECORD-DEPTH:START -->') > text.find('<!-- RECORD-RELATIONSHIPS:START -->'):
                errors.append(f'{rel}: record depth must precede relationship navigation')
            forbidden=('A saját szavaimmal','In my own words','In meinen eigenen Worten')
            if any(term in body for term in forbidden):
                errors.append(f'{rel}: self-promotional heading leaked into curatorial depth')
            if rel.startswith('hu/') and 'hiányzó tényeket a rendszer nem talál ki' not in body:
                errors.append(f'{rel}: missing factual-boundary statement')
            if rel.startswith('de-at/') and 'fehlende Fakten werden nicht erfunden' not in body:
                errors.append(f'{rel}: missing factual-boundary statement')
            if not rel.startswith(('hu/','de-at/')) and 'missing facts are not invented' not in body:
                errors.append(f'{rel}: missing factual-boundary statement')
css=(ROOT/'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ('.record-depth','.record-depth-grid','.record-depth-date'):
    if token not in css: errors.append(f'presence-core.css: missing {token}')
if checked == 0: errors.append('No book or exhibition records checked')
if errors:
    print('RECORD DEPTH AUDIT FAILED')
    for error in errors: print('-',error)
    sys.exit(1)
print(f'RECORD DEPTH AUDIT PASSED: {checked} records checked')
