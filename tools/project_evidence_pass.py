#!/usr/bin/env python3
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]

LANG = {
    'en': {
        'label': 'Documented public record',
        'heading': 'Sources connected to this chapter',
        'intro': 'These links document how the project, book or exhibition entered public life. They are selected for their direct relationship to this record, rather than presented as a general press list.',
        'archive': 'Complete press archive',
        'internal': 'Archive record',
        'external': 'Independent or institutional source',
        'video': 'Moving-image record',
    },
    'hu': {
        'label': 'Dokumentált nyilvános történet',
        'heading': 'A fejezethez közvetlenül kapcsolódó források',
        'intro': 'Ezek a hivatkozások azt dokumentálják, hogyan jelent meg a projekt, a könyv vagy a kiállítás a nyilvánosságban. Nem általános sajtólistát adnak, hanem kizárólag az adott rekordhoz közvetlenül kapcsolódó forrásokat.',
        'archive': 'Teljes sajtóarchívum',
        'internal': 'Archívumrekord',
        'external': 'Független vagy intézményi forrás',
        'video': 'Mozgóképes dokumentum',
    },
    'de': {
        'label': 'Dokumentierte öffentliche Geschichte',
        'heading': 'Direkt mit diesem Kapitel verbundene Quellen',
        'intro': 'Diese Verweise dokumentieren, wie das Projekt, Buch oder die Ausstellung öffentlich sichtbar wurde. Sie bilden keine allgemeine Presseliste, sondern führen ausschließlich unmittelbar verbundene Quellen zusammen.',
        'archive': 'Vollständiges Pressearchiv',
        'internal': 'Archivdatensatz',
        'external': 'Unabhängige oder institutionelle Quelle',
        'video': 'Bewegtbilddokument',
    },
}

# Only relationships supported by a known, direct source are listed here.
EVIDENCE = {
    'ebredes': [
        ('The man who looks at your appearance but sees your soul', 'https://she.life.hu/nofilter/2017/03/banhalmi-norbert-profi-fotos-interju-modell-belso-szepseg-szepnek-latni-magad', 'external'),
        ('My first and last nude session', 'https://she.life.hu/nofilter/20170413-aktfotozas-elmeny-onbizalom-mellrak-tulelo-melleltavolito-mutet.html', 'external'),
        ('Permanent exhibition at the Oncology Centre', 'https://www.veol.hu/vezeto-hirek/2018/03/csolnoky-ferenc-korhaz-onkologiai-centrum-rak-kiallitas', 'external'),
        ('Awakening — The New Beginning! exhibition interview', 'https://youtu.be/XI5WavAwFOY', 'video'),
    ],
    'anovilaga': [
        ('Nine turning points in a woman’s life', 'https://mindennapkonyv.hu/', 'external'),
        ('The World of Woman', 'https://www.youtube.com/watch?v=cuPzuMSXxMc', 'video'),
    ],
    'merfoldkovek1956': [
        ('Milestones ’56 in New York', 'https://www.magyarforradalom1956.hu/v/merfoldkovek--56-os-portrekepekbol-rendeztek-kiallitast-new-yorkban/', 'external'),
    ],
    'euforia': [
        ('Portrait of Péter Magyar — Wikimedia Commons record', 'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg', 'external'),
        ('EUFÓRIA — archive record', '/hu/exhibitions/euforia.html', 'internal'),
    ],
    'szosszenetek': [
        ('The body, recovery and intimacy — complete press chapter', None, 'internal'),
    ],
}


def lang_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return 'hu' if rel.startswith('hu/') else ('de' if rel.startswith('de-at/') else 'en')


def prefix_for(path: Path) -> str:
    lang = lang_for(path)
    return '/hu/' if lang == 'hu' else ('/de-at/' if lang == 'de' else '/')


def project_key(path: Path):
    slug = path.stem.lower()
    return next((key for key in EVIDENCE if key in slug), None)


def remove_existing(text: str) -> str:
    return re.sub(r'\s*<!-- PROJECT-EVIDENCE:START -->.*?<!-- PROJECT-EVIDENCE:END -->\s*', '\n', text, flags=re.S)


def render(path: Path, key: str) -> str:
    lang = lang_for(path)
    t = LANG[lang]
    prefix = prefix_for(path)
    links = []
    for title, url, kind in EVIDENCE[key]:
        if url is None:
            url = prefix + 'press.html'
        elif url.startswith('/hu/') and lang != 'hu':
            # The EUFÓRIA editorial record currently exists only in Hungarian;
            # preserve that fact rather than inventing translated records.
            pass
        target = ' target="_blank" rel="noopener noreferrer"' if url.startswith('http') else ''
        kind_label = t[kind]
        links.append(
            f'<a class="evidence-link" href="{html.escape(url, quote=True)}"{target}>'
            f'<strong>{html.escape(title)}</strong><span>{html.escape(kind_label)}</span></a>'
        )
    links.append(
        f'<a class="evidence-link" href="{prefix}press.html"><strong>{html.escape(t["archive"])}</strong>'
        f'<span>{html.escape(t["internal"])}</span></a>'
    )
    return f'''\n<!-- PROJECT-EVIDENCE:START -->
<section class="project-evidence" aria-labelledby="project-evidence-title"><div class="wrap">
  <div class="project-evidence-head"><p class="label">{t['label']}</p><h2 id="project-evidence-title">{t['heading']}</h2><p>{t['intro']}</p></div>
  <div class="project-evidence-grid">{''.join(links)}</div>
</div></section>
<!-- PROJECT-EVIDENCE:END -->\n'''


changed = []
for folder in ('books', 'exhibitions'):
    for base in (ROOT / folder, ROOT / 'hu' / folder, ROOT / 'de-at' / folder):
        if not base.exists():
            continue
        for path in sorted(base.glob('*.html')):
            key = project_key(path)
            if not key:
                continue
            text = path.read_text(encoding='utf-8')
            original = text
            text = remove_existing(text)
            marker = '<!-- RECORD-RELATIONSHIPS:END -->'
            pos = text.find(marker)
            if pos >= 0:
                pos += len(marker)
            else:
                pos = text.find('<footer')
            if pos < 0:
                continue
            text = text[:pos] + render(path, key) + text[pos:]
            if text != original:
                path.write_text(text, encoding='utf-8')
                changed.append(path.relative_to(ROOT).as_posix())

print(f'Project evidence pass updated {len(changed)} records.')
for item in changed:
    print(item)
