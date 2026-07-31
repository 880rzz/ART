#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

PAGES = {
    'curators.html': {
        'lang':'en','label':'Whole-oeuvre structure','title':'One investigation, several distinct periods',
        'intro':'The archive is organised around a single long-term inquiry rather than around isolated books, exhibitions or commissions. An early, self-initiated corporate photography assignment is the point of departure. From there, each period changes the social setting, the bodies and the public context, while the central question remains the same: when does a person, a memory or a community become genuinely present?',
        'items':[
            ('I','Corporate beginnings — point of departure','The first coherent field of inquiry: discipline, role, institutional identity and the tension between appearance and truth.'),
            ('II','Human stories and historical memory','New York, women’s stories, fatherhood and the portraits connected to 1956 move the inquiry toward personal testimony and lived memory.'),
            ('III','The body as memory and recovery','Awakening, Snippets and The World of Woman examine the body after illness, intimacy, identity and turning points.'),
            ('IV','Institutions, teaching and communities','Books, exhibitions, curatorial work, education and community-building make presence a shared cultural practice.'),
            ('V','Public and leadership presence','Executive and public portraiture apply the same artistic discipline to trust, responsibility and visible leadership.')],
        'closing':'Books, exhibitions, press records, moving-image documents and community projects are evidence attached to these periods. They should be read as connected records of one oeuvre, not as separate careers.',
        'home':'Archive overview','press':'Public record','books':'Books','exhibitions':'Exhibitions'
    },
    'hu/curators.html': {
        'lang':'hu','label':'Az életmű teljes szerkezete','title':'Egyetlen kutatás, jól elkülöníthető korszakok',
        'intro':'Az archívumot nem különálló könyvek, kiállítások vagy megbízások szerint rendezi a rendszer, hanem egy hosszú távú kutatás mentén. A kiindulópont egy korai, saját kezdeményezésű vállalati fotográfiai munka volt. Innen haladva változik a társadalmi közeg, a test, az emlékezet és a nyilvánosság szerepe, miközben a központi kérdés ugyanaz marad: mikor válik egy ember, egy emlék vagy egy közösség valóban jelenlévővé?',
        'items':[
            ('I','Vállalati kezdet — a kiindulópont','Az első következetes kutatási tér: fegyelem, szerep, intézményi identitás, valamint a megjelenés és az igazság közötti feszültség.'),
            ('II','Emberi történetek és történelmi emlékezet','New York, női történetek, apaság és az 1956-hoz kapcsolódó portrék a személyes tanúságtétel és a megélt emlékezet felé viszik tovább a kutatást.'),
            ('III','A test mint emlékezet és felépülés','Az Ébredés, a Szösszenetek és A nő világa a betegség utáni testet, az intimitást, az identitást és a fordulópontokat vizsgálja.'),
            ('IV','Intézmények, oktatás és közösségek','A könyvek, kiállítások, kurátori munka, oktatás és közösségépítés a jelenlétet közösen gyakorolt kulturális formává teszik.'),
            ('V','Nyilvános és vezetői jelenlét','Az executive és közéleti portré ugyanazt az alkotói fegyelmet alkalmazza a bizalom, a felelősség és a látható vezetői jelenlét kérdésére.')],
        'closing':'A könyvek, kiállítások, sajtómegjelenések, mozgóképes dokumentumok és közösségi projektek ezeknek a korszakoknak a bizonyítékai. Nem külön pályákként, hanem egyetlen életmű összekapcsolt rekordjaiként olvasandók.',
        'home':'Archívum áttekintése','press':'Nyilvános történet','books':'Könyvek','exhibitions':'Kiállítások'
    },
    'de-at/curators.html': {
        'lang':'de','label':'Gesamtstruktur des Œuvres','title':'Eine Untersuchung, klar unterscheidbare Phasen',
        'intro':'Das Archiv ist nicht nach voneinander getrennten Büchern, Ausstellungen oder Aufträgen geordnet, sondern entlang einer langfristigen Untersuchung. Ausgangspunkt ist ein früher, selbst initiierter Unternehmensauftrag. Von dort verändern sich gesellschaftlicher Raum, Körper, Erinnerung und Öffentlichkeit, während die zentrale Frage bestehen bleibt: Wann wird ein Mensch, eine Erinnerung oder eine Gemeinschaft wirklich gegenwärtig?',
        'items':[
            ('I','Unternehmerischer Anfang — der Ausgangspunkt','Das erste konsequente Forschungsfeld: Disziplin, Rolle, institutionelle Identität und die Spannung zwischen Erscheinung und Wahrheit.'),
            ('II','Menschliche Geschichten und historisches Gedächtnis','New York, Frauengeschichten, Vaterschaft und die mit 1956 verbundenen Porträts führen die Untersuchung zu persönlichem Zeugnis und gelebter Erinnerung.'),
            ('III','Der Körper als Erinnerung und Genesung','Erwachen, Fragmente und Die Welt der Frau untersuchen den Körper nach Krankheit, Intimität, Identität und Wendepunkte.'),
            ('IV','Institutionen, Vermittlung und Gemeinschaften','Bücher, Ausstellungen, kuratorische Arbeit, Bildung und Gemeinschaftsaufbau machen Präsenz zu einer gemeinsam praktizierten kulturellen Form.'),
            ('V','Öffentliche und führungsbezogene Präsenz','Executive- und öffentliche Porträts wenden dieselbe künstlerische Disziplin auf Vertrauen, Verantwortung und sichtbare Führung an.')],
        'closing':'Bücher, Ausstellungen, Presseberichte, Bewegtbilddokumente und Gemeinschaftsprojekte sind Belege dieser Phasen. Sie sind nicht als getrennte Laufbahnen, sondern als verbundene Datensätze eines Œuvres zu lesen.',
        'home':'Archivübersicht','press':'Öffentliche Geschichte','books':'Bücher','exhibitions':'Ausstellungen'
    }
}


