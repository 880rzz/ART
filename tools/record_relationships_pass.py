#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

LANG = {
    'en': {
        'period':'Presence-research period','question':'Research context','links':'Connected records',
        'archive':'Archive overview','press':'Press and moving image','curators':'Curatorial dossier','books':'Books','exhibitions':'Exhibitions',
        'book_text':'This book is presented as a document within the wider investigation of presence. Its bibliographic data, project context and related public records belong together.',
        'exh_text':'This exhibition is presented as one chapter in the investigation of presence. Its place in the oeuvre is defined by the question it asks, the works it gathers and the records that document its public life.'
    },
    'hu': {
        'period':'Jelenlétkutatási korszak','question':'Kutatási összefüggés','links':'Kapcsolódó rekordok',
        'archive':'Archívum áttekintése','press':'Sajtó és mozgókép','curators':'Kurátori dosszié','books':'Könyvek','exhibitions':'Kiállítások',
        'book_text':'A könyv a jelenlét kutatásának tágabb rendszerében jelenik meg. A bibliográfiai adatok, a projekt háttere és a hozzá kapcsolódó nyilvános dokumentumok egyetlen rekordot alkotnak.',
        'exh_text':'A kiállítás a jelenlét kutatásának egyik fejezete. Az életműben elfoglalt helyét a felvetett kérdés, a bemutatott munkák és a nyilvános történetét dokumentáló források együtt határozzák meg.'
    },
    'de': {
        'period':'Phase der Präsenzforschung','question':'Forschungszusammenhang','links':'Verbundene Datensätze',
        'archive':'Archivübersicht','press':'Presse und Bewegtbild','curators':'Kuratorisches Dossier','books':'Bücher','exhibitions':'Ausstellungen',
        'book_text':'Das Buch wird als Dokument innerhalb der umfassenderen Erforschung der Präsenz vorgestellt. Bibliografische Daten, Projektkontext und öffentliche Quellen gehören zu einem gemeinsamen Datensatz.',
        'exh_text':'Die Ausstellung wird als Kapitel der Erforschung der Präsenz verstanden. Ihr Ort im Werk ergibt sich aus ihrer Fragestellung, den gezeigten Arbeiten und den Quellen, die ihre öffentliche Geschichte dokumentieren.'
    }
}

PERIODS = {
    'mol': ('I', 'The point of departure · Corporate beginnings', 'A kiindulópont · Vállalati kezdet', 'Der Ausgangspunkt · Unternehmerischer Anfang'),
    'merfoldkovek1956': ('II', 'Human stories and historical memory', 'Emberi történetek és történelmi emlékezet', 'Menschliche Geschichten und historisches Gedächtnis'),
    'ebredes': ('III', 'The body as memory and recovery', 'A test mint emlékezet és felépülés', 'Der Körper als Erinnerung und Genesung'),
    'szosszenetek': ('III', 'The body as memory and recovery', 'A test mint emlékezet és felépülés', 'Der Körper als Erinnerung und Genesung'),
    'anovilaga': ('III', 'The body, identity and turning points', 'A test, az identitás és a fordulópontok', 'Körper, Identität und Wendepunkte'),
    'community': ('IV', 'Institutions, teaching and communities', 'Intézmények, oktatás és közösségek', 'Institutionen, Vermittlung und Gemeinschaften'),
    'euforia': ('V', 'Public and leadership presence', 'Nyilvános és vezetői jelenlét', 'Öffentliche und führungsbezogene Präsenz')
}

BOOK_TO_EXHIBITION = {
    'book-ebredes':'ebredes.html',
    'book-anovilaga':'anovilaga.html',
    'book-szosszenetek':'szosszenetek.html'
}


def language_for(path):
    s = path.as_posix()
    return 'hu' if s.startswith('hu/') else ('de' if s.startswith('de-at/') else 'en')


def root_prefix(path):
    s = path.as_posix()
    return '/hu/' if s.startswith('hu/') else ('/de-at/' if s.startswith('de-at/') else '/')


def period_for(slug):
    key = next((k for k in PERIODS if k in slug.lower()), None)
    if not key:
        return ('IV', 'Institutions, books and exhibitions', 'Intézmények, könyvek és kiállítások', 'Institutionen, Bücher und Ausstellungen')
    return PERIODS[key]


def title_from_html(s):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S|re.I)
    if not m:
        m = re.search(r'<title>(.*?)</title>', s, re.S|re.I)
    return re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''


def remove_old(s):
    return re.sub(r'\s*<!-- RECORD-RELATIONSHIPS:START -->.*?<!-- RECORD-RELATIONSHIPS:END -->\s*', '\n', s, flags=re.S)


def block(path, kind, title):
    lang = language_for(path); t = LANG[lang]; prefix = root_prefix(path)
    slug = path.stem
    p = period_for(slug)
    period_name = p[2] if lang == 'hu' else (p[3] if lang == 'de' else p[1])
    context = t['book_text'] if kind == 'book' else t['exh_text']
    extra = ''
    if kind == 'book' and slug in BOOK_TO_EXHIBITION:
        candidate = prefix + 'exhibitions/' + BOOK_TO_EXHIBITION[slug]
        label = t['exhibitions']
        extra = f'<a href="{candidate}"><strong>{label}</strong><span>{title}</span></a>'
    elif kind == 'exhibition':
        bslug = next((k for k,v in BOOK_TO_EXHIBITION.items() if v == path.name), None)
        if bslug:
            extra = f'<a href="{prefix}books/{bslug}.html"><strong>{t["books"]}</strong><span>{title}</span></a>'
    return f'''\n<!-- RECORD-RELATIONSHIPS:START -->
<section class="record-relationships" aria-labelledby="record-context-title"><div class="wrap">
  <div class="record-context-head"><p class="label">{t['period']} · {p[0]}</p><h2 id="record-context-title">{period_name}</h2><p>{context}</p></div>
  <div class="record-links" aria-label="{t['links']}">
    <a href="{prefix}#presence-periods"><strong>{t['archive']}</strong><span>{period_name}</span></a>
    <a href="{prefix}press.html"><strong>{t['press']}</strong><span>{title}</span></a>
    <a href="{prefix}curators.html"><strong>{t['curators']}</strong><span>{t['question']}</span></a>
    {extra}
  </div>
</div></section>
<!-- RECORD-RELATIONSHIPS:END -->\n'''

changed=[]
for folder, kind in [('books','book'),('exhibitions','exhibition')]:
    for base in [ROOT/folder, ROOT/'hu'/folder, ROOT/'de-at'/folder]:
        if not base.exists(): continue
        for p in sorted(base.glob('*.html')):
            rel=p.relative_to(ROOT); s=p.read_text(encoding='utf-8'); original=s; s=remove_old(s)
            title=title_from_html(s)
            insertion=block(rel,kind,title)
            marker='<footer'
            pos=s.find(marker)
            if pos<0: pos=s.lower().rfind('</main>')
            if pos<0: pos=s.lower().rfind('</body>')
            if pos<0: continue
            s=s[:pos]+insertion+s[pos:]
            if s!=original:
                p.write_text(s,encoding='utf-8'); changed.append(rel.as_posix())
print(f'Record relationship pass updated {len(changed)} pages.')
for x in changed: print(x)
