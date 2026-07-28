#!/usr/bin/env python3
from pathlib import Path
import json, re, sys

ROOT=Path(__file__).resolve().parents[1]
EXCLUDED_PARTS={'.git','node_modules','dist'}
HTML=[]
for p in ROOT.rglob('*.html'):
 rel=p.relative_to(ROOT)
 if any(part in EXCLUDED_PARTS for part in rel.parts):
  continue
 # data/archive contains source fragments, not deployable HTML documents.
 if rel.parts[:2] == ('data','archive'):
  continue
 HTML.append(p)

errors=[]
PERSON='https://www.banhalmi.art/norbert-banhalmi#person'
THESIS_PAGES={
 'index.html','hu/index.html','de-at/index.html',
 'curators.html','hu/curators.html','de-at/curators.html'
}
HOME_EXPECTED={
 'index.html':('Norbert Bánhalmi — The Anatomy of Presence | Official Art Archive','en'),
 'hu/index.html':('Bánhalmi Norbert — A jelenlét anatómiája | Hivatalos művészeti archívum','hu-HU'),
 'de-at/index.html':('Norbert Bánhalmi — Die Anatomie der Präsenz | Offizielles Kunstarchiv','de-AT'),
}

for p in HTML:
 s=p.read_text(encoding='utf-8')
 rel=p.relative_to(ROOT)
 rel_name=rel.as_posix()
 if '<html' not in s.lower() or '</html>' not in s.lower(): errors.append(f'HTML shell missing: {rel}')
 if 'presence-core.css' not in s: errors.append(f'Shared presence CSS missing: {rel}')
 if '#c9a962' in s or 'rgba(201,169,98' in s: errors.append(f'Legacy gold remains: {rel}')
 if '"@id":"https://www.norbertbanhalmi.com/about/"' in s: errors.append(f'Legacy Person @id remains: {rel}')
 if rel_name in THESIS_PAGES:
  if 'data-presence-context="2026"' not in s: errors.append(f'Presence thesis missing: {rel}')
  if 'data-source-hub="2026"' not in s: errors.append(f'Source hub missing: {rel}')
 if rel_name in HOME_EXPECTED:
  title, language=HOME_EXPECTED[rel_name]
  if f'<title>{title}</title>' not in s: errors.append(f'Homepage title mismatch: {rel}')
  if f'content="{title}"' not in s: errors.append(f'Homepage social title/alt mismatch: {rel}')
  if f'"headline":"{title}"' not in s: errors.append(f'Homepage schema headline mismatch: {rel}')
  if f'"inLanguage":"{language}"' not in s: errors.append(f'Homepage schema language mismatch: {rel}')
  gallery_match=re.search(r'"@type":"ImageGallery".*?"numberOfItems":(\d+)',s,re.S)
  if gallery_match and int(gallery_match.group(1))>24: errors.append(f'Homepage schema gallery is not curated: {rel}')
 if p.name=='press.html':
  for token in ('class="era"','class="desc"','class="note"','"@type":"ItemList"'):
   if token not in s: errors.append(f'{token} missing: {rel}')

# Book integrity: each title keeps its own ISBN in all languages.
for p in ROOT.rglob('book-ebredes.html'):
 s=re.sub(r'[- ]','',p.read_text(encoding='utf-8'))
 if '9789631286632' not in s: errors.append(f'Ébredés ISBN missing: {p.relative_to(ROOT)}')
 if '9786150000534' in s: errors.append(f'Szösszenetek ISBN leaked into Ébredés: {p.relative_to(ROOT)}')
for p in ROOT.rglob('book-szosszenetek.html'):
 s=re.sub(r'[- ]','',p.read_text(encoding='utf-8'))
 if '9786150000534' not in s: errors.append(f'Szösszenetek ISBN missing: {p.relative_to(ROOT)}')
 if '9789631286632' in s: errors.append(f'Ébredés ISBN leaked into Szösszenetek: {p.relative_to(ROOT)}')

for required in ('archive-source-map.json','llms.txt','ai.txt'):
 if not (ROOT/required).exists(): errors.append(f'Missing AI/archive resource: {required}')

if (ROOT/'archive-source-map.json').exists():
 try:
  data=json.loads((ROOT/'archive-source-map.json').read_text(encoding='utf-8'))
  if data.get('creator',{}).get('@id')!=PERSON: errors.append('Source map uses wrong Person @id')
 except Exception as exc: errors.append(f'Invalid archive-source-map.json: {exc}')

if errors:
 print('\n'.join(errors)); sys.exit(1)
print(f'Complete archive audit passed for {len(HTML)} deployable HTML files.')
