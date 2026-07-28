#!/usr/bin/env python3
from pathlib import Path
import html, json, re, sys

ROOT=Path(__file__).resolve().parents[1]
EXCLUDED_PARTS={'.git','node_modules','dist'}
HTML=[]
for p in ROOT.rglob('*.html'):
 rel=p.relative_to(ROOT)
 if any(part in EXCLUDED_PARTS for part in rel.parts):
  continue
 if rel.parts[:2] == ('data','archive'):
  continue
 HTML.append(p)

errors=[]
PERSON='https://www.banhalmi.art/norbert-banhalmi#person'
HOME_PAGES={'index.html','hu/index.html','de-at/index.html'}
SOURCE_HUB_PAGES={
 'index.html','hu/index.html','de-at/index.html',
 'curators.html','hu/curators.html','de-at/curators.html'
}
HOME_EXPECTED={
 'index.html':('Norbert Bánhalmi — The Anatomy of Presence | Official Art Archive','en'),
 'hu/index.html':('Bánhalmi Norbert — A jelenlét anatómiája | Hivatalos művészeti archívum','hu-HU'),
 'de-at/index.html':('Norbert Bánhalmi — Die Anatomie der Präsenz | Offizielles Kunstarchiv','de-AT'),
}
HUMAN_VOICE={
 'index.html':('The question behind the work','I have been photographing since 1999.','The investigation of presence · Since 1999','It has been the way I pay attention.'),
 'hu/index.html':('A kérdés, amely végigkíséri a munkát','1999 óta fényképezek.','A jelenlét kutatása · 1999 óta','Ez az a mód, ahogyan figyelek.'),
 'de-at/index.html':('Die Frage hinter der Arbeit','Ich fotografiere seit 1999.','Die Erforschung der Präsenz · Seit 1999','Sie ist die Art, wie ich aufmerksam bin.'),
}
BANNED_HOME_PHRASES=(
 'position-collecting, not a life',
 'Everything you see on this site comes from',
 'more than half my life',
)
BEST_OF_IMG_RE=re.compile(r'<img\b[^>]*\bsrc=["\'][^"\']*/?assets/img/best-of/[^"\']+["\'][^>]*>',re.I)

for p in HTML:
 s=p.read_text(encoding='utf-8')
 rel=p.relative_to(ROOT)
 rel_name=rel.as_posix()
 if '<html' not in s.lower() or '</html>' not in s.lower(): errors.append(f'HTML shell missing: {rel}')
 if 'presence-core.css' not in s: errors.append(f'Shared presence CSS missing: {rel}')
 if '#c9a962' in s or 'rgba(201,169,98' in s: errors.append(f'Legacy gold remains: {rel}')
 if '"@id":"https://www.norbertbanhalmi.com/about/"' in s: errors.append(f'Legacy Person @id remains: {rel}')
 if rel_name in HOME_PAGES:
  if s.count('data-presence-context="2026"') != 1: errors.append(f'Homepage must contain exactly one presence thesis: {rel}')
 else:
  if 'data-presence-context="2026"' in s: errors.append(f'Presence thesis must not appear on subpage: {rel}')
 if rel_name in SOURCE_HUB_PAGES and 'data-source-hub="2026"' not in s:
  errors.append(f'Source hub missing: {rel}')
 if rel_name in HOME_EXPECTED:
  title, language=HOME_EXPECTED[rel_name]
  if f'<title>{title}</title>' not in s: errors.append(f'Homepage title mismatch: {rel}')
  for token in (
   f'<meta property="og:title" content="{title}">',
   f'<meta property="og:image:alt" content="{title}">',
   f'<meta name="twitter:title" content="{title}">',
   f'<meta name="twitter:image:alt" content="{title}">',
  ):
   if token not in s: errors.append(f'Homepage social metadata mismatch ({token}): {rel}')
  if f'"headline":"{title}"' not in s: errors.append(f'Homepage schema headline mismatch: {rel}')
  if f'"inLanguage":"{language}"' not in s: errors.append(f'Homepage schema language mismatch: {rel}')
  for token in HUMAN_VOICE[rel_name]:
   if token not in s: errors.append(f'Human first-person voice marker missing ({token}): {rel}')
  for phrase in BANNED_HOME_PHRASES:
   if phrase in s: errors.append(f'Old theatrical homepage phrasing remains ({phrase}): {rel}')
  hero_match=re.search(r'<header class="hero".*?</header>',s,re.S)
  if not hero_match:
   errors.append(f'Homepage hero missing: {rel}')
  else:
   hero=hero_match.group(0)
   if 'presence-context--hero' not in hero or 'data-presence-context="2026"' not in hero:
    errors.append(f'Presence thesis is not inside the hero: {rel}')
   cta_match=re.search(r'<div class="hero-cta">.*?</div>',hero,re.S)
   thesis_pos=hero.find('presence-context--hero')
   if not cta_match or thesis_pos < cta_match.end():
    errors.append(f'Presence thesis is not placed below the complete hero button block: {rel}')
  outside_hero=s[:hero_match.start()]+s[hero_match.end():] if hero_match else s
  if 'data-presence-context="2026"' in outside_hero:
   errors.append(f'Duplicate presence thesis remains outside the hero: {rel}')
  gallery_match=re.search(r'"@type":"ImageGallery".*?"numberOfItems":(\d+).*?"associatedMedia":\[(.*?)\]\s*[,}]',s,re.S)
  if not gallery_match:
   errors.append(f'Homepage ImageGallery schema missing: {rel}')
  else:
   declared=int(gallery_match.group(1))
   actual=len(re.findall(r'"@type":"ImageObject"',gallery_match.group(2)))
   if declared < 100: errors.append(f'Homepage curatorial gallery is incomplete ({declared} images): {rel}')
   if actual < 100: errors.append(f'Homepage associatedMedia is incomplete ({actual} images): {rel}')
   if declared != actual: errors.append(f'Homepage gallery count mismatch ({declared} declared, {actual} records): {rel}')
   if 'Best of — the reference gallery — Works from the exhibition' in gallery_match.group(2):
    errors.append(f'Generic repeated schema image metadata remains: {rel}')
  image_tags=BEST_OF_IMG_RE.findall(s)
  if len(image_tags) < 100: errors.append(f'Visible homepage curatorial gallery is incomplete ({len(image_tags)} images): {rel}')
  else:
   first=image_tags[0]
   if 'loading="eager"' not in first or 'fetchpriority="high"' not in first:
    errors.append(f'First curatorial image is not prioritised: {rel}')
   alt_values=[]
   for index, tag in enumerate(image_tags, start=1):
    alt_match=re.search(r'\salt=["\']([^"\']*)["\']',tag,re.I)
    alt=html.unescape(alt_match.group(1)).strip() if alt_match else ''
    if not alt: errors.append(f'Curatorial image {index} has no alternative text: {rel}')
    alt_values.append(alt)
    if index > 1 and ('loading="lazy"' not in tag or 'decoding="async"' not in tag or 'fetchpriority="low"' not in tag or 'sizes=' not in tag):
     errors.append(f'Curatorial image {index} is not progressively delivered: {rel}')
     break
   if len(set(alt_values)) != len(alt_values):
    errors.append(f'Curatorial image alternative text is not unique: {rel}')
   if any('Best of — the reference gallery — Works from the exhibition' in alt for alt in alt_values):
    errors.append(f'Generic repeated visible image metadata remains: {rel}')
 if p.name=='press.html':
  for token in ('class="era"','class="desc"','class="note"','"@type":"ItemList"'):
   if token not in s: errors.append(f'{token} missing: {rel}')

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
