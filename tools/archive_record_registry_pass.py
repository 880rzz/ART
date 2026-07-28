#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[1]
LANGS = [('en', ROOT), ('hu', ROOT/'hu'), ('de-AT', ROOT/'de-at')]

PERIODS = {
    'mol': 'I',
    'merfoldkovek1956': 'II',
    'ebredes': 'III',
    'szosszenetek': 'III',
    'anovilaga': 'III',
    'community': 'IV',
    'euforia': 'V',
}


def clean(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()


def extract(pattern, text):
    m = re.search(pattern, text, re.S | re.I)
    return clean(m.group(1)) if m else ''


def canonical(text):
    m = re.search(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', text, re.I)
    return m.group(1) if m else ''


def period_for(slug):
    key = next((k for k in PERIODS if k in slug.lower()), None)
    return PERIODS.get(key, 'IV')


def related_urls(text):
    blocks = []
    for marker in ('RECORD-RELATIONSHIPS', 'PROJECT-EVIDENCE'):
        m = re.search(rf'<!-- {marker}:START -->(.*?)<!-- {marker}:END -->', text, re.S)
        if m:
            blocks.append(m.group(1))
    urls=[]
    for block in blocks:
        for href in re.findall(r'href="([^"]+)"', block):
            if href not in urls:
                urls.append(href)
    return urls

registry = {
    'name': 'BANHALMI ART canonical archive record registry',
    'concept': 'The investigation of presence',
    'origin': 'MOL Project',
    'person': 'https://www.banhalmi.art/norbert-banhalmi#person',
    'website': 'https://www.banhalmi.art/#website',
    'records': []
}

for lang, base in LANGS:
    for kind, folder in [('Book', 'books'), ('ExhibitionEvent', 'exhibitions')]:
        target = base / folder
        if not target.exists():
            continue
        for path in sorted(target.glob('*.html')):
            text = path.read_text(encoding='utf-8')
            slug = path.stem
            title = extract(r'<h1[^>]*>(.*?)</h1>', text) or extract(r'<title>(.*?)</title>', text)
            description = extract(r'<meta[^>]+name="description"[^>]+content="([^"]+)"', text)
            url = canonical(text)
            registry['records'].append({
                'id': f'{url}#record' if url else path.as_posix(),
                'type': kind,
                'language': lang,
                'slug': slug,
                'title': title,
                'description': description,
                'canonicalUrl': url,
                'presenceResearchPeriod': period_for(slug),
                'isPartOf': 'https://www.banhalmi.art/#website',
                'creator': 'https://www.banhalmi.art/norbert-banhalmi#person',
                'relatedRecords': related_urls(text),
                'factualStatus': 'verified-record-with-separated-interpretation'
            })

registry['recordCount'] = len(registry['records'])
(ROOT / 'archive-record-registry.json').write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f"Archive record registry generated with {registry['recordCount']} records.")
