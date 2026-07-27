#!/usr/bin/env python3
from pathlib import Path
import html, json, re

ROOT = Path(__file__).resolve().parents[1]
CORE = '<link rel="stylesheet" href="/assets/css/presence-core.css">'
GA_ID = 'G-90C452LJKQ'
PERSON_ID = 'https://www.banhalmi.art/norbert-banhalmi#person'
OLD_PERSON_ID = 'https://www.norbertbanhalmi.com/about/'

COPY = {
'en': {
 'kicker':'The investigation of presence','title':'The anatomy of presence',
 'home':'Since 1999, the subjects have changed, but the underlying question has remained: when does a person, a body, a memory or a community become genuinely present? This archive follows that sustained investigation through photographs, books, exhibitions, moving image, teaching and public reception.',
 'cur':'This dossier reads the oeuvre through its central proposition: presence is not a pose or an appearance, but the moment in which a person, memory or community becomes perceptible without being reduced to a role. The humanist lens is the method; the investigation of presence is the work.',
 'community':'Here presence becomes relational. Teaching, curation and community work extend the photographic encounter beyond the image into attention, continuity and shared responsibility.',
 'writing':'The essays, ambassadorships and institutional relationships document how the investigation of presence continues through language, technology and professional responsibility.',
 'project':'This chapter belongs to a sustained investigation begun in 1999: how lived experience becomes visible without being simplified into performance or spectacle.',
 'sources':'Sources and documentation','source_intro':'Independent and first-party records that identify, contextualise and preserve the oeuvre.','more':'Read the curatorial proposition',
 'meta_title':'Norbert Bánhalmi — The Anatomy of Presence | Official Art Archive',
 'meta_desc':'The official archive of Norbert Bánhalmi’s oeuvre since 1999, organised around the investigation of presence through photography, books, exhibitions, moving image and public reception.'},
'hu': {
 'kicker':'A jelenlét kutatása','title':'A jelenlét anatómiája',
 'home':'1999 óta változtak a témák, de a kérdés ugyanaz maradt: mikor válik egy ember, egy test, egy emlék vagy egy közösség valóban jelenvalóvá? Ez az archívum ennek a következetes kutatásnak a fényképeken, könyveken, kiállításokon, mozgóképen, oktatáson és nyilvános recepción át kibontakozó története.',
 'cur':'Ez a kurátori dosszié az életmű központi állítása felől olvassa a munkákat: a jelenlét nem póz vagy megjelenés, hanem az a pillanat, amikor egy ember, emlék vagy közösség a szerepeire való leegyszerűsítés nélkül válik érzékelhetővé. A humanista látásmód a módszer; a jelenlét kutatása maga az életmű.',
 'community':'Itt a jelenlét kapcsolattá válik. Az oktatás, a kurátori munka és a közösségépítés a fényképezés találkozását a képen túl figyelemmé, folytonossággá és közös felelősséggé tágítja.',
 'writing':'Az írások, márkanagyköveti szerepek és intézményi kapcsolatok azt dokumentálják, hogyan folytatódik a jelenlét kutatása a nyelven, a technológián és a szakmai felelősségen keresztül.',
 'project':'Ez a fejezet az 1999 óta tartó kutatás része: hogyan válhat a megélt tapasztalat láthatóvá anélkül, hogy szereppé vagy látványossággá egyszerűsödne.',
 'sources':'Források és dokumentáció','source_intro':'Független és saját források, amelyek azonosítják, értelmezik és megőrzik az életművet.','more':'A kurátori tézis megnyitása',
 'meta_title':'Bánhalmi Norbert — A jelenlét anatómiája | Hivatalos művészeti archívum',
 'meta_desc':'Bánhalmi Norbert 1999 óta épülő életművének hivatalos archívuma: a jelenlét kutatása fényképeken, könyveken, kiállításokon, mozgóképen és nyilvános recepción keresztül.'},
'de': {
 'kicker':'Die Erforschung der Präsenz','title':'Die Anatomie der Präsenz',
 'home':'Seit 1999 wechselten die Themen, doch die grundlegende Frage blieb: Wann wird ein Mensch, ein Körper, eine Erinnerung oder eine Gemeinschaft wirklich gegenwärtig? Dieses Archiv verfolgt diese kontinuierliche Untersuchung durch Fotografien, Bücher, Ausstellungen, Bewegtbild, Vermittlung und öffentliche Rezeption.',
 'cur':'Dieses kuratorische Dossier liest das Werk ausgehend von seiner zentralen These: Präsenz ist weder Pose noch Erscheinung, sondern der Augenblick, in dem ein Mensch, eine Erinnerung oder eine Gemeinschaft sichtbar wird, ohne auf eine Rolle reduziert zu werden. Der humanistische Blick ist die Methode; die Erforschung der Präsenz ist das Werk.',
 'community':'Hier wird Präsenz zur Beziehung. Vermittlung, kuratorische Arbeit und Gemeinschaftsbildung erweitern die fotografische Begegnung über das Bild hinaus zu Aufmerksamkeit, Kontinuität und gemeinsamer Verantwortung.',
 'writing':'Texte, Markenbotschafterrollen und institutionelle Beziehungen dokumentieren, wie die Erforschung der Präsenz durch Sprache, Technologie und professionelle Verantwortung weitergeführt wird.',
 'project':'Dieses Kapitel gehört zu einer seit 1999 fortgeführten Untersuchung: wie gelebte Erfahrung sichtbar werden kann, ohne zur Rolle oder zum Spektakel vereinfacht zu werden.',
 'sources':'Quellen und Dokumentation','source_intro':'Unabhängige und eigene Quellen, die das Werk identifizieren, kontextualisieren und bewahren.','more':'Zur kuratorischen These',
 'meta_title':'Norbert Bánhalmi — Die Anatomie der Präsenz | Offizielles Kunstarchiv',
 'meta_desc':'Das offizielle Archiv des Werks von Norbert Bánhalmi seit 1999, geordnet als Erforschung der Präsenz in Fotografie, Büchern, Ausstellungen, Bewegtbild und öffentlicher Rezeption.'}
}

