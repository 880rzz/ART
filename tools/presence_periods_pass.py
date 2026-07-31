#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PAGES = {
    'index.html': {
        'label': 'Oeuvre structure',
        'heading': 'Periods in the investigation of presence',
        'lead': 'The work did not develop as a sequence of unrelated projects. It began with an early, self-initiated corporate photography assignment and moved through distinct periods in which the same question returned in different human, historical and institutional situations.',
        'periods': [
            ('I · Origin', 'Corporate beginnings', 'The starting point of the oeuvre: photography as sustained attention rather than surface description.'),
            ('II · Human stories', 'Identity, family and historical memory', 'New York, women’s stories, fatherhood and the portraits connected to 1956 made individual testimony central.'),
            ('III · Body and recovery', 'The body as lived memory', 'Awakening, Snippets and The World of Woman brought illness, vulnerability, recovery and dignity into one continuous field of work.'),
            ('IV · Institutions and communities', 'Presence shared with others', 'Books, exhibitions, curatorial work, teaching and the Vienna photo community extended the practice beyond the individual photograph.'),
            ('V · Public and leadership presence', 'The portrait in public life', 'The later work examines how a person remains recognisable within public, professional and historical roles, including executive portraiture and the EUFÓRIA portrait.'),
        ],
        'books': 'Books and editions',
        'exhibitions': 'Exhibitions and public presentation',
        'press': 'Press and moving-image evidence',
        'curators': 'Full curatorial dossier',
    },
    'hu/index.html': {
        'label': 'Életműstruktúra',
        'heading': 'A jelenlét kutatásának korszakai',
        'lead': 'A munkák nem egymástól független projektek soraként alakultak. A kiindulópont egy korai, saját kezdeményezésű vállalati fotográfiai munka volt, majd jól elkülöníthető korszakok következtek, amelyekben ugyanaz a kérdés más emberi, történelmi és intézményi helyzetekben tért vissza.',
        'periods': [
            ('I · Kiindulópont', 'Vállalati kezdet', 'Az életmű origója: a fotográfia nem felszíni leírásként, hanem tartós figyelemként kezdett működni.'),
            ('II · Emberi történetek', 'Identitás, család és történelmi emlékezet', 'New York, a női történetek, az apaság és az 1956-hoz kapcsolódó portrék az egyéni tanúságtételt állították középpontba.'),
            ('III · Test és felépülés', 'A test mint megélt emlékezet', 'Az Ébredés, a Töredékek és A nő világa a betegséget, a kiszolgáltatottságot, a felépülést és a méltóságot egyetlen folyamatként vizsgálta.'),
            ('IV · Intézmények és közösségek', 'A jelenlét megosztása', 'A könyvek, kiállítások, a kurátori munka, az oktatás és a bécsi fotós közösség a gyakorlatot az egyes képeken túlra terjesztette.'),
            ('V · Nyilvános és vezetői jelenlét', 'A portré a közéletben', 'A későbbi munkák azt vizsgálják, hogyan maradhat valaki felismerhető a nyilvános, szakmai és történelmi szerepeiben, ideértve az executive portrét és az EUFÓRIA portrét.'),
        ],
        'books': 'Könyvek és kiadványok',
        'exhibitions': 'Kiállítások és nyilvános bemutatások',
        'press': 'Sajtó- és mozgóképes források',
        'curators': 'Teljes kurátori dosszié',
    },
    'de-at/index.html': {
        'label': 'Werkstruktur',
        'heading': 'Perioden der Erforschung von Präsenz',
        'lead': 'Die Arbeiten entstanden nicht als Folge voneinander unabhängiger Projekte. Ausgangspunkt war ein früher, selbst initiierter Unternehmensauftrag. Danach folgten klar unterscheidbare Perioden, in denen dieselbe Frage in unterschiedlichen menschlichen, historischen und institutionellen Situationen wiederkehrte.',
        'periods': [
            ('I · Ausgangspunkt', 'Unternehmerischer Anfang', 'Der Ursprung des Werks: Fotografie begann als anhaltende Aufmerksamkeit statt als bloße Beschreibung von Oberfläche.'),
            ('II · Menschliche Geschichten', 'Identität, Familie und historisches Gedächtnis', 'New York, Geschichten von Frauen, Vaterschaft und die mit 1956 verbundenen Porträts rückten das persönliche Zeugnis ins Zentrum.'),
            ('III · Körper und Genesung', 'Der Körper als gelebte Erinnerung', 'Awakening, Fragmente und Die Welt der Frau verbanden Krankheit, Verletzlichkeit, Genesung und Würde zu einem fortlaufenden Untersuchungsfeld.'),
            ('IV · Institutionen und Gemeinschaften', 'Geteilte Präsenz', 'Bücher, Ausstellungen, kuratorische Arbeit, Vermittlung und die Wiener Fotogemeinschaft erweiterten die Praxis über das einzelne Bild hinaus.'),
            ('V · Öffentliche und führende Präsenz', 'Das Porträt im öffentlichen Leben', 'Die späteren Arbeiten untersuchen, wie ein Mensch in öffentlichen, beruflichen und historischen Rollen erkennbar bleibt, einschließlich Executive-Porträts und des EUFÓRIA-Porträts.'),
        ],
        'books': 'Bücher und Editionen',
        'exhibitions': 'Ausstellungen und öffentliche Präsentationen',
        'press': 'Presse- und Bewegtbildquellen',
        'curators': 'Vollständiges kuratorisches Dossier',
    },
}


def section(c, rel):
    prefix = '' if rel == 'index.html' else ''
    cards = ''.join(
        f'<article class="presence-period"><p class="label">{no}</p><h3>{title}</h3><p>{copy}</p></article>'
        for no, title, copy in c['periods']
    )
    return f'''<section id="presence-periods" class="tone-a presence-periods"><div class="wrap">
  <div class="section-head"><p class="label">{c['label']}</p><h2>{c['heading']}</h2><p class="lead">{c['lead']}</p></div>
  <div class="presence-period-grid">{cards}</div>
  <nav class="presence-period-links" aria-label="Oeuvre documentation">
    <a href="#books">{c['books']} →</a>
    <a href="#exhibitions">{c['exhibitions']} →</a>
    <a href="press.html">{c['press']} →</a>
    <a href="curators.html">{c['curators']} →</a>
  </nav>
</div></section>'''

changed=[]
for rel,c in PAGES.items():
    p=ROOT/rel
    if not p.exists():
        continue
    s=p.read_text(encoding='utf-8')
    original=s
    block=section(c,rel)
    if '<section id="presence-periods"' in s:
        start=s.index('<section id="presence-periods"')
        end=s.index('</section>',start)+len('</section>')
        s=s[:start]+block+s[end:]
    else:
        marker='<section id="books"'
        pos=s.find(marker)
        if pos<0:
            marker='<section id="exhibitions"'
            pos=s.find(marker)
        if pos>=0:
            s=s[:pos]+block+s[pos:]
    if s!=original:
        p.write_text(s,encoding='utf-8')
        changed.append(rel)
print(f'Presence-period structure updated {len(changed)} home pages.')
for rel in changed: print(rel)
