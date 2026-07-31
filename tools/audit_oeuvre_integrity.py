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
    origin_token = {'curators.html':'Corporate beginnings','hu/curators.html':'Vállalati kezdet','de-at/curators.html':'Unternehmerischer Anfang'}[rel]
    for token in (origin_token,'press.html','#books','#exhibitions','#presence-periods'):
        if token not in body: errors.append(f'{rel}: missing {token}')
    if rel.startswith('hu/') and '/de-at/' in body: errors.append(f'{rel}: German link leak')
    if rel.startswith('de-at/') and '/hu/' in body: errors.append(f'{rel}: Hungarian link leak')
    if not rel.startswith(('hu/','de-at/')) and any(x in body for x in ('/hu/','/de-at/')): errors.append(f'{rel}: translated link leak')

css=(ROOT/'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ('.oeuvre-integrity','.oeuvre-phase-grid','.oeuvre-integrity-links'):
    if token not in css: errors.append(f'presence-core.css: missing {token}')
if 'body.apple-archive .oeuvre-integrity-links{position:static!important' not in css:
    errors.append('presence-core.css: oeuvre navigation is not protected from global header positioning')

# Big-picture invariants across the archive. EN and DE-AT keep the five-card
# presence-periods grid on the homepage; HU was intentionally restructured
# (2026) into the "Pályaív" journey timeline, so it is checked for that
# structure instead of the old grid.
origin_tokens = {'index.html':'Corporate beginnings','de-at/index.html':'Unternehmerischer Anfang'}
for rel,token in origin_tokens.items():
    s=(ROOT/rel).read_text(encoding='utf-8')
    if 'presence-periods' not in s or token not in s: errors.append(f'{rel}: whole-oeuvre origin/period structure missing')
hu_home=(ROOT/'hu/index.html').read_text(encoding='utf-8')
if '<section id="journey"' not in hu_home or 'Pályaív' not in hu_home:
    errors.append('hu/index.html: whole-oeuvre journey structure missing')
for rel in ('press.html','hu/press.html','de-at/press.html'):
    s=(ROOT/rel).read_text(encoding='utf-8')
    if 'presence' not in s.lower() and 'jelenlét' not in s.lower() and 'Präsenz' not in s:
        errors.append(f'{rel}: press archive detached from oeuvre thesis')

if errors:
    print('OEUVRE INTEGRITY AUDIT FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('OEUVRE INTEGRITY AUDIT PASSED: curator dossiers and archive thesis are aligned')
