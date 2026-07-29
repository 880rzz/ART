#!/usr/bin/env python3
from pathlib import Path
import re, html

ROOT=Path(__file__).resolve().parents[1]
MARK='/* PRESENCE_ARCHIVE_2026 */'
CSS=r'''/* PRESENCE_ARCHIVE_2026 */
/* One-screen desktop menu: direction, not catalogue. */
@media (min-width:861px){
 #menu{overflow:hidden;padding:5.6rem 5vw 2rem;display:flex;align-items:center}
 #menu .mwrap{width:100%;max-width:1180px;grid-template-columns:1fr 1fr;gap:.65rem 4.5rem;align-content:center}
 #menu .mwrap>div{display:contents}
 #menu .m-main{font-size:clamp(1.15rem,1.65vw,1.55rem);line-height:1.08;padding:.18rem 0;margin:0}
 #menu .m-desc{font-size:.78rem;line-height:1.32;margin:0 0 .52rem;max-width:48ch}
 #menu details{display:none!important}
 #menu .m-foot{padding-top:.75rem;margin-top:.15rem;font-size:.78rem}
}
/* Curatorial thesis and press hierarchy. */
.presence-thesis{padding:clamp(3.8rem,7vw,7rem) 0;border-bottom:1px solid var(--line);background:linear-gradient(180deg,#14120f,var(--bg))}
.presence-thesis .kicker,.press-era .era-no{font-size:.72rem;letter-spacing:.15em;text-transform:uppercase;color:var(--gold);font-weight:600}
.presence-thesis h2{max-width:18ch;margin:.55rem 0 1.15rem}
.presence-thesis p{max-width:66ch;color:var(--ink-soft);font-size:clamp(1.08rem,1.8vw,1.3rem);line-height:1.52}
.press-nav{display:flex;gap:.55rem;flex-wrap:wrap;margin-top:2rem}.press-nav a{border:1px solid var(--line);border-radius:999px;padding:.5rem .85rem;font-size:.78rem;color:var(--ink-soft)}
.press-era{padding:clamp(4rem,7vw,7rem) 0;border-top:1px solid var(--line)}
.press-era:first-of-type{border-top:0}.press-era-head{display:grid;grid-template-columns:minmax(180px,.7fr) 1.3fr;gap:3rem;margin-bottom:2.8rem;align-items:start}
.press-era h2{margin:.45rem 0 .8rem}.press-era .era-intro{color:var(--ink-soft);max-width:60ch;font-size:1.08rem;line-height:1.55}
.press-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
.press-item{background:var(--bg);padding:clamp(1.35rem,2.4vw,2rem);min-height:190px;display:flex;flex-direction:column}
.press-item .press-title{font-size:clamp(1.08rem,1.55vw,1.32rem);line-height:1.25;font-weight:600;color:var(--ink);margin:0 0 .72rem}
.press-item .press-description{font-size:.94rem;line-height:1.5;color:var(--ink-soft);margin:0 0 1.25rem;max-width:55ch}
.press-item .press-note{margin-top:auto;padding-top:.8rem;border-top:1px solid rgba(201,169,98,.16);font-size:.72rem;line-height:1.4;letter-spacing:.055em;text-transform:uppercase;color:var(--gold)}
.press-item a.press-title:hover{color:var(--gold);opacity:1}.source-hub{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:2rem}.source-hub a{background:var(--bg2);padding:1.25rem;color:var(--ink)}.source-hub small{display:block;color:var(--ink-soft);margin-top:.35rem;line-height:1.35}
@media(max-width:800px){.press-era-head{grid-template-columns:1fr;gap:.8rem}.press-grid{grid-template-columns:1fr}.source-hub{grid-template-columns:1fr 1fr}}
@media(max-width:500px){.source-hub{grid-template-columns:1fr}}
'''

