#!/usr/bin/env python3
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]

LANG = {
    'en': {
        'label':'Curatorial record','heading':'How this chapter belongs to the oeuvre',
        'origin':'Origin and scope','question':'Research question','status':'Archival status','reading':'How to read this record',
        'book_origin':'The book gathers a project into a durable editorial form. It preserves images, testimonies and contextual material as one research record rather than as an isolated publication.',
        'exh_origin':'The exhibition translates a body of work into a public encounter. Its significance lies not only in the displayed images, but also in the place, audience and documentary trail surrounding it.',
        'book_question':'How can photography hold a person’s presence without reducing that person to an illustration of a theme?',
        'exh_question':'What changes when a photographic inquiry enters a shared physical or institutional space?',
        'status_text':'This page is an evolving archive record. Confirmed bibliographic, exhibition and source data are kept distinct from interpretation; missing facts are not invented.',
        'reading_text':'Read this page together with its presence-research period, connected exhibition or book, press sources and curatorial dossier. Together they form the complete chapter.'
    },
    'hu': {
        'label':'Kurátori rekord','heading':'Hogyan illeszkedik ez a fejezet az életműbe',
        'origin':'Keletkezés és hatókör','question':'Kutatási kérdés','status':'Archívumi státusz','reading':'Hogyan olvasandó a rekord',
        'book_origin':'A könyv egy projektet tartós szerkesztői formába rendez. A képeket, tanúságtételeket és háttéranyagokat nem különálló kiadványként, hanem egyetlen kutatási rekordként őrzi meg.',
        'exh_origin':'A kiállítás egy képsorozatot nyilvános találkozássá alakít. Jelentőségét nemcsak a bemutatott képek, hanem a helyszín, a közönség és a hozzá kapcsolódó dokumentáció együtt adja.',
        'book_question':'Hogyan képes a fotográfia megőrizni egy ember jelenlétét anélkül, hogy egy téma illusztrációjává egyszerűsítené?',
        'exh_question':'Mi változik meg akkor, amikor egy fotográfiai kutatás közös fizikai vagy intézményi térbe kerül?',
        'status_text':'Ez az oldal folyamatosan bővülő archívumrekord. Az ellenőrzött bibliográfiai, kiállítási és forrásadatok elkülönülnek az értelmezéstől; hiányzó tényeket a rendszer nem talál ki.',
        'reading_text':'A rekord a hozzá tartozó jelenlétkutatási korszakkal, könyv- vagy kiállításpárjával, sajtóforrásaival és a kurátori dossziéval együtt alkot teljes fejezetet.'
    },
    'de': {
        'label':'Kuratorischer Datensatz','heading':'Wie dieses Kapitel zum Gesamtwerk gehört',
        'origin':'Entstehung und Umfang','question':'Forschungsfrage','status':'Archivstatus','reading':'Wie dieser Datensatz zu lesen ist',
        'book_origin':'Das Buch überführt ein Projekt in eine dauerhafte editorische Form. Bilder, Zeugnisse und Kontextmaterial werden nicht als isolierte Publikation, sondern als gemeinsamer Forschungsdatensatz bewahrt.',
        'exh_origin':'Die Ausstellung verwandelt eine Werkgruppe in eine öffentliche Begegnung. Ihre Bedeutung entsteht nicht nur aus den gezeigten Bildern, sondern auch aus Ort, Publikum und dokumentarischer Spur.',
        'book_question':'Wie kann Fotografie die Präsenz eines Menschen bewahren, ohne ihn zur Illustration eines Themas zu reduzieren?',
        'exh_question':'Was verändert sich, wenn eine fotografische Untersuchung in einen gemeinsamen physischen oder institutionellen Raum tritt?',
        'status_text':'Diese Seite ist ein fortlaufend ergänzter Archivdatensatz. Verifizierte bibliografische, ausstellungsbezogene und quellenbasierte Angaben bleiben von Interpretation getrennt; fehlende Fakten werden nicht erfunden.',
        'reading_text':'Dieser Datensatz bildet erst zusammen mit seiner Phase der Präsenzforschung, dem verbundenen Buch oder der Ausstellung, den Pressequellen und dem kuratorischen Dossier ein vollständiges Kapitel.'
    }
}

def lang_for(path):
    rel = path.relative_to(ROOT).as_posix()
    return 'hu' if rel.startswith('hu/') else ('de' if rel.startswith('de-at/') else 'en')

def clean(v):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', v or '')).strip()

def metadata(text):
    title = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S|re.I)
    desc = re.search(r'<meta name="description" content="([^"]*)"', text, re.I)
    year = re.search(r'\b(19|20)\d{2}(?:[–-](?:19|20)?\d{2})?\b', clean(title.group(1)) if title else '')
    return clean(title.group(1)) if title else '', html.unescape(desc.group(1)) if desc else '', year.group(0) if year else ''

def remove_old(text):
    return re.sub(r'\s*<!-- RECORD-DEPTH:START -->.*?<!-- RECORD-DEPTH:END -->\s*', '\n', text, flags=re.S)

def render(path, kind, title, desc, year):
    t = LANG[lang_for(path)]
    origin = t['book_origin'] if kind == 'book' else t['exh_origin']
    question = t['book_question'] if kind == 'book' else t['exh_question']
    record_summary = desc or title
    date_line = f'<p class="record-depth-date">{html.escape(year)}</p>' if year else ''
    return f'''\n<!-- RECORD-DEPTH:START -->
<section class="record-depth" aria-labelledby="record-depth-title"><div class="wrap">
  <div class="record-depth-head"><p class="label">{t['label']}</p><h2 id="record-depth-title">{t['heading']}</h2><p>{html.escape(record_summary)}</p>{date_line}</div>
  <div class="record-depth-grid">
    <article><h3>{t['origin']}</h3><p>{origin}</p></article>
    <article><h3>{t['question']}</h3><p>{question}</p></article>
    <article><h3>{t['status']}</h3><p>{t['status_text']}</p></article>
    <article><h3>{t['reading']}</h3><p>{t['reading_text']}</p></article>
  </div>
</div></section>
<!-- RECORD-DEPTH:END -->\n'''

changed=[]
for folder, kind in [('books','book'),('exhibitions','exhibition')]:
    for base in (ROOT/folder, ROOT/'hu'/folder, ROOT/'de-at'/folder):
        if not base.exists(): continue
        for path in sorted(base.glob('*.html')):
            text=path.read_text(encoding='utf-8'); original=text; text=remove_old(text)
            title, desc, year = metadata(text)
            marker='<!-- RECORD-RELATIONSHIPS:START -->'
            pos=text.find(marker)
            if pos < 0: pos=text.find('<footer')
            if pos < 0: continue
            text=text[:pos]+render(path,kind,title,desc,year)+text[pos:]
            if text != original:
                path.write_text(text,encoding='utf-8'); changed.append(path.relative_to(ROOT).as_posix())
print(f'Record depth pass updated {len(changed)} pages.')
for item in changed: print(item)
