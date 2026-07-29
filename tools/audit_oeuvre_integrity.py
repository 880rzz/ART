#!/usr/bin/env python3
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
PAGES=['curators.html','hu/curators.html','de-at/curators.html']
errors=[]
for rel in PAGES:
    p=ROOT/rel
    if not p.exists(): errors.append(f'{rel}: missing'); continue
    s=p.read_text(encoding='utf-8')
    if 'presence-core.css?v=20260729-curator-v2' not in s:
        errors.append(f'{rel}: current curator stylesheet version missing')
    if s.count('<!-- OEUVRE-INTEGRITY:START -->')!=1 or s.count('<!-- OEUVRE-INTEGRITY:END -->')!=1:
        errors.append(f'{rel}: missing or duplicated oeuvre integrity block'); continue
    block=re.search(r'<!-- OEUVRE-INTEGRITY:START -->(.*?)<!-- OEUVRE-INTEGRITY:END -->',s,re.S)
    body=block.group(1) if block else ''
    main_end=s.lower().rfind('</main>')
    block_start=s.find('<!-- OEUVRE-INTEGRITY:START -->')
    block_end=s.find('<!-- OEUVRE-INTEGRITY:END -->')
    if main_end < 0 or not (block_start < block_end < main_end):
        errors.append(f'{rel}: oeuvre integrity block must be inside main')
    if body.count('class="oeuvre-phase"')!=5: errors.append(f'{rel}: expected five phases')
    for token in ('MOL Project','press.html','#books','#exhibitions','#presence-periods'):
        if token not in body: errors.append(f'{rel}: missing {token}')
    if rel.startswith('hu/') and '/de-at/' in body: errors.append(f'{rel}: German link leak')
    if rel.startswith('de-at/') and '/hu/' in body: errors.append(f'{rel}: Hungarian link leak')
    if not rel.startswith(('hu/','de-at/')) and any(x in body for x in ('/hu/','/de-at/')): errors.append(f'{rel}: translated link leak')

css=(ROOT/'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ('.oeuvre-integrity','.oeuvre-phase-grid','.oeuvre-integrity-links'):
    if token not in css: errors.append(f'presence-core.css: missing {token}')
if 'body.apple-archive .oeuvre-integrity-links{position:static!important' not in css:
    errors.append('presence-core.css: oeuvre navigation is not protected from global header positioning')

# Big-picture invariants across the archive.
for rel in ('index.html','hu/index.html','de-at/index.html'):
    s=(ROOT/rel).read_text(encoding='utf-8')
    if 'presence-periods' not in s or 'MOL Project' not in s: errors.append(f'{rel}: whole-oeuvre origin/period structure missing')
for rel in ('press.html','hu/press.html','de-at/press.html'):
    s=(ROOT/rel).read_text(encoding='utf-8')
    if 'MOL Project' not in s and 'presence' not in s.lower() and 'jelenlét' not in s.lower() and 'Präsenz' not in s:
        errors.append(f'{rel}: press archive detached from oeuvre thesis')

if errors:
    print('OEUVRE INTEGRITY AUDIT FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('OEUVRE INTEGRITY AUDIT PASSED: curator dossiers and archive thesis are aligned')
