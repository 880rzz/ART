from pathlib import Path
import re, json, hashlib

ROOT=Path('.')
RELEASE='20260810-human-editorial-v96'

# Exact, reviewed copy replacements. Facts are preserved; only mechanical or
# translation-like phrasing is simplified.
R={
'curators.html':[
('My work sits somewhere between radical purism and dignified documentarism.','Discipline, human presence and intimacy run through the same photographic practice.'),
('The arc runs from the strict structures of military discipline to the sacred chaos of tantric intimacy — which sounds absurd written down, but that is honestly the road.','The work moves from the discipline of my military years toward increasingly intimate studies of memory, the body and human connection.'),
('These are not only aesthetic objects; they are case studies about identity, about how memory frays, and about repairing our relationship with the body.','The photographs ask how identity changes, how memory is carried, and how the body can remain visible without being reduced to an object.'),
('Realised with Semmelweis University oncology (Dr. Magdolna Dank) and psychiatrist Dr. Imre Csernus — an institutional interlacing of art and medicine. Where contemporary culture treats cancer as taboo or shock imagery, I focused on regeneration. For the participants the sessions worked as active therapy. Monochrome conversion and sculptural light integrate the scars into the harmony of the body as decorations of survival; poems by Vincent &amp; Vincent act as emotional resonators.','Realised with the Semmelweis University oncology team (Dr. Magdolna Dank) and psychiatrist Dr. Imre Csernus, the project brought photography into a medical context. I focused on recovery rather than shock. Several participants described the sessions as an important part of processing what they had lived through. In the black-and-white portraits, scars remain visible as part of the body and its history; poems by Vincent &amp; Vincent accompany the images with an independent voice.'),
('Nine natural transitions, with writer Miklós Vámos — a visual revolt against the young-thin-perfect triangle. Recognising the limits of a static exhibition, I opened the project into participatory territory: an online space where anyone could submit her own story, which moved me from auteur to facilitator. Technically it showcases my minimalism — a small camera rather than an intimidating DSLR, so eye contact survives and physical proximity becomes emotional proximity. The Stefánia Palace finale added a roundtable with coaches and models: art out of the white cube and into social forum.','Nine natural transitions, made with writer Miklós Vámos, challenge the narrow expectation that women should appear young, thin and flawless. The project extended beyond the exhibition through an online space where people could submit their own stories; my role shifted from author to host. I used a small camera rather than an imposing DSLR to keep eye contact and conversation natural. At Stefánia Palace, a roundtable with coaches and models turned the finale into an open discussion.'),
('Co-founder and curator of a digital exhibition space built with Samsung — sacred space fused with profane technology.','Co-founder and curator of a digital exhibition space built with Samsung, where works were shown on screen in the setting of Tihany’s Benedictine abbey.'),
('<strong>Social grounding</strong> — The work is not art for art’s sake: it engages with emigration, illness, women’s roles and historical memory.','<strong>Human and social context</strong> — The work engages directly with emigration, illness, women’s lives and historical memory.'),
('<strong>Visual consistency</strong> — Disciplined composition and a recurring monochrome language give the oeuvre a recognisable coherence.','<strong>A coherent visual language</strong> — Restrained composition and a recurring monochrome palette connect the different periods of the work.'),
('<strong>Scars and Memory</strong> — Milestones ’56 and Awakening in parallel — the visual analogy of historical and biological wounds.','<strong>Scars and Memory</strong> — Milestones ’56 and Awakening shown side by side, comparing historical memory with the memory carried by the body.'),
('Books, exhibitions, ambassadorship and gallery work placed the practice inside cultural and technological systems. The question became how an artwork can remain human and credible while moving through institutions, public presentation and new forms of circulation.','Books, exhibitions, ambassadorship and gallery work moved the practice into cultural and technological systems. This period tested whether the work could travel through institutions, public presentation and new forms of circulation without losing its human focus.'),
('The trust built between photographer and sitter. The quality of an image is not only an optical or technical outcome — it is a consequence of the human encounter.','The trust built between photographer and sitter. An image is shaped by more than optics and technique; it also depends on the human encounter.'),
('The OM SYSTEM ambassador role, experiments with digital exhibition formats, ballet, education and community projects expanded the role of photography. A work was no longer only made; it began to operate in institutional and communal situations.','The OM SYSTEM ambassador role, experiments with digital exhibition formats, ballet, education and community projects expanded the role of photography. Photography began to work beyond the finished image, inside institutions, education and community projects.')],
'hu/curators.html':[
('A munkám valahol a radikális puritanizmus és a méltóságteljes dokumentarizmus között áll.','A munkáimban a fegyelem, az emberi jelenlét és az intimitás ugyanannak az alkotói útnak a részei.'),
('Az ív a katonai fegyelem szigorú struktúráitól a tantrikus intimitás szakrális káoszáig tart — leírva abszurdul hangzik, de őszintén ez az út.','A katonai évek rendjétől fokozatosan jutottam el az emlékezet, a test és az emberi kapcsolódás egyre személyesebb témáihoz.'),
('Ezek nemcsak esztétikai tárgyak, hanem esettanulmányok az identitásról, arról, hogyan foszlik az emlékezet, és hogyan javítható a testhez való viszonyunk.','A képek azt kérdezik, hogyan változik az identitás, hogyan őrizzük az emlékeinket, és hogyan lehet a testet tárgyiasítás nélkül megmutatni.'),
('A Semmelweis Egyetem onkológiájával (Dr. Dank Magdolna) és Dr. Csernus Imre pszichiáterrel valósult meg — a művészet és a gyógyítás intézményes összefonódása. Ahol a kortárs kultúra tabuként vagy sokkoló képként kezeli a rákot, én a regenerációra fókuszáltam. A résztvevőknek a fotózás aktív terápiaként működött. A fekete-fehér képeken a hegek nem elrejtendő sérülésként, hanem az átélt történet részeként jelennek meg. Vincent &amp; Vincent versei önálló hangon kapcsolódnak a portrékhoz.','A Semmelweis Egyetem onkológiai csapatával (Dr. Dank Magdolna) és Dr. Csernus Imre pszichiáterrel közösen a fotográfia orvosi közegbe került. A sokkolás helyett a felépülésre figyeltem. Több résztvevő fontosnak élte meg a fotózást abban, ahogyan feldolgozta a történteket. A fekete-fehér portrékon a hegek láthatók maradnak: a test és az átélt történet részei. Vincent &amp; Vincent versei önálló hangon kísérik a képeket.'),
('Kilenc természetes átmenet, Vámos Miklós íróval — válasz arra a szűk képre, amely a nőket csak fiatalnak, vékonynak és hibátlannak mutatja. Mivel a statikus kiállítás korlátokba ütközik, részvételi irányba nyitottam a projektet: online térben bárki beküldhette a saját történetét, ami szerzőből házigazdává tett. Technikailag a minimalizmusomat mutatja — kis gép a félelmetes DSLR helyett, hogy megmaradjon a szemkontaktus, és a fizikai közelségből érzelmi közelség legyen. A Stefánia Palota-beli finálét kerekasztal egészítette ki coachokkal és modellekkel: a kiállítás beszélgetéssé és közös gondolkodássá tágult.','Kilenc természetes átmenet Vámos Miklós íróval, válaszként arra a szűk képre, amely a nőket csak fiatalnak, vékonynak és hibátlannak mutatja. A projekt az online térben folytatódott, ahol bárki megoszthatta a saját történetét; ettől az én szerepem is inkább házigazdává vált. Kis fényképezőgéppel dolgoztam egy nagy DSLR helyett, hogy természetes maradjon a szemkontaktus és a beszélgetés. A Stefánia Palotában a záró alkalmat coachokkal és modellekkel közös kerekasztal egészítette ki.'),
('Egy Samsunggal létrehozott digitális kiállítótér társalapítója és kurátora — szakrális tér és profán technológia fúziója.','Egy Samsunggal létrehozott digitális kiállítótér társalapítója és kurátora; a művek képernyőkön jelentek meg a tihanyi bencés apátság környezetében.'),
('<strong>Társadalmi beágyazottság</strong> — A munkák nem önmagukért léteznek: emigrációról, betegségről, női szerepekről és történelmi emlékezetről beszélnek.','<strong>Emberi és társadalmi kapcsolódás</strong> — A munkák közvetlenül foglalkoznak emigrációval, betegséggel, női élettörténetekkel és történelmi emlékezettel.'),
('<strong>Vizuális következetesség</strong> — A fegyelmezett kompozíció és a visszatérő fekete-fehér képi nyelv felismerhető egységet ad az életműnek.','<strong>Következetes képi nyelv</strong> — A visszafogott kompozíció és a visszatérő fekete-fehér világ összeköti az életmű különböző korszakait.'),
('A könyvek, kiállítások, nagyköveti és galériás munkák kulturális és technológiai rendszerekbe helyezték az alkotói gyakorlatot. A kérdés az lett, hogyan maradhat emberi és hiteles egy mű, miközben intézményeken, nyilvános bemutatáson és új terjesztési formákon halad keresztül.','A könyvek, kiállítások, nagyköveti és galériás munkák új közegekbe vitték az alkotói gyakorlatot. A cél közben ugyanaz maradt: a mű emberi és hiteles legyen akkor is, amikor intézményeken, nyilvános bemutatásokon vagy új technológiai csatornákon keresztül jut el a közönséghez.'),
('A fotós és a portréalany között létrejövő bizalom. A kép minősége nem csupán optikai vagy technikai eredmény, hanem az emberi találkozás következménye.','A fotós és a portréalany között létrejövő bizalom. A kép minőségét nem csak az optika és a technika határozza meg; ugyanilyen fontos az emberi találkozás.'),
('Az OM SYSTEM nagyköveti szerep, a digitális kiállítási formák, a balett, az oktatás és a közösségi projektek kitágították a fotográfia szerepét. A mű már nemcsak elkészült, hanem intézményi és közösségi helyzetekben is működni kezdett.','Az OM SYSTEM nagyköveti szerep, a digitális kiállítási formák, a balett, az oktatás és a közösségi projektek kitágították a fotográfia szerepét. A fotográfia túlnőtt az elkészült képen: intézményi, oktatási és közösségi helyzetekben is működni kezdett.')],
'de-at/curators.html':[
('Meine Arbeit liegt irgendwo zwischen radikalem Purismus und würdevollem Dokumentarismus.','Disziplin, menschliche Präsenz und Intimität gehören für mich zu derselben fotografischen Arbeit.'),
('Der Bogen reicht von den strengen Strukturen militärischer Disziplin bis zum sakralen Chaos tantrischer Intimität — was aufgeschrieben absurd klingt, aber ehrlich gesagt genau der Weg ist.','Von der Ordnung meiner militärischen Jahre führte der Weg zu immer persönlicheren Fragen nach Erinnerung, Körper und menschlicher Nähe.'),
('Das sind nicht nur ästhetische Objekte, sondern Fallstudien über Identität, über das Ausfransen von Erinnerung und über die Reparatur unseres Verhältnisses zum Körper.','Die Bilder fragen, wie Identität sich verändert, wie Erinnerung getragen wird und wie sich ein Körper zeigen lässt, ohne ihn zum Objekt zu machen.'),
('Realisiert mit der Onkologie der Semmelweis-Universität (Dr. Magdolna Dank) und dem Psychiater Dr. Imre Csernus — eine institutionelle Verflechtung von Kunst und Medizin. Wo die Gegenwartskultur Krebs als Tabu oder Schockbild behandelt, habe ich auf Regeneration fokussiert. Für die Beteiligten wirkten die Sitzungen als aktive Therapie. Die Schwarzweiß-Umsetzung und das skulpturale Licht integrieren die Narben als Auszeichnungen des Überlebens in die Harmonie des Körpers; Gedichte von Vincent &amp; Vincent wirken als emotionale Resonatoren.','Gemeinsam mit der Onkologie der Semmelweis-Universität (Dr. Magdolna Dank) und dem Psychiater Dr. Imre Csernus brachte das Projekt Fotografie in einen medizinischen Kontext. Statt Schockbildern stand die Genesung im Mittelpunkt. Mehrere Teilnehmerinnen beschrieben das Fotografieren als wichtigen Teil der Verarbeitung ihrer Erfahrungen. In den Schwarzweißporträts bleiben Narben als Teil des Körpers und seiner Geschichte sichtbar; Gedichte von Vincent &amp; Vincent begleiten die Bilder mit einer eigenen Stimme.'),
('Neun natürliche Übergänge, gemeinsam mit dem Schriftsteller Miklós Vámos — eine visuelle Revolte gegen das Dreieck jung-dünn-perfekt. Weil eine statische Ausstellung an Grenzen stößt, öffnete ich das Projekt partizipativ: ein Online-Raum, in dem jede ihre eigene Geschichte einsenden konnte, was mich vom Autor zum Gastgeber machte. Technisch zeigt es meinen Minimalismus — eine kleine Kamera statt einer einschüchternden DSLR, damit Blickkontakt bestehen bleibt und körperliche Nähe zu emotionaler Nähe wird. Das Finale im Stefánia-Palais ergänzte ein Podium mit Coaches und Modellen: Kunst raus aus dem White Cube, hinein ins gesellschaftliche Forum.','Neun natürliche Übergänge, gemeinsam mit dem Schriftsteller Miklós Vámos, stellen die enge Erwartung infrage, Frauen müssten jung, dünn und makellos erscheinen. Das Projekt wurde online weitergeführt, wo Frauen ihre eigenen Geschichten einsenden konnten; meine Rolle wurde dadurch stärker die eines Gastgebers. Ich arbeitete mit einer kleinen Kamera statt mit einer einschüchternden DSLR, damit Blickkontakt und Gespräch natürlich blieben. Das Finale im Stefánia-Palais wurde durch eine Gesprächsrunde mit Coaches und Modellen ergänzt.'),
('Mitbegründer und Kurator eines digitalen Ausstellungsraums, entstanden mit Samsung — sakraler Raum, verschmolzen mit profaner Technologie.','Mitbegründer und Kurator eines mit Samsung entwickelten digitalen Ausstellungsraums, in dem die Arbeiten im Umfeld der Benediktinerabtei von Tihany auf Bildschirmen gezeigt wurden.'),
('<strong>Gesellschaftliche Verankerung</strong> — Die Arbeiten sind kein Selbstzweck: Sie setzen sich mit Emigration, Krankheit, Frauenrollen und historischem Gedächtnis auseinander.','<strong>Menschlicher und gesellschaftlicher Kontext</strong> — Die Arbeiten beschäftigen sich direkt mit Emigration, Krankheit, weiblichen Lebensgeschichten und historischem Gedächtnis.'),
('<strong>Visuelle Konsistenz</strong> — Disziplinierte Komposition und eine wiederkehrende Schwarzweiß-Sprache geben dem Werk eine klar erkennbare Einheit.','<strong>Eine klare Bildsprache</strong> — Zurückhaltende Komposition und die wiederkehrende Schwarzweiß-Palette verbinden die unterschiedlichen Werkphasen.'),
('Bücher, Ausstellungen, Botschafterrolle und Galeriearbeit stellten die Praxis in kulturelle und technologische Systeme. Die Frage wurde, wie ein Kunstwerk menschlich und glaubwürdig bleiben kann, während es durch Institutionen, öffentliche Präsentation und neue Formen der Zirkulation wandert.','Bücher, Ausstellungen, Botschafterrolle und Galeriearbeit brachten die Praxis in kulturelle und technologische Systeme. In dieser Phase ging es darum, wie die Arbeit durch Institutionen, öffentliche Präsentation und neue Formen der Verbreitung gehen kann, ohne ihren menschlichen Fokus zu verlieren.'),
('Das Vertrauen zwischen Fotograf und porträtierter Person. Die Qualität eines Bildes ist nicht nur ein optisches oder technisches Ergebnis, sondern die Folge der menschlichen Begegnung.','Das Vertrauen zwischen Fotograf und porträtierter Person. Ein Bild entsteht nicht allein aus Optik und Technik; ebenso wichtig ist die menschliche Begegnung.'),
('Die OM SYSTEM Botschafterrolle, Experimente mit digitalen Ausstellungsformaten, Ballett, Bildung und Gemeinschaftsprojekte erweiterten die Rolle der Fotografie. Ein Werk wurde nicht nur geschaffen, sondern begann auch in institutionellen und gemeinschaftlichen Zusammenhängen zu wirken.','Die OM SYSTEM Botschafterrolle, Experimente mit digitalen Ausstellungsformaten, Ballett, Bildung und Gemeinschaftsprojekte erweiterten die Rolle der Fotografie. Fotografie wirkte nun über das fertige Bild hinaus — in Institutionen, Bildung und Gemeinschaftsprojekten.')],
'de-at/books/book-ebredes.html': [('Dieses Buch ist aus dem Projekt Erwachen entstanden und ist gewissermaßen dessen intimere Hälfte.','Dieses Buch ist aus dem Projekt Erwachen entstanden und erzählt seine intimere, persönliche Seite.')]
}
for rel,pairs in R.items():
    p=ROOT/rel; s=p.read_text()
    for old,new in pairs: s=s.replace(old,new)
    p.write_text(s)

