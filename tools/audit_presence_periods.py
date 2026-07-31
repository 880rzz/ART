#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]

# EN and DE-AT keep the original five-card "presence-periods" grid on the
# homepage. HU was intentionally restructured (2026) into a nine-era
# "Pályaív" journey timeline that supplements rather than replaces the same
# content, so its checks are shaped differently instead of forcing the old
# five-card layout back onto it.
GRID_PAGES={
 'index.html':{
   'required':['Periods in the investigation of presence','Corporate beginnings','The question behind the work'],
   'books_href':'href="#books"',
 },
 'de-at/index.html':{
   'required':['Perioden der Erforschung von Präsenz','Unternehmerischer Anfang','Die Frage hinter der Arbeit'],
   'books_href':'href="#books"',
 },
}
JOURNEY_PAGES={
 'hu/index.html':{
   'required':['Pályaív','Hogyan épült fel','Saját szavaimmal'],
   'books_href':'href="index.html#books"',
 },
}
FORBIDDEN=['In my own words','A saját szavaimmal','In meinen eigenen Worten','MOL Project']
errors=[]

for rel,cfg in GRID_PAGES.items():
 p=ROOT/rel
 if not p.exists():
  errors.append(f'{rel}: missing')
  continue
 s=p.read_text(encoding='utf-8')
 for token in cfg['required']:
  if token not in s: errors.append(f'{rel}: missing {token!r}')
 if '<section id="presence-periods"' not in s: errors.append(f'{rel}: presence-periods section missing')
 if s.count('class="presence-period"')<5: errors.append(f'{rel}: fewer than five periods')
 for bad in FORBIDDEN:
  if bad in s: errors.append(f'{rel}: forbidden text remains: {bad}')
 for href in [cfg['books_href'],'href="#exhibitions"','href="press.html"','href="curators.html"']:
  if href not in s: errors.append(f'{rel}: missing period link {href}')

for rel,cfg in JOURNEY_PAGES.items():
 p=ROOT/rel
 if not p.exists():
  errors.append(f'{rel}: missing')
  continue
 s=p.read_text(encoding='utf-8')
 for token in cfg['required']:
  if token not in s: errors.append(f'{rel}: missing {token!r}')
 if '<section id="journey"' not in s: errors.append(f'{rel}: journey section missing')
 if s.count('class="t-item"')<5: errors.append(f'{rel}: fewer than five journey eras')
 for bad in FORBIDDEN:
  if bad in s: errors.append(f'{rel}: forbidden text remains: {bad}')
 for href in [cfg['books_href'],'href="#exhibitions"','href="press.html"','href="curators.html"']:
  if href not in s: errors.append(f'{rel}: missing period link {href}')

css=(ROOT/'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ['.presence-periods','.presence-period-grid','.presence-period-links']:
 if token not in css: errors.append(f'presence-core.css: missing {token}')

if errors:
 print('PRESENCE PERIOD AUDIT FAILED')
 for e in errors: print('-',e)
 sys.exit(1)
print('Presence-period audit passed for EN, HU and DE-AT.')