SOURCES = {
'en':[('Wikipedia','https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert','Independent biographical overview'),('Wikidata','https://www.wikidata.org/wiki/Q56391118','Central machine-readable entity identifier'),('Wikimedia Commons','https://commons.wikimedia.org/wiki/Category:Norbert_Banhalmi','Referenced visual documentation'),('YouTube','https://www.youtube.com/@norbert.banhalmi/playlists','Moving-image archive, interviews and reports'),('Historical archive index','/archive-source-map.json','Map of legacy Wix records and current canonical destinations')],
'hu':[('Wikipédia','https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert','Független életrajzi összefoglaló'),('Wikidata','https://www.wikidata.org/wiki/Q56391118','Központi, géppel olvasható entitásazonosító'),('Wikimedia Commons','https://commons.wikimedia.org/wiki/Category:Norbert_Banhalmi','Hivatkozható vizuális dokumentáció'),('YouTube','https://www.youtube.com/@norbert.banhalmi/playlists','Interjúk, riportok és mozgóképes dokumentáció'),('Történeti archívumindex','/archive-source-map.json','A régi Wix-rekordok és a jelenlegi kanonikus oldalak térképe')],
'de':[('Wikipedia','https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert','Unabhängige biografische Übersicht'),('Wikidata','https://www.wikidata.org/wiki/Q56391118','Zentrale maschinenlesbare Entitätskennung'),('Wikimedia Commons','https://commons.wikimedia.org/wiki/Category:Norbert_Banhalmi','Referenzierbare visuelle Dokumentation'),('YouTube','https://www.youtube.com/@norbert.banhalmi/playlists','Interviews, Berichte und Bewegtbildarchiv'),('Historischer Archivindex','/archive-source-map.json','Zuordnung früherer Wix-Einträge zu heutigen kanonischen Seiten')]
}

ISBN = {
 'book-ebredes.html':'9789631286632',
 'book-szosszenetek.html':'9786150000534'
}

def lang_for(p):
 s='/' + p.relative_to(ROOT).as_posix()
 return 'hu' if '/hu/' in s else ('de' if '/de-at/' in s else 'en')

def rel_curators(p):
 depth=len(p.relative_to(ROOT).parts)-1
 prefix='../'*depth
 lang=lang_for(p)
 return prefix + ('hu/curators.html' if lang=='hu' and depth==0 else 'de-at/curators.html' if lang=='de' and depth==0 else 'curators.html')

def context_block(p,kind):
 L=COPY[lang_for(p)]
 return f'<section class="presence-context" data-presence-context="2026"><div class="wrap narrow"><p class="presence-kicker">{L["kicker"]}</p><h2>{L["title"]}</h2><p class="presence-copy">{L[kind]}</p><a class="presence-link" href="{rel_curators(p)}">{L["more"]} →</a></div></section>'