DESC={
'curators.html':'Discipline, human presence and intimacy run through the same photographic practice. A curatorial overview of Norbert Bánhalmi’s work.',
'hu/curators.html':'A fotográfiámban a fegyelem, az emberi jelenlét és az intimitás ugyanannak az életműnek a részei. Kurátori áttekintés Bánhalmi Norbert munkáiról.',
'de-at/curators.html':'Disziplin, menschliche Präsenz und Intimität verbinden die verschiedenen Phasen von Norbert Bánhalmis fotografischer Arbeit. Ein kuratorischer Überblick.'}
for rel,d in DESC.items():
    p=ROOT/rel; s=p.read_text()
    for attr in ('name="description"','property="og:description"','name="twitter:description"'):
        s=re.sub(r'(<meta '+re.escape(attr)+r' content=")[^"]*(">)',lambda m:m.group(1)+d+m.group(2),s,count=1)
    p.write_text(s)

# Centralise known repeated inline spacing rules.
UTIL={'margin-bottom:.4rem':'u-mb-xs','margin-bottom:.5rem':'u-mb-sm','margin-top:.4rem':'u-mt-xs','margin-top:1.2rem':'u-mt-md','margin-top:2.5rem':'u-mt-xl'}

def with_class(tag,cls):
    m=re.search(r'class=("[^"]*"|\'[^\']*\')',tag,re.I)
    if m:
        q=m.group(1)[0]; body=m.group(1)[1:-1].split()
        if cls not in body: body.append(cls)
        return tag[:m.start()]+f'class={q}{" ".join(body)}{q}'+tag[m.end():]
    return tag[:-1]+f' class="{cls}">'