LANG={
'en':{
 'title':'Presence in the public record','label':'Press archive · 2014–2026','loc':'The public history of a life-long investigation','lead':'The press archive is not a publicity list. It follows how one recurring question became visible across different periods of my work: when does a person, a memory or a community become truly present? Interviews, reports and moving-image records are arranged here as chapters of that investigation.','thesis':'The investigation of presence','thesis_text':'Looking back, one continuous impulse runs through the entire oeuvre: to recognise and make visible the moment in which someone is no longer merely performing a role, but is genuinely present. The subjects changed — women, fathers, survivors, historical witnesses, artists, leaders and communities — but the question remained.','eras':[
 ('I','2014–2016','Recognising the moment','The first public chapter focused on natural beauty, female identity, fatherhood and the New York experience. Presence appeared as an unguarded moment that could not be manufactured, only noticed.'),
 ('II','2017–2018','The body as memory','Awakening, Snippets and The World of Woman brought illness, recovery, intimacy and turning points into the centre. Photography became a space in which private experience could be seen without being reduced to spectacle.'),
 ('III','2019–2022','Presence between art and institution','The anniversary reflections, ambassadorship and curatorial work connected the personal practice to institutions, brands and exhibition platforms. The central issue became how artistic integrity can remain present inside public systems.'),
 ('IV','2023–2026','Community, responsibility and public presence','Vienna, teaching, charity projects and executive portraiture widened the investigation. Presence became relational: trust between photographer and subject, and responsibility toward the community around the work.'),
 ('V','Moving image','The voice behind the photographs','Television reports, interviews and films preserve gestures, voices and contexts that a still image cannot hold alone.')],
 'note':'External source · archival reference','sources':'Sources and documentation','source_text':'Independent and first-party records that identify, contextualise and preserve the oeuvre.','back':'Back to the archive','desc':{'woman':'Female identity, self-image and the presence behind social expectations.','new york':'A formative international chapter and the encounter between personal history and the city.','awak':'Recovery, vulnerability and the return to one’s own body and life.','father':'Fatherhood and the quiet visibility of family roles.','1956':'Personal testimony as a living form of historical memory.','community':'Photography used to create connection, education and shared responsibility.','vienna':'The Vienna chapter: cultural belonging, community and a new public context.','gallery':'Curatorial work and the conditions in which an image becomes publicly present.','ambassador':'The relationship between authorship, technology and professional responsibility.','portrait':'The psychology of portraiture and the moment a role gives way to a person.','default':'A documented point in the public reception and interpretation of the oeuvre.'}},
'hu':{
 'title':'Jelenlét a nyilvánosságban','label':'Sajtóarchívum · 2014–2026','loc':'Egy életmű nyilvános története','lead':'Ez az oldal nem sajtólista. Azt mutatja meg, hogyan vált különböző életszakaszokban láthatóvá ugyanaz a kérdés: mikor van valóban jelen egy ember, egy emlék vagy egy közösség? Az interjúk, riportok és videók ennek a több mint két évtizedes kutatásnak a fejezetei.','thesis':'A jelenlét kutatása','thesis_text':'Visszatekintve az egész életművön egyetlen következetes törekvés húzódik végig: felismerni és láthatóvá tenni azt a pillanatot, amikor valaki már nem egy szerepet mutat, hanem valóban jelen van. Változtak a témák — nők, apák, gyógyulók, történelmi tanúk, művészek, vezetők és közösségek —, a kérdés azonban ugyanaz maradt.','eras':[
 ('I','2014–2016','A pillanat felismerése','Az első nyilvános fejezet a természetes szépségről, a női identitásról, az apaságról és a New York-i tapasztalatról szólt. A jelenlét itt még elsősorban egy őszinte, megrendezhetetlen pillanat felismerése volt.'),
 ('II','2017–2018','A test mint emlékezet','Az Ébredés, a Szösszenetek és A Nő világa a betegséget, a gyógyulást, az intimitást és az életfordulókat állította középpontba. A fotográfia olyan térré vált, ahol a személyes történet látvánnyá, de nem látványossággá válhatott.'),
 ('III','2019–2022','Jelenlét a művészet és az intézmények között','A jubileumi visszatekintések, a márkanagyköveti és kurátori munka a személyes alkotói gyakorlatot intézményekhez, technológiához és kiállítási terekhez kapcsolta. A kérdés az lett, hogyan maradhat jelen az alkotói hitelesség a nyilvános rendszerekben.'),
 ('IV','2023–2026','Közösség, felelősség és nyilvános jelenlét','Bécs, az oktatás, a jótékonysági projektek és az executive portré új irányba tágították a kutatást. A jelenlét kapcsolattá vált: bizalommá a fotós és az alany között, valamint felelősséggé a munka körül létrejövő közösség iránt.'),
 ('V','Mozgókép','A hang a fényképek mögött','A televíziós riportok, interjúk és filmek olyan gesztusokat, hangokat és összefüggéseket őriznek meg, amelyeket egy állókép önmagában nem tud.')],
 'note':'Külső forrás · archív hivatkozás','sources':'Források és dokumentáció','source_text':'Független és saját források, amelyek azonosítják, értelmezik és megőrzik az életművet.','back':'Vissza az archívumhoz','desc':{'nő':'Női identitás, önkép és a társadalmi elvárások mögötti jelenlét.','new york':'Meghatározó nemzetközi korszak, ahol a személyes történetek a várossal találkoztak.','ébred':'Gyógyulás, sebezhetőség és visszatalálás a saját testhez és élethez.','apa':'Az apaság és a családi szerepek csendes láthatósága.','56':'Személyes tanúságtétel mint élő történelmi emlékezet.','közöss':'A fotográfia mint kapcsolat, oktatás és közös felelősség.','bécs':'A bécsi fejezet: kulturális kötődés, közösség és új nyilvános közeg.','galéria':'Kurátori munka és annak feltételei, hogy egy kép nyilvánosan jelen lehessen.','nagykövet':'Szerzőiség, technológia és szakmai felelősség kapcsolata.','portré':'A portré pszichológiája és a pillanat, amikor a szerep mögül előlép az ember.','default':'Az életmű nyilvános fogadtatásának és értelmezésének dokumentált állomása.'}},
'de':{
 'title':'Präsenz im öffentlichen Raum','label':'Pressearchiv · 2014–2026','loc':'Die öffentliche Geschichte eines Lebenswerks','lead':'Diese Seite ist keine bloße Presseliste. Sie zeigt, wie in unterschiedlichen Lebensphasen dieselbe Frage sichtbar wurde: Wann ist ein Mensch, eine Erinnerung oder eine Gemeinschaft wirklich präsent? Interviews, Reportagen und Bewegtbildbeiträge sind als Kapitel dieser langjährigen Untersuchung geordnet.','thesis':'Die Erforschung der Präsenz','thesis_text':'Im Rückblick zieht sich ein konsequenter Impuls durch das gesamte Werk: jenen Augenblick zu erkennen und sichtbar zu machen, in dem ein Mensch nicht länger nur eine Rolle zeigt, sondern tatsächlich gegenwärtig ist. Die Themen wechselten — Frauen, Väter, Genesende, Zeitzeugen, Kunstschaffende, Führungspersönlichkeiten und Gemeinschaften —, die Frage blieb.','eras':[
 ('I','2014–2016','Den Augenblick erkennen','Das erste öffentliche Kapitel galt natürlicher Schönheit, weiblicher Identität, Vaterschaft und den Erfahrungen in New York. Präsenz erschien als ungeschützter Augenblick, der sich nicht herstellen, sondern nur erkennen lässt.'),
 ('II','2017–2018','Der Körper als Erinnerung','Awakening, Snippets und The World of Woman rückten Krankheit, Genesung, Intimität und Wendepunkte ins Zentrum. Fotografie wurde zu einem Raum, in dem private Erfahrung sichtbar sein konnte, ohne zum Spektakel zu werden.'),
 ('III','2019–2022','Präsenz zwischen Kunst und Institution','Jubiläumsreflexionen, Markenbotschafter- und Kuratorentätigkeit verbanden die persönliche Praxis mit Institutionen, Technologie und Ausstellungsräumen. Im Mittelpunkt stand die Frage, wie künstlerische Integrität in öffentlichen Systemen gegenwärtig bleiben kann.'),
 ('IV','2023–2026','Gemeinschaft, Verantwortung und öffentliche Präsenz','Wien, Vermittlung, gemeinnützige Projekte und Executive Portraiture erweiterten die Untersuchung. Präsenz wurde zur Beziehung: zu Vertrauen zwischen Fotograf und Porträtiertem und zu Verantwortung gegenüber der Gemeinschaft rund um die Arbeit.'),
 ('V','Bewegtbild','Die Stimme hinter den Fotografien','Fernsehberichte, Interviews und Filme bewahren Gesten, Stimmen und Kontexte, die ein einzelnes Standbild nicht allein tragen kann.')],
 'note':'Externe Quelle · Archivverweis','sources':'Quellen und Dokumentation','source_text':'Unabhängige und eigene Quellen, die das Werk identifizieren, kontextualisieren und bewahren.','back':'Zurück zum Archiv','desc':{'frau':'Weibliche Identität, Selbstbild und Präsenz hinter gesellschaftlichen Erwartungen.','new york':'Eine prägende internationale Phase zwischen persönlicher Geschichte und urbanem Raum.','erwach':'Genesung, Verletzlichkeit und die Rückkehr in den eigenen Körper und das eigene Leben.','vater':'Vaterschaft und die stille Sichtbarkeit familiärer Rollen.','1956':'Persönliches Zeugnis als lebendige Form historischer Erinnerung.','gemeinschaft':'Fotografie als Verbindung, Vermittlung und gemeinsame Verantwortung.','wien':'Das Wiener Kapitel: kulturelle Zugehörigkeit, Gemeinschaft und ein neuer öffentlicher Kontext.','galerie':'Kuratorische Arbeit und die Bedingungen, unter denen ein Bild öffentlich präsent wird.','botschafter':'Das Verhältnis von Autorenschaft, Technologie und professioneller Verantwortung.','porträt':'Die Psychologie des Porträts und der Moment, in dem hinter der Rolle der Mensch hervortritt.','default':'Eine dokumentierte Station der öffentlichen Rezeption und Einordnung des Werks.'}}
}