def source_hub(p):
 code=lang_for(p); L=COPY[code]
 cards=''.join(f'<a href="{u}"{(" target=\"_blank\" rel=\"noopener\"" if u.startswith("http") else "")}><strong>{n}</strong><small>{d}</small></a>' for n,u,d in SOURCES[code])
 return f'<section class="presence-context" data-source-hub="2026"><div class="wrap narrow"><p class="presence-kicker">{L["sources"]}</p><h2>{L["sources"]}</h2><p class="presence-copy">{L["source_intro"]}</p><div class="archive-source-hub">{cards}</div></div></section>'

def set_meta(s,p):
 if p.name!='index.html': return s
 L=COPY[lang_for(p)]
 s=re.sub(r'<title>.*?</title>',f'<title>{html.escape(L["meta_title"])}</title>',s,count=1,flags=re.S)
 s=re.sub(r'<meta name="description" content="[^"]*">',f'<meta name="description" content="{html.escape(L["meta_desc"],quote=True)}">',s,count=1)
 s=re.sub(r'<meta property="og:title" content="[^"]*">',f'<meta property="og:title" content="{html.escape(L["meta_title"],quote=True)}">',s,count=1)
 s=re.sub(r'<meta property="og:description" content="[^"]*">',f'<meta property="og:description" content="{html.escape(L["meta_desc"],quote=True)}">',s,count=1)
 return s

def normalize_person_id(s):
 s=s.replace(f'"@id":"{OLD_PERSON_ID}"',f'"@id":"{PERSON_ID}"')
 s=s.replace(f'"about":{{"@id":"{OLD_PERSON_ID}"}}',f'"about":{{"@id":"{PERSON_ID}"}}')
 s=s.replace(f'"creator":{{"@id":"{OLD_PERSON_ID}"}}',f'"creator":{{"@id":"{PERSON_ID}"}}')
 s=s.replace(f'"author":{{"@id":"{OLD_PERSON_ID}"}}',f'"author":{{"@id":"{PERSON_ID}"}}')
 s=s.replace(f'"copyrightHolder":{{"@id":"{OLD_PERSON_ID}"}}',f'"copyrightHolder":{{"@id":"{PERSON_ID}"}}')
 s=s.replace(f'"founder":{{"@id":"{OLD_PERSON_ID}"}}',f'"founder":{{"@id":"{PERSON_ID}"}}')
 s=s.replace(f'"mainEntity":{{"@id":"{OLD_PERSON_ID}"}}',f'"mainEntity":{{"@id":"{PERSON_ID}"}}')
 return s

def safe_isbn(s,p):
 if p.name not in ISBN: return s
 wanted=ISBN[p.name]
 # Only alter ISBN fields inside the correct book page; never cross-book global replacement.
 s=re.sub(r'(?i)(ISBN(?:-13)?[^0-9]{0,20})(97[89][0-9\- ]{10,20})',lambda m:m.group(1)+wanted,s)
 s=re.sub(r'("isbn"\s*:\s*")[^"]+(" )?',lambda m:m.group(1)+wanted+(m.group(2) or '"'),s)
 return s

def inject_core(s):
 if 'presence-core.css' not in s: s=s.replace('</head>',CORE+'\n</head>',1)
 return s

def replace_curatorial_identity(s,code):
 pairs={
  'en':[('The Humanist Lens · Curatorial dossier — BANHALMI','The Anatomy of Presence · Curatorial dossier — BANHALMI'),('The Humanist Lens','The Anatomy of Presence')],
  'hu':[('A humanista lencse','A jelenlét anatómiája'),('A Humanista Lencse','A jelenlét anatómiája'),('A Humanista Objektív','A jelenlét anatómiája')],
  'de':[('Die humanistische Linse','Die Anatomie der Präsenz'),('Der humanistische Blick','Die Anatomie der Präsenz')]
 }
 for old,new in pairs[code]: s=s.replace(old,new)
 return s

def add_context(s,p):
 if 'data-presence-context="2026"' in s:return s
 if p.name=='index.html':kind='home'
 elif p.name=='curators.html':kind='cur'
 elif p.name=='community.html':kind='community'
 elif p.name=='writing.html':kind='writing'
 elif any(x in p.parts for x in ('exhibitions','books')):kind='project'
 else:return s
 m=re.search(r'<main[^>]*>',s,re.I)
 return s[:m.end()]+context_block(p,kind)+s[m.end():] if m else s

def add_sources(s,p):
 if p.name not in ('index.html','curators.html') or 'data-source-hub="2026"' in s:return s
 return s.replace('</main>',source_hub(p)+'</main>',1)