def transform_tag(m):
    tag=m.group(0)
    sm=re.search(r'\sstyle=("[^"]*"|\'[^\']*\')',tag,re.I)
    if not sm:return tag
    val=sm.group(1)[1:-1]; decl=[x.strip() for x in val.split(';') if x.strip()]
    classes=[]; keep=[]
    norm=[x.lower().replace(' ','') for x in decl]
    if 'border-bottom:none' in norm and 'padding-bottom:0' in norm:
        classes.append('u-last-row')
    for d in decl:
        k=d.lower().replace(' ','')
        if k in ('border-bottom:none','padding-bottom:0') and 'u-last-row' in classes: continue
        if k in UTIL: classes.append(UTIL[k])
        else: keep.append(d)
    if not classes:return tag
    repl=(' style="'+';'.join(keep)+'"') if keep else ''
    tag=tag[:sm.start()]+repl+tag[sm.end():]
    for c in classes: tag=with_class(tag,c)
    return tag

count=0
for p in ROOT.rglob('*.html'):
    if any(x in p.parts for x in ('.git','node_modules','reports')):continue
    s=p.read_text(errors='ignore')
    if not re.search(r'<body\b[^>]*class=["\'][^"\']*apple-archive',s,re.I) or not re.search(r'<main\b',s,re.I) or not re.search(r'<footer\b',s,re.I):continue
    count+=1
    s=re.sub(r'<[a-zA-Z][^<>]*>',transform_tag,s)
    p.write_text(s)

