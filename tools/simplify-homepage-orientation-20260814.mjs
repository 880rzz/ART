import fs from 'node:fs';

const pages=[
  {
    file:'index.html',
    journeyTitle:'How it took shape',
    journeyLead:'A concise map of the artistic path. The full narrative, sources and interpretation remain in the dedicated archive pages.',
    periods:[
      ['1999–2013','Documentation and portrait practice','Technical discipline, documentary work and New York gradually turned the camera toward people and presence.'],
      ['2014–2018','Identity, body and memory','Real Women, Milestones ’56, Awakening and the books established the recurring themes of identity, recovery and lived memory.'],
      ['2019–2025','Community, technology and two-city practice','Teaching, curatorial work, digital experiments and Vienna–Budapest projects expanded the practice beyond individual series.'],
      ['2026–2027','Presence as the connecting question','EUFÓRIA and the current archive bring the earlier strands together around public presence, intimacy and the life of an image.']
    ],
    curators:'Read the curatorial narrative', community:'Community and teaching',
    exhibitionTitle:'Exhibitions', exhibitionLead:'The complete exhibition route remains available from the homepage without repeating each exhibition essay here.',
    exhibit:[['2027','EUFÓRIA — The Anatomy of Presence','exhibitions/euforia.html'],['2025','Femme Fatale','exhibitions/femmefatale.html'],['2025','Different Image / Different','exhibitions/mas-kepp-mas.html'],['2024','Touch Vienna & Touch Munich','exhibitions/touch-wien.html'],['2024','I Am the Woman','exhibitions/enano.html'],['2023','The False Faces of Reality / The Lies of the Internet','exhibitions/avalosag.html'],['2022','The Men’s Dream — The Genesis of Beauty','exhibitions/themensdream.html'],['2021','The Frame — 20 Years','exhibitions/theframe.html'],['2021','You Can Be Too…','exhibitions/teislehetsz.html'],['2017–2018','Awakening — The New Beginning','exhibitions/ebredes.html'],['2018','The World of Woman','exhibitions/anovilaga.html'],['2018','Ballerina Project New York — Strut Your Stuff','exhibitions/balerina-project-new-york.html'],['2018','Contemporary Artists of Pest County','exhibitions/fotokiallitas8.html'],['2017','Snippets','exhibitions/szosszenetek.html'],['2016','I Became a Father','exhibitions/fotokiallitas5.html'],['2016','Milestones ’56','exhibitions/merfoldkovek1956.html'],['2015','50 Shades of Woman','exhibitions/fotokiallitas4.html'],['2014','Real Women — 30+1 Portraits of Natural Beauty','exhibitions/fotokiallitas1.html'],['2014','Those Old Flirty Times — Pin-Up Rehabilitated','exhibitions/fotokiallitas2.html'],['2014','Hungarian Women in New York','exhibitions/fotokiallitas3.html']]
  },
  {
    file:'hu/index.html',
    journeyTitle:'Hogyan épült fel',
    journeyLead:'Az életmű rövid térképe. A teljes történet, a források és az értelmezési réteg a külön archívumoldalakon marad.',
    periods:[
      ['1999–2013','Dokumentáció és portrészemlélet','A technikai fegyelem, a dokumentarista munka és New York fokozatosan az emberek és a jelenlét felé fordította a kamerát.'],
      ['2014–2018','Identitás, test és emlékezet','Az igazi Nők, a Mérföldkövek ’56, az Ébredés és a könyvek kijelölték az identitás, a felépülés és a megélt emlékezet visszatérő témáit.'],
      ['2019–2025','Közösség, technológia és kétvárosi gyakorlat','Az oktatás, a kurátori munka, a digitális kísérletek és a Bécs–Budapest projektek az egyedi sorozatokon túlra tágították a gyakorlatot.'],
      ['2026–2027','A jelenlét mint összekötő kérdés','Az EUFÓRIA és a rendezett archívum a nyilvános jelenlét, az intimitás és a képek utóélete köré kapcsolja össze a korábbi szálakat.']
    ],
    curators:'Kurátori történet', community:'Közösség és oktatás',
    exhibitionTitle:'A munkák nyilvános története', exhibitionLead:'A teljes kiállítási útvonal továbbra is elérhető a főoldalról, de az egyes kiállítások részletes esszéi a saját oldalukon maradnak.',
    exhibit:[['2027','EUFÓRIA — a Jelenlét anatómiája','exhibitions/euforia.html'],['2025','Femme Fatale','exhibitions/femmefatale.html'],['2025','Más kép / Más','exhibitions/mas-kepp-mas.html'],['2024','Touch Bécs & Touch München','exhibitions/touch-wien.html'],['2024','Én a Nő','exhibitions/enano.html'],['2023','A valóság hamis arcai','exhibitions/avalosag.html'],['2022','The Men’s Dream — A szépség genezise','exhibitions/themensdream.html'],['2021','The Frame — 20 év','exhibitions/theframe.html'],['2021','Te is lehetsz…','exhibitions/teislehetsz.html'],['2017–2018','Ébredés — az Új kezdet','exhibitions/ebredes.html'],['2018','A Nő világa','exhibitions/anovilaga.html'],['2018','Ballerina Project New York — Strut Your Stuff','exhibitions/balerina-project-new-york.html'],['2018','Pest megye kortárs művészei','exhibitions/fotokiallitas8.html'],['2017','Szösszenetek','exhibitions/szosszenetek.html'],['2016','Apa lettem','exhibitions/fotokiallitas5.html'],['2016','Mérföldkövek ’56','exhibitions/merfoldkovek1956.html'],['2015','A Nő ötven árnyalata','exhibitions/fotokiallitas4.html'],['2014','Az igazi Nők — 30+1 portré a természetes szépségről','exhibitions/fotokiallitas1.html'],['2014','Régi csibészes idők — a pin-up rehabilitációja','exhibitions/fotokiallitas2.html'],['2014','Magyar nők New Yorkban','exhibitions/fotokiallitas3.html']]
  },
  {
    file:'de-at/index.html',
    journeyTitle:'Wie es Gestalt annahm',
    journeyLead:'Eine knappe Karte des künstlerischen Weges. Die vollständige Erzählung, Quellen und Einordnung bleiben auf den jeweiligen Archivseiten.',
    periods:[
      ['1999–2013','Dokumentation und Porträthaltung','Technische Disziplin, dokumentarische Arbeit und New York richteten die Kamera schrittweise auf Menschen und Präsenz.'],
      ['2014–2018','Identität, Körper und Erinnerung','Echte Frauen, Meilensteine ’56, Erwachen und die Bücher etablierten Identität, Genesung und gelebte Erinnerung als wiederkehrende Themen.'],
      ['2019–2025','Gemeinschaft, Technologie und Praxis in zwei Städten','Lehre, kuratorische Arbeit, digitale Experimente und Wien–Budapest-Projekte erweiterten die Praxis über einzelne Serien hinaus.'],
      ['2026–2027','Präsenz als verbindende Frage','EUFÓRIA und das geordnete Archiv führen frühere Linien um öffentliche Präsenz, Intimität und das Nachleben von Bildern zusammen.']
    ],
    curators:'Kuratorische Erzählung lesen', community:'Gemeinschaft und Lehre',
    exhibitionTitle:'Ausstellungen', exhibitionLead:'Der vollständige Ausstellungsweg bleibt von der Startseite erreichbar; die ausführlichen Texte gehören jedoch auf die jeweiligen Ausstellungsseiten.',
    exhibit:[['2027','EUFÓRIA — Die Anatomie der Gegenwart','exhibitions/euforia.html'],['2025','Femme Fatale','exhibitions/femmefatale.html'],['2025','Anderes Bild / Anders','exhibitions/mas-kepp-mas.html'],['2024','Touch Wien & Touch München','exhibitions/touch-wien.html'],['2024','Ich bin die Frau','exhibitions/enano.html'],['2023','Die falschen Gesichter der Wirklichkeit / Die Lügen des Internets','exhibitions/avalosag.html'],['2022','The Men’s Dream — Die Genesis der Schönheit','exhibitions/themensdream.html'],['2021','The Frame — 20 Jahre','exhibitions/theframe.html'],['2021','Auch du kannst es werden…','exhibitions/teislehetsz.html'],['2017–2018','Erwachen — Der neue Anfang','exhibitions/ebredes.html'],['2018','Die Welt der Frau','exhibitions/anovilaga.html'],['2018','Ballerina Project New York — Strut Your Stuff','exhibitions/balerina-project-new-york.html'],['2018','Zeitgenössische Künstler des Komitats Pest','exhibitions/fotokiallitas8.html'],['2017','Schnipsel','exhibitions/szosszenetek.html'],['2016','Ich wurde Vater','exhibitions/fotokiallitas5.html'],['2016','Meilensteine ’56','exhibitions/merfoldkovek1956.html'],['2015','Fünfzig Schattierungen der Frau','exhibitions/fotokiallitas4.html'],['2014','Echte Frauen — 30+1 Porträts natürlicher Schönheit','exhibitions/fotokiallitas1.html'],['2014','Jene alten koketten Zeiten — Pin-up rehabilitiert','exhibitions/fotokiallitas2.html'],['2014','Ungarische Frauen in New York','exhibitions/fotokiallitas3.html']]
  }
];

