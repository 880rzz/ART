#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
count=0
for folder in ('books','exhibitions'):
    for base in (ROOT/folder,ROOT/'hu'/folder,ROOT/'de-at'/folder):
        if not base.exists(): continue
        for p in base.glob('*.html'):
            count+=1
            s=p.read_text(encoding='utf-8')
            rel=p.relative_to(ROOT).as_posix()
            for token in ('RECORD-RELATIONSHIPS:START','record-relationships','record-links'):
                if token not in s: errors.append(f'{rel}: missing {token}')
            prefix='/hu/' if rel.startswith('hu/') else ('/de-at/' if rel.startswith('de-at/') else '/')
            for href in (f'href="{prefix}#presence-periods"',f'href="{prefix}press.html"',f'href="{prefix}curators.html"'):
                if href not in s: errors.append(f'{rel}: language-local link missing: {href}')
            if 'In my own words' in s or 'A saját szavaimmal' in s or 'In meinen eigenen Worten' in s:
                errors.append(f'{rel}: forbidden self-referential heading')
css=(ROOT/'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ('.record-relationships','.record-context-head','.record-links'):
    if token not in css: errors.append(f'presence-core.css: missing {token}')
if count<9: errors.append(f'expected at least 9 book/exhibition records, found {count}')
if errors:
    print('Record relationship audit failed:')
    for e in errors: print('-',e)
    sys.exit(1)
print(f'Record relationship audit passed for {count} records.')