cssp=ROOT/'assets/css/homepage-two-tone-authority.css'; css=cssp.read_text()
if 'STAGE96-HUMAN-EDITORIAL-APPLE-RESILIENCE:START' not in css:
    css += '''\n\n/* STAGE96-HUMAN-EDITORIAL-APPLE-RESILIENCE:START */
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.grid,.cards,.archive-grid,.project-grid,.book-grid,.exhibition-grid,.timeline,.chronology,[data-chronology],.curatorial-periods__grid,.life-journey__stages,.archive-source-hub,.footer-grid,.link-grid)>*{min-width:0!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.card,.archive-card,.project-card,.record-card,.source-card,.fact-card,.timeline-card,.curatorial-period,.life-stage,.t-item,.timeline-item,.exhibition-item,.book-card){min-width:0!important;overflow-wrap:break-word}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(p,li,dd,dt,figcaption,small,.meta,.loc,.muted,.cap,.caption,.credit,.credits,.source,.sources,.reference,.references,.m-desc,.svc-d){overflow-wrap:break-word;hyphens:auto}
html body.apple-archive.apple-archive.apple-archive.apple-archive main a,html body.apple-archive.apple-archive.apple-archive.apple-archive footer a{overflow-wrap:break-word;word-break:normal}
html body.apple-archive.apple-archive.apple-archive.apple-archive .u-mb-xs{margin-bottom:.4rem!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive .u-mb-sm{margin-bottom:.5rem!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive .u-mt-xs{margin-top:.4rem!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive .u-mt-md{margin-top:1.2rem!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive .u-mt-xl{margin-top:2.5rem!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive .u-last-row{border-bottom:none!important;padding-bottom:0!important}
@media(max-width:719px){html body.apple-archive.apple-archive.apple-archive.apple-archive{--art-gutter:clamp(1.15rem,5.4vw,1.45rem);--art-card-pad:clamp(1.15rem,5vw,1.4rem)}html body.apple-archive.apple-archive.apple-archive.apple-archive h1{font-size:clamp(2.3rem,10.5vw,3rem)!important;line-height:1.03!important;letter-spacing:-.045em!important}html body.apple-archive.apple-archive.apple-archive.apple-archive h2{font-size:clamp(1.72rem,7.8vw,2.3rem)!important;line-height:1.09!important;letter-spacing:-.034em!important}html body.apple-archive.apple-archive.apple-archive.apple-archive h3{font-size:clamp(1.24rem,5.4vw,1.55rem)!important;line-height:1.2!important}html body.apple-archive.apple-archive.apple-archive.apple-archive main>section{padding-block:clamp(3.6rem,13vw,4.75rem)!important}html body.apple-archive.apple-archive.apple-archive.apple-archive main .linklist>li{padding:1.15rem .15rem!important}}
@media(min-width:720px) and (max-width:1024px){html body.apple-archive.apple-archive.apple-archive.apple-archive{--art-gutter:clamp(2rem,4.6vw,3rem);--art-card-pad:clamp(1.35rem,2.8vw,1.9rem)}html body.apple-archive.apple-archive.apple-archive.apple-archive h1{font-size:clamp(3.1rem,6.5vw,4.15rem)!important}}
/* STAGE96-HUMAN-EDITORIAL-APPLE-RESILIENCE:END */\n'''
cssp.write_text(css)

cfgp=ROOT/'data/design-release.json'; cfg=json.loads(cfgp.read_text()); cfg['release']=RELEASE; cfg['note']='Stage 96 completes the three-language human editorial pass and adds Apple-style layout resilience: centralized spacing utilities, safe grid/cell shrinking, long-text wrapping, and tuned phone/tablet typography across all ART content pages.'
h=hashlib.sha256()
for p in sorted((ROOT/'assets/css').glob('*.css')):h.update(p.read_bytes())
for p in sorted((ROOT/'assets/js').glob('*.js')):h.update(p.read_bytes())
for p in sorted((ROOT/'assets/video').glob('*.mp4')):h.update(p.read_bytes())
cfg['assetDigest']=h.hexdigest()[:16]; cfgp.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n')
print(f'Stage96 applied across {count} pages; release={RELEASE}; digest={cfg["assetDigest"]}')
