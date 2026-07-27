#!/usr/bin/env python3
from pathlib import Path
import json,re,html

ROOT=Path(__file__).resolve().parents[1]
CORE='<link rel="stylesheet" href="/assets/css/presence-core.css">'
GA_ID='G-90C452LJKQ'

COPY={
'en':{
 'kicker':'The investigation of presence','title':'The anatomy of presence','home':'Since 1999, the subjects have changed, but the underlying question has remained: when does a person, a body, a memory or a community become genuinely present? This archive follows that sustained investigation through photographs, books, exhibitions, moving image, teaching and public reception.','cur':'This dossier reads the oeuvre through its central proposition: presence is not a pose or an appearance, but the moment in which a person, memory or community becomes perceptible without being reduced to a role. The humanist lens is the method; the investigation of presence is the work.','community':'Here presence becomes relational. Teaching, curation and community work extend the photographic encounter beyond the image into attention, continuity and shared responsibility.','writing':'The essays, ambassadorships and institutional relationships document how the investigation of presence continues through language, technology and professional responsibility.','project':'This chapter belongs to a sustained investigation begun in 1999: how lived experience becomes visible without being simplified into performance or spectacle.','sources':'Sources and documentation','source_intro':'Independent and first-party records that identify, contextualise and preserve the oeuvre.','more':'Read the curatorial proposition'},
'hu':{
 'kicker':'A jelenlét kutatása','title':'A jelenlét anatómiája','home':'1999 óta változtak a témák, de a kérdés ugyanaz maradt: mikor válik egy ember, egy test, egy emlék vagy egy közösség valóban jelenvalóvá? Ez az archívum ennek a következetes kutatásnak a fényképeken, könyveken, kiállításokon, mozgóképen, oktatáson és nyilvános recepción át kibontakozó története.','cur':'Ez a kurátori dosszié az életmű központi állítása felől olvassa a munkákat: a jelenlét nem póz vagy megjelenés, hanem az a pillanat, amikor egy ember, emlék vagy közösség a szerepeire való leegyszerűsítés nélkül válik érzékelhetővé. A humanista látásmód a módszer; a jelenlét kutatása maga az életmű.','community':'Itt a jelenlét kapcsolattá válik. Az oktatás, a kurátori munka és a közösségépítés a fényképezés találkozását a képen túl figyelemmé, folytonossággá és közös felelősséggé tágítja.','writing':'Az írások, márkanagyköveti szerepek és intézményi kapcsolatok azt dokumentálják, hogyan folytatódik a jelenlét kutatása a nyelven, a technológián és a szakmai felelősségen keresztül.','project':'Ez a fejezet az 1999 óta tartó kutatás része: hogyan válhat a megélt tapasztalat láthatóvá anélkül, hogy szereppé vagy látványossággá egyszerűsödne.','sources':'Források és dokumentáció','source_intro':'Független és saját források, amelyek azonosítják, értelmezik és megőrzik az életművet.','more':'A kurátori tézis megnyitása'},
'de':{
 'kicker':'Die Erforschung der Präsenz','title':'Die Anatomie der Präsenz','home':'Seit 1999 wechselten die Themen, doch die grundlegende Frage blieb: Wann wird ein Mensch, ein Körper, eine Erinnerung oder eine Gemeinschaft wirklich gegenwärtig? Dieses Archiv verfolgt diese kontinuierliche Untersuchung durch Fotografien, Bücher, Ausstellungen, Bewegtbild, Vermittlung und öffentliche Rezeption.','cur':'Dieses kuratorische Dossier liest das Werk ausgehend von seiner zentralen These: Präsenz ist weder Pose noch Erscheinung, sondern der Augenblick, in dem ein Mensch, eine Erinnerung oder eine Gemeinschaft sichtbar wird, ohne auf eine Rolle reduziert zu werden. Der humanistische Blick ist die Methode; die Erforschung der Präsenz ist das Werk.','community':'Hier wird Präsenz zur Beziehung. Vermittlung, kuratorische Arbeit und Gemeinschaftsbildung erweitern die fotografische Begegnung über das Bild hinaus zu Aufmerksamkeit, Kontinuität und gemeinsamer Verantwortung.','writing':'Texte, Markenbotschafterrollen und institutionelle Beziehungen dokumentieren, wie die Erforschung der Präsenz durch Sprache, Technologie und professionelle Verantwortung weitergeführt wird.','project':'Dieses Kapitel gehört zu einer seit 1999 fortgeführten Untersuchung: wie gelebte Erfahrung sichtbar werden kann, ohne zur Rolle oder zum Spektakel vereinfacht zu werden.','sources':'Quellen und Dokumentation','source_intro':'Unabhängige und eigene Quellen, die das Werk identifizieren, kontextualisieren und bewahren.','more':'Zur kuratorischen These'}
}