const cssFile='assets/css/site.css';
const contractEnd='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function sectionRange(html,id){const re=new RegExp(`<section\\b[^>]*\\bid=["']${escape(id)}["'][^>]*>`,'i');const m=re.exec(html);if(!m)throw new Error(`Missing #${id}`);let depth=1;const tag=/<\/?section\b[^>]*>/gi;tag.lastIndex=m.index+m[0].length;let t;while((t=tag.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return{start:m.index,end:tag.lastIndex}}throw new Error(`Unclosed #${id}`)}
function esc(s){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
for(const p of pages){let html=fs.readFileSync(p.file,'utf8');if(html.includes('data-home-orientation="v1"'))throw new Error(`${p.file}: already simplified`);const jr=sectionRange(html,'journey'),er=sectionRange(html,'exhibitions');if(er.start<jr.end)throw new Error(`${p.file}: unexpected journey/exhibitions order`);
  const periods=p.periods.map(([year,title,copy])=>`<article class="archive-card orientation-card"><p class="meta">${esc(year)}</p><h3>${esc(title)}</h3><p>${esc(copy)}</p></article>`).join('');
  const journey=`<section class="tone-a life-journey" id="journey" data-home-orientation="v1"><div class="wrap"><div class="section-head"><h2>${esc(p.journeyTitle)}</h2><p class="lead">${esc(p.journeyLead)}</p></div><div class="archive-grid archive-orientation-grid">${periods}</div><div class="service-actions"><a class="btn-link" href="curators.html">${esc(p.curators)}</a><a class="btn-link" href="community.html">${esc(p.community)}</a></div></div></section>`;
  const records=p.exhibit.map(([year,title,href])=>`<a class="exhibition-map__row" href="${href}"><span class="meta">${esc(year)}</span><span>${esc(title)}</span></a>`).join('');
  const exhibition=`<section class="tone-c" id="exhibitions" data-home-orientation="v1"><div class="wrap"><div class="section-head"><h2>${esc(p.exhibitionTitle)}</h2><p class="lead">${esc(p.exhibitionLead)}</p></div><nav class="exhibition-map" aria-label="${esc(p.exhibitionTitle)}">${records}</nav></div></section>`;
  html=html.slice(0,jr.start)+journey+html.slice(jr.end,er.start)+exhibition+html.slice(er.end);
  if((html.match(/class="exhibition-map__row"/g)||[]).length!==20)throw new Error(`${p.file}: expected 20 exhibition routes after migration`);
  fs.writeFileSync(p.file,html);console.log(`${p.file}: reduced homepage journey and exhibition essays to an orientation map.`);
}
let css=fs.readFileSync(cssFile,'utf8');if(!css.includes(contractEnd))throw new Error('Apple responsive contract END marker missing');const patch=`
/* HOME-ORIENTATION-REMEDIATION-20260814:START */
html body.apple-archive .archive-orientation-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:clamp(14px,2vw,22px)!important;margin-top:clamp(24px,3vw,36px)!important}
html body.apple-archive .orientation-card{padding:18px 20px!important;border-radius:16px!important;min-height:0!important}
html body.apple-archive .orientation-card :is(h3,p){margin-top:0!important}
html body.apple-archive .exhibition-map{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:clamp(28px,5vw,72px)!important;border-top:1px solid rgba(220,197,107,.22)!important;margin-top:clamp(24px,3vw,36px)!important}
html body.apple-archive .exhibition-map__row{display:grid!important;grid-template-columns:minmax(5.2rem,auto) minmax(0,1fr)!important;gap:1rem!important;align-items:baseline!important;padding:14px 0!important;border-bottom:1px solid rgba(220,197,107,.18)!important;text-decoration:none!important;color:var(--apple-art-ink)!important;min-height:52px!important}
html body.apple-archive .exhibition-map__row .meta{color:var(--apple-art-gold)!important;margin:0!important}
@media(max-width:1024px){html body.apple-archive .archive-orientation-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:768px){html body.apple-archive .archive-orientation-grid,html body.apple-archive .exhibition-map{grid-template-columns:1fr!important}html body.apple-archive .exhibition-map__row{grid-template-columns:5.2rem minmax(0,1fr)!important}}
@media(max-width:430px){html body.apple-archive .exhibition-map__row{grid-template-columns:1fr!important;gap:.15rem!important;padding:13px 0!important}}
/* HOME-ORIENTATION-REMEDIATION-20260814:END */
`;
if(css.includes('HOME-ORIENTATION-REMEDIATION-20260814:START'))css=css.replace(/\/\* HOME-ORIENTATION-REMEDIATION-20260814:START \*\/[\s\S]*?\/\* HOME-ORIENTATION-REMEDIATION-20260814:END \*\/\n?/,'');css=css.replace(contractEnd,patch+contractEnd);fs.writeFileSync(cssFile,css);console.log('Applied compact ART homepage orientation CSS.');