def lang_for(p):
 s=p.as_posix()
 return 'hu' if '/hu/' in '/'+s else ('de' if '/de-at/' in '/'+s else 'en')

def add_css(txt):
 if MARK not in txt and '</style>' in txt: txt=txt.replace('</style>',CSS+'\n</style>',1)
 return txt

def thesis_block(L):
 return f'''<section class="presence-thesis"><div class="wrap narrow"><p class="kicker">{L['thesis']}</p><h2>{L['thesis']}</h2><p>{L['thesis_text']}</p></div></section>'''

def item_desc(text,L):
 low=text.lower()
 for k,v in L['desc'].items():
  if k!='default' and k in low:return v
 return L['desc']['default']

def press_main(old,code):
 L=LANG[code]
 main=re.search(r'<main id="main-content"[^>]*>(.*?)</main>',old,re.S)
 body=main.group(1) if main else ''
 lis=re.findall(r'<li>(.*?)</li>',body,re.S)
 clean=[];seen=set()
 for raw in lis:
  text=re.sub(r'<[^>]+>',' ',raw);text=html.unescape(re.sub(r'\s+',' ',text)).strip()
  if not text or text in seen:continue
  seen.add(text);clean.append((raw,text))
 buckets=[[],[],[],[],[]]
 for raw,text in clean:
  low=(raw+' '+text).lower()
  if any(x in low for x in ['youtube','youtu.be','tv','m1','m5','echo','petőfi','video','videó','fernseh']):idx=4
  elif re.search(r'202[3-6]',text):idx=3
  elif re.search(r'201[9]|202[0-2]',text):idx=2
  elif re.search(r'201[7-8]',text):idx=1
  else:idx=0
  buckets[idx].append((raw,text))
 def card(raw,text):
  m=re.search(r'<a\s+([^>]*href="[^"]+"[^>]*)>(.*?)</a>',raw,re.S)
  if m:
   label=html.escape(re.sub(r'<[^>]+>','',m.group(2)).strip()); title=f'<a class="press-title" {m.group(1)}>{label}</a>'
  else:title=f'<h3 class="press-title">{html.escape(text)}</h3>'
  return f'<article class="press-item">{title}<p class="press-description">{item_desc(text,L)}</p><p class="press-note">{L["note"]}</p></article>'
 nav=''.join(f'<a href="#era-{i+1}">{e[1]} · {e[2]}</a>' for i,e in enumerate(L['eras']))
 eras=''
 for i,e in enumerate(L['eras']):
  cards=''.join(card(*x) for x in buckets[i]) or f'<article class="press-item"><h3 class="press-title">Archive record in preparation</h3><p class="press-description">{L["desc"]["default"]}</p><p class="press-note">{L["note"]}</p></article>'
  eras+=f'<section class="press-era" id="era-{i+1}"><div class="wrap"><div class="press-era-head"><div><p class="era-no">{e[0]} · {e[1]}</p><h2>{e[2]}</h2></div><p class="era-intro">{e[3]}</p></div><div class="press-grid">{cards}</div></div></section>'
 sources=[('Wikipedia','https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert'),('Wikidata','https://www.wikidata.org/wiki/Q56391118'),('Wikimedia Commons','https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=Norbert%20Banhalmi'),('YouTube','https://www.youtube.com/@norbert.banhalmi/playlists')]
 hub=''.join(f'<a href="{u}" target="_blank" rel="noopener"><strong>{n}</strong><small>{L["source_text"]}</small></a>' for n,u in sources)
 return f'''<main id="main-content" tabindex="-1"><header class="sub"><div class="wrap narrow"><p class="label">{L['label']}</p><h1>{L['title']}</h1><p class="loc">{L['loc']}</p></div></header><section class="wrap narrow"><p class="lead">{L['lead']}</p><nav class="press-nav" aria-label="Archive chapters">{nav}</nav></section>{thesis_block(L)}{eras}<section class="wrap narrow"><p class="label">{L['sources']}</p><h2>{L['sources']}</h2><p class="lead">{L['source_text']}</p><div class="source-hub">{hub}</div><a class="btn" href="index.html">← {L['back']}</a></section></main>'''

def process(p):
 txt=p.read_text(encoding='utf-8')
 orig=txt
 txt=add_css(txt).replace('9786150000534','9789631286632')
 code=lang_for(p)
 if p.name=='press.html':
  txt=re.sub(r'<main id="main-content"[^>]*>.*?</main>',lambda m:press_main(orig,code),txt,flags=re.S)
 if p.name=='index.html' and 'presence-thesis' not in txt:
  txt=re.sub(r'(<main id="main-content"[^>]*>)',r'\1'+thesis_block(LANG[code]),txt,count=1)
 if p.name=='curators.html' and 'presence-thesis' not in txt:
  txt=re.sub(r'(<main id="main-content"[^>]*>)',r'\1'+thesis_block(LANG[code]),txt,count=1)
 if txt!=orig:p.write_text(txt,encoding='utf-8');return True
 return False

changed=[]
for p in ROOT.rglob('*.html'):
 if any(x in p.parts for x in ('.git','node_modules','dist')):continue
 if process(p):changed.append(str(p.relative_to(ROOT)))
print(f'Updated {len(changed)} HTML files')
for x in changed:print(x)