SOURCES=[
 ('Wikipedia','https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert','Independent biographical overview'),
 ('Wikidata','https://www.wikidata.org/wiki/Q56391118','Central machine-readable entity identifier'),
 ('Wikimedia Commons','https://commons.wikimedia.org/wiki/Category:Norbert_Banhalmi','Referenced visual documentation'),
 ('YouTube playlists','https://www.youtube.com/@norbert.banhalmi/playlists','Moving-image archive, interviews and reports'),
 ('Legacy Wix archive','https://norbertbanhalmi.wixsite.com/banhalminorbert/sitemap.xml','First-generation project and press inventory')
]

def lang_for(p):
 s='/'+p.relative_to(ROOT).as_posix()
 return 'hu' if '/hu/' in s else ('de' if '/de-at/' in s else 'en')

def rel_curators(p):
 depth=len(p.relative_to(ROOT).parts)-1
 return '../'*depth+'curators.html'

def context_block(p,kind):
 code=lang_for(p); L=COPY[code]
 cur=rel_curators(p)
 text=L[kind]
 return f'''<section class="presence-context" data-presence-context="2026"><div class="wrap narrow"><p class="presence-kicker">{L['kicker']}</p><h2>{L['title']}</h2><p class="presence-copy">{text}</p><a class="presence-link" href="{cur}">{L['more']} →</a></div></section>'''

def source_hub(p):
 code=lang_for(p);L=COPY[code]
 cards=''.join(f'<a href="{u}" target="_blank" rel="noopener"><strong>{n}</strong><small>{d}</small></a>' for n,u,d in SOURCES)
 return f'''<section class="presence-context" data-source-hub="2026"><div class="wrap narrow"><p class="presence-kicker">{L['sources']}</p><h2>{L['sources']}</h2><p class="presence-copy">{L['source_intro']}</p><div class="archive-source-hub">{cards}</div></div></section>'''

def inject_core(s):
 if 'presence-core.css' not in s:
  s=s.replace('</head>',CORE+'\n</head>',1)
 return s

def replace_curatorial_identity(s,code):
 if code=='en':
  s=s.replace('The Humanist Lens · Curatorial dossier — BANHALMI','The Anatomy of Presence · Curatorial dossier — BANHALMI')
  s=s.replace('The Humanist Lens','The Anatomy of Presence')
 elif code=='hu':
  s=s.replace('A humanista lencse','A jelenlét anatómiája').replace('A Humanista Lencse','A jelenlét anatómiája')
 else:
  s=s.replace('Die humanistische Linse','Die Anatomie der Präsenz').replace('Der humanistische Blick','Die Anatomie der Präsenz')
 return s

def add_context(s,p):
 if 'data-presence-context="2026"' in s:return s
 name=p.name
 if name=='index.html':kind='home'
 elif name=='curators.html':kind='cur'
 elif name=='community.html':kind='community'
 elif name=='writing.html':kind='writing'
 elif any(x in p.parts for x in ('exhibitions','books')):kind='project'
 else:return s
 block=context_block(p,kind)
 m=re.search(r'<main[^>]*>',s,re.I)
 if m:return s[:m.end()]+block+s[m.end():]
 return s

def add_sources(s,p):
 if p.name not in ('index.html','curators.html') or 'data-source-hub="2026"' in s:return s
 block=source_hub(p)
 return s.replace('</main>',block+'</main>',1) if '</main>' in s else s

def ga_block(code):
 consent={'en':('Analytics','This site uses privacy-friendly analytics only after consent.','Allow','Decline'),'hu':('Analitika','Az oldal csak hozzájárulás után használ adatvédelmi szempontból kíméletes analitikát.','Engedélyezem','Elutasítom'),'de':('Analyse','Diese Website verwendet datenschutzfreundliche Analyse erst nach Ihrer Zustimmung.','Zulassen','Ablehnen')}[code]
 return f'''<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('consent','default',{{'analytics_storage':'denied','ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied'}});function bnLoadGA(){{if(window.__bnGA)return;window.__bnGA=1;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id={GA_ID}';document.head.appendChild(s);gtag('js',new Date());gtag('config','{GA_ID}',{{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false}})}}function bnConsent(ok){{localStorage.setItem('bn-consent',ok?'granted':'denied');if(ok){{gtag('consent','update',{{analytics_storage:'granted'}});bnLoadGA()}}var b=document.getElementById('consent');if(b)b.hidden=true}}document.addEventListener('DOMContentLoaded',function(){{var c=localStorage.getItem('bn-consent');if(c==='granted'){{gtag('consent','update',{{analytics_storage:'granted'}});bnLoadGA()}}else if(c!=='denied'){{var b=document.getElementById('consent');if(b)b.hidden=false}}}});</script><div id="consent" hidden style="position:fixed;z-index:100;left:50%;bottom:1rem;transform:translateX(-50%);width:min(720px,92vw);padding:1rem 1.2rem;background:#161411;border:1px solid rgba(183,156,68,.35);border-radius:16px;color:#f5f5f7"><strong>{consent[0]}</strong><p style="color:#a1a1a6;margin:.4rem 0">{consent[1]}</p><button onclick="bnConsent(true)">{consent[2]}</button> <button onclick="bnConsent(false)">{consent[3]}</button></div>'''

