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
        'context': 'Context in the press archive'
    },
    'hu': {
        'label': 'Dokumentált nyilvános történet',
        'heading': 'A fejezethez közvetlenül kapcsolódó források',
        'intro': 'Ezek a hivatkozások azt dokumentálják, hogyan jelent meg a projekt, a könyv vagy a kiállítás a nyilvánosságban. Nem általános sajtólistát adnak, hanem kizárólag az adott rekordhoz közvetlenül kapcsolódó forrásokat.',
        'archive': 'Teljes sajtóarchívum',
        'internal': 'Archívumrekord',
        'external': 'Független vagy intézményi forrás',
        'video': 'Mozgóképes dokumentum',
        'context': 'Helye a sajtóarchívumban'
    },
    'de': {
        'label': 'Dokumentierte öffentliche Geschichte',
        'heading': 'Direkt mit diesem Kapitel verbundene Quellen',
        'intro': 'Diese Verweise dokumentieren, wie das Projekt, Buch oder die Ausstellung öffentlich sichtbar wurde. Sie bilden keine allgemeine Presseliste, sondern führen ausschließlich unmittelbar verbundene Quellen zusammen.',
        'archive': 'Vollständiges Pressearchiv',
        'internal': 'Archivdatensatz',
        'external': 'Unabhängige oder institutionelle Quelle',
        'video': 'Bewegtbilddokument',
        'context': 'Kontext im Pressearchiv'
    },
}

# Each relationship has a stable position in the 27-item press archive.
EVIDENCE = {
    'ebredes': [
        ({'en':'The man who looks at your appearance but sees your soul','hu':'A férfi, aki a külsődet nézi, de a lelkedet látja','de':'Der Mann, der dein Äußeres betrachtet, aber deine Seele sieht'}, 'https://she.life.hu/nofilter/2017/03/banhalmi-norbert-profi-fotos-interju-modell-belso-szepseg-szepnek-latni-magad', 'external', 6),
        ({'en':'My first and last nude session','hu':'Az első és utolsó aktfotózásom','de':'Mein erstes und letztes Aktshooting'}, 'https://she.life.hu/nofilter/20170413-aktfotozas-elmeny-onbizalom-mellrak-tulelo-melleltavolito-mutet.html', 'external', 7),
        ({'en':'Permanent exhibition at the Oncology Centre','hu':'Állandó kiállítás az Onkológiai Centrumban','de':'Dauerausstellung im Onkologischen Zentrum'}, 'https://www.veol.hu/vezeto-hirek/2018/03/csolnoky-ferenc-korhaz-onkologiai-centrum-rak-kiallitas', 'external', 8),
        ({'en':'Awakening — The New Beginning! exhibition interview','hu':'Ébredés – az Új kezdet! kiállításinterjú','de':'Erwachen – der Neubeginn! Ausstellungsinterview'}, 'https://youtu.be/XI5WavAwFOY', 'video', 22),
    ],
    'anovilaga': [
        ({'en':'Nine turning points in a woman’s life','hu':'A nő életének kilenc sorsfordulója','de':'Neun Wendepunkte im Leben einer Frau'}, 'https://mindennapkonyv.hu/', 'external', 9),
        ({'en':'The World of Woman','hu':'A nő világa','de':'Die Welt der Frau'}, 'https://www.youtube.com/watch?v=cuPzuMSXxMc', 'video', 26),
    ],
    'merfoldkovek1956': [
        ({'en':'Milestones ’56 in New York','hu':'Mérföldkövek – ’56-os portrék New Yorkban','de':'Meilensteine ’56 in New York'}, 'https://www.magyarforradalom1956.hu/v/merfoldkovek--56-os-portrekepekbol-rendeztek-kiallitast-new-yorkban/', 'external', 4),
    ],
    'euforia': [
        ({'en':'Portrait of Péter Magyar — Wikimedia Commons record','hu':'Magyar Péter portréja – Wikimedia Commons-rekord','de':'Porträt von Péter Magyar – Wikimedia-Commons-Datensatz'}, 'https://commons.wikimedia.org/wiki/File:Peter-Magyar-portrait-2026.jpg', 'external', 21),
        ({'en':'EUFÓRIA — archive record','hu':'EUFÓRIA – archívumrekord','de':'EUFÓRIA – Archivdatensatz'}, '/hu/exhibitions/euforia.html', 'internal', None),
    ],
    'szosszenetek': [
        ({'en':'The body, recovery and intimacy — complete press chapter','hu':'Test, felépülés és intimitás – teljes sajtófejezet','de':'Körper, Genesung und Intimität – vollständiges Pressekapitel'}, None, 'internal', None),
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
    for titles, url, kind, press_position in EVIDENCE[key]:
        title = titles[lang]
        if url is None:
            url = prefix + 'press.html'
        target = ' target="_blank" rel="noopener noreferrer"' if url.startswith('http') else ''
        kind_label = t[kind]
        context_link = ''
        if press_position:
            context_link = f'<a class="evidence-context" href="{prefix}press.html#press-{press_position:02d}">{html.escape(t["context"])} →</a>'
        links.append(
            f'<article class="evidence-item"><a class="evidence-link" href="{html.escape(url, quote=True)}"{target}>'
            f'<strong>{html.escape(title)}</strong><span>{html.escape(kind_label)}</span></a>{context_link}</article>'
        )
    links.append(
        f'<article class="evidence-item"><a class="evidence-link" href="{prefix}press.html"><strong>{html.escape(t["archive"])}</strong>'
        f'<span>{html.escape(t["internal"])}</span></a></article>'
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