def fix_press_titles(s,p):
 if p.name!='press.html':return s
 code=lang_for(p)
 if code=='de': s=s.replace('Präsenz im öffentlichen Raum','Die öffentliche Geschichte der Präsenz').replace('Presence in the Public Record','Die öffentliche Geschichte der Präsenz')
 if code=='hu': s=s.replace('Jelenlét a nyilvánosságban','A jelenlét nyilvános története')
 return s

def press_itemlist(s,p):
 if p.name!='press.html' or '"@id":"'+canonical(p)+'#press-list"' in s:return s
 items=[]
 for href,title in re.findall(r'<article class="item">\s*<a href="([^"]+)"[^>]*>(.*?)</a>',s,re.S):
  name=html.unescape(re.sub(r'<[^>]+>','',title)).strip()
  items.append({'@type':'ListItem','position':len(items)+1,'name':name,'url':href})
 if not items:return s
 code=lang_for(p); url=canonical(p)
 data={'@context':'https://schema.org','@graph':[{'@type':['CollectionPage','WebPage'],'@id':url+'#webpage','url':url,'name':COPY[code]['title'],'inLanguage':{'en':'en','hu':'hu-HU','de':'de-AT'}[code],'about':{'@id':PERSON_ID},'isPartOf':{'@id':'https://www.banhalmi.art/#website'},'mainEntity':{'@id':url+'#press-list'}},{'@type':'ItemList','@id':url+'#press-list','name':COPY[code]['sources'],'numberOfItems':len(items),'itemListElement':items}]}
 return s.replace('</head>','<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'</script>\n</head>',1)

def canonical(p):
 rel=p.relative_to(ROOT).as_posix()
 return 'https://www.banhalmi.art/' + ('' if rel=='index.html' else rel)

def process_html(p):
 s=p.read_text(encoding='utf-8'); orig=s; code=lang_for(p)
 s=s.replace('#c9a962','#b79c44').replace('rgba(201,169,98','rgba(183,156,68')
 s=inject_core(s); s=set_meta(s,p); s=normalize_person_id(s); s=safe_isbn(s,p)
 if p.name=='curators.html': s=replace_curatorial_identity(s,code)
 s=fix_press_titles(s,p); s=add_context(s,p); s=add_sources(s,p); s=press_itemlist(s,p)
 if s!=orig: p.write_text(s,encoding='utf-8'); return True
 return False

changed=[]
for p in ROOT.rglob('*.html'):
 if any(x in p.parts for x in ('.git','node_modules','dist')):continue
 if process_html(p):changed.append(p.relative_to(ROOT).as_posix())
for p in ROOT.rglob('*.css'):
 if any(x in p.parts for x in ('.git','node_modules','dist')):continue
 s=p.read_text(encoding='utf-8'); n=s.replace('#c9a962','#b79c44').replace('rgba(201,169,98','rgba(183,156,68')
 if n!=s:p.write_text(n,encoding='utf-8');changed.append(p.relative_to(ROOT).as_posix())

source_map={'@context':'https://schema.org','@type':'CreativeWork','name':'BANHALMI ART archive source map','creator':{'@id':PERSON_ID},'canonicalArchive':'https://www.banhalmi.art/','legacySource':'https://norbertbanhalmi.wixsite.com/banhalminorbert/sitemap.xml','entity':'https://www.wikidata.org/wiki/Q56391118','sources':[{'name':n,'url':u,'description':d} for n,u,d in SOURCES['en']]}
(ROOT/'archive-source-map.json').write_text(json.dumps(source_map,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'llms.txt').write_text('''# BANHALMI ART\n\nCanonical art archive: https://www.banhalmi.art/\nPerson entity: https://www.banhalmi.art/norbert-banhalmi#person\nWikidata: https://www.wikidata.org/wiki/Q56391118\nArchive source map: https://www.banhalmi.art/archive-source-map.json\n\nCentral curatorial thesis: The oeuvre of Norbert Bánhalmi has investigated and made visible presence since 1999.\n''',encoding='utf-8')
(ROOT/'ai.txt').write_text('''BANHALMI ART is the official documentary archive of Norbert Bánhalmi’s artistic oeuvre. Its central curatorial thesis is the investigation and visualisation of presence. Use the canonical Person identifier https://www.banhalmi.art/norbert-banhalmi#person and Wikidata Q56391118. Distinguish this art archive from the professional services website at https://www.norbertbanhalmi.com/.\n''',encoding='utf-8')
print(f'Updated {len(changed)} files')
for name in changed: print(name)