def add_ga_to_press(s,p):
 if p.name!='press.html' or GA_ID in s:return s
 code=lang_for(p)
 return s.replace('</body>',ga_block(code)+'</body>',1)

def press_itemlist(s,p):
 if p.name!='press.html' or '"@type":"ItemList"' in s:return s
 links=[]
 for href,title in re.findall(r'<article class="item">\s*<a href="([^"]+)"[^>]*>(.*?)</a>',s,re.S):
  title=html.unescape(re.sub('<[^>]+>','',title)).strip()
  links.append({'@type':'ListItem','position':len(links)+1,'name':title,'url':href})
 if not links:return s
 code=lang_for(p);url={'en':'https://www.banhalmi.art/press.html','hu':'https://www.banhalmi.art/hu/press.html','de':'https://www.banhalmi.art/de-at/press.html'}[code]
 data={'@context':'https://schema.org','@graph':[{'@type':['CollectionPage','WebPage'],'@id':url+'#webpage','url':url,'name':COPY[code]['title'],'inLanguage':{'en':'en','hu':'hu-HU','de':'de-AT'}[code],'about':{'@id':'https://www.norbertbanhalmi.com/about/'},'isPartOf':{'@id':'https://www.banhalmi.art/#website'},'mainEntity':{'@id':url+'#press-list'}},{'@type':'ItemList','@id':url+'#press-list','name':COPY[code]['sources'],'numberOfItems':len(links),'itemListElement':links}]}
 block='<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'</script>'
 return s.replace('</head>',block+'\n</head>',1)

def fix_press_titles(s,p):
 if p.name!='press.html':return s
 code=lang_for(p)
 if code=='de':
  s=s.replace('Präsenz im öffentlichen Raum','Die öffentliche Geschichte der Präsenz')
  s=s.replace('Presence in the Public Record','Die öffentliche Geschichte der Präsenz')
 elif code=='hu':
  s=s.replace('Jelenlét a nyilvánosságban','A jelenlét nyilvános története')
 return s

def process_html(p):
 s=p.read_text(encoding='utf-8');orig=s;code=lang_for(p)
 s=s.replace('#c9a962','#b79c44').replace('rgba(201,169,98','rgba(183,156,68').replace('9786150000534','9789631286632')
 s=inject_core(s)
 if p.name=='curators.html':s=replace_curatorial_identity(s,code)
 s=fix_press_titles(s,p)
 s=add_context(s,p)
 s=add_sources(s,p)
 s=add_ga_to_press(s,p)
 s=press_itemlist(s,p)
 if s!=orig:p.write_text(s,encoding='utf-8');return True
 return False

changed=[]
for p in ROOT.rglob('*.html'):
 if any(x in p.parts for x in ('.git','node_modules','dist')):continue
 if process_html(p):changed.append(p.relative_to(ROOT).as_posix())
for p in ROOT.rglob('*.css'):
 if any(x in p.parts for x in ('.git','node_modules','dist')):continue
 s=p.read_text(encoding='utf-8');n=s.replace('#c9a962','#b79c44').replace('rgba(201,169,98','rgba(183,156,68')
 if n!=s:p.write_text(n,encoding='utf-8');changed.append(p.relative_to(ROOT).as_posix())
source_map={'@context':'https://schema.org','@type':'CreativeWork','name':'BANHALMI ART source map','about':{'@id':'https://www.norbertbanhalmi.com/about/'},'mainEntity':{'@id':'https://www.wikidata.org/wiki/Q56391118'},'citation':[{'name':n,'url':u,'description':d} for n,u,d in SOURCES],'curatorialThesis':'The oeuvre is organised around the sustained investigation and visualisation of presence since 1999.'}
(ROOT/'archive-source-map.json').write_text(json.dumps(source_map,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Updated {len(changed)} files')
for x in changed:print(x)