def prefix(rel):
    return '/hu/' if rel.startswith('hu/') else ('/de-at/' if rel.startswith('de-at/') else '/')


def remove_old(text):
    return re.sub(r'\s*<!-- OEUVRE-INTEGRITY:START -->.*?<!-- OEUVRE-INTEGRITY:END -->\s*','\n',text,flags=re.S)


def render(rel,c):
    p=prefix(rel)
    items=''.join(f'<article class="oeuvre-phase"><p class="phase-no">{n}</p><h3>{t}</h3><p>{d}</p></article>' for n,t,d in c['items'])
    return f'''\n<!-- OEUVRE-INTEGRITY:START -->
<section class="oeuvre-integrity" id="oeuvre-structure" aria-labelledby="oeuvre-structure-title"><div class="wrap">
  <div class="oeuvre-integrity-head"><p class="label">{c['label']}</p><h2 id="oeuvre-structure-title">{c['title']}</h2><p>{c['intro']}</p></div>
  <div class="oeuvre-phase-grid">{items}</div>
  <p class="oeuvre-integrity-closing">{c['closing']}</p>
  <nav class="oeuvre-integrity-links" aria-label="{c['label']}">
    <a href="{p}#presence-periods">{c['home']}</a><a href="{p}press.html">{c['press']}</a><a href="{p}#books">{c['books']}</a><a href="{p}#exhibitions">{c['exhibitions']}</a>
  </nav>
</div></section>
<!-- OEUVRE-INTEGRITY:END -->\n'''

changed=[]
for rel,c in PAGES.items():
    path=ROOT/rel
    if not path.exists(): continue
    text=path.read_text(encoding='utf-8'); original=text
    text=remove_old(text)
    marker='</main>'
    pos=text.lower().rfind(marker)
    if pos<0: continue
    text=text[:pos]+render(rel,c)+text[pos:]
    if text!=original:
        path.write_text(text,encoding='utf-8'); changed.append(rel)
print(f'Oeuvre integrity pass updated {len(changed)} curator dossiers.')
for rel in changed: print(rel)
