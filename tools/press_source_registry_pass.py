#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = [('press.html','en'),('hu/press.html','hu'),('de-at/press.html','de-AT')]


def clean(value):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', value)).strip()


def quality(url):
    if url.startswith('/') or 'banhalmi.art' in url:
        return 'internal-record'
    if 'web.archive.org' in url:
        return 'archived-exact-source'
    parsed = urlparse(url)
    path = parsed.path.strip('/')
    if not path or path in {'hu','de','en','index.html'}:
        return 'publisher-homepage-needs-exact-url'
    if 'youtube.com/@' in url and 'playlists' in url:
        return 'channel-collection'
    return 'exact-source'


def ensure_ids(text):
    counter = 0
    def repl(match):
        nonlocal counter
        counter += 1
        opening = match.group(1)
        opening = re.sub(r'\s+id="press-\d{2}"', '', opening)
        return f'<article{opening} id="press-{counter:02d}">'
    text = re.sub(r'<article([^>]*)>', repl, text)
    return text, counter

registry = {
    'name': 'BANHALMI ART press source registry',
    'description': 'Language-aware registry of press, interview and moving-image records. Quality labels distinguish exact sources from archived links and publisher-homepage placeholders.',
    'languages': {}
}

for rel, lang in PAGES:
    path = ROOT / rel
    if not path.exists():
        continue
    text = path.read_text(encoding='utf-8')
    text, article_count = ensure_ids(text)
    path.write_text(text, encoding='utf-8')

    records = []
    for idx, block in enumerate(re.findall(r'<article\b[^>]*>(.*?)</article>', text, re.S | re.I), start=1):
        anchor = re.search(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, re.S | re.I)
        if not anchor:
            continue
        url, title = anchor.group(1), clean(anchor.group(2))
        note = re.search(r'<p class="note">(.*?)</p>', block, re.S | re.I)
        desc = re.search(r'<p class="desc">(.*?)</p>', block, re.S | re.I)
        records.append({
            'position': idx,
            'anchor': f'press-{idx:02d}',
            'archiveUrl': f'https://www.banhalmi.art/{rel}#press-{idx:02d}',
            'title': title,
            'sourceUrl': url,
            'sourceQuality': quality(url),
            'description': clean(desc.group(1)) if desc else '',
            'publicationNote': clean(note.group(1)) if note else ''
        })
    registry['languages'][lang] = {
        'page': f'https://www.banhalmi.art/{rel}',
        'articleCount': article_count,
        'recordCount': len(records),
        'records': records
    }

(ROOT / 'press-source-registry.json').write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Press source registry generated.')
for lang, data in registry['languages'].items():
    placeholders = sum(r['sourceQuality'] == 'publisher-homepage-needs-exact-url' for r in data['records'])
    print(f"{lang}: {data['recordCount']} records; {placeholders} publisher-homepage placeholders")
