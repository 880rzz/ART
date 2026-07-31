#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
PAGES={
 'index.html':['Periods in the investigation of presence','Corporate beginnings','The question behind the work'],
 'hu/index.html':['A jelenlét kutatásának korszakai','Vállalati kezdet','A kérdés, amely végigkíséri a munkát'],
 'de-at/index.html':['Perioden der Erforschung von Präsenz','Unternehmerischer Anfang','Die Frage hinter der Arbeit'],
}
FORBIDDEN=['In my own words','A saját szavaimmal','In meinen eigenen Worten']
errors=[]
for rel,required in PAGES.items():
 p=ROOT/rel
 if not p.exists():
  errors.append(f'{rel}: missing')
  continue
 s=p.read_text(encoding='utf-8')
 for token in required:
  if token not in s: errors.append(f'{rel}: missing {token!r}')
 if '<section id="presence-periods"' not in s: errors.append(f'{rel}: presence-periods section missing')
 if s.count('class="presence-period"')<5: errors.append(f'{rel}: fewer than five periods')
 for bad in FORBIDDEN:
  if bad in s: errors.append(f'{rel}: forbidden heading remains: {bad}')
 for href in ['href="#books"','href="#exhibitions"','href="press.html"','href="curators.html"']:
  if href not in s: errors.append(f'{rel}: missing period link {href}')
css=(ROOT/'assets/css/presence-core.css').read_text(encoding='utf-8')
for token in ['.presence-periods','.presence-period-grid','.presence-period-links']:
 if token not in css: errors.append(f'presence-core.css: missing {token}')
if errors:
 print('PRESENCE PERIOD AUDIT FAILED')
 for e in errors: print('-',e)
 sys.exit(1)
print('Presence-period audit passed for EN, HU and DE-AT.')
