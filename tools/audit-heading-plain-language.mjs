import fs from 'node:fs';

const failures=[];
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const readHeadings=file=>{
  const html=fs.readFileSync(file,'utf8');
  return {
    h1:[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>clean(m[1])),
    h2:[...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>clean(m[1])),
    text:clean(html)
  };
};
const required={
  'index.html':{h1:'BANHALMI ART — works, exhibitions and books',h2:['Portraits beyond professional roles','Selected works from the archive','Recurring themes in the work','How the work developed over time','Contact and collaboration','Sources and documentation']},
  'hu/index.html':{h1:'BANHALMI ART — művek, kiállítások és könyvek',h2:['Portrék a szakmai szerepeken túl','Válogatott művek az archívumból','Visszatérő témák a munkákban','Hogyan alakult a munka az évek során','Kapcsolat és együttműködés','Források és dokumentáció']},
  'de-at/index.html':{h1:'BANHALMI ART — Werke, Ausstellungen und Bücher',h2:['Porträts jenseits beruflicher Rollen','Ausgewählte Werke aus dem Archiv','Wiederkehrende Themen im Werk','Wie sich die Arbeit über die Jahre entwickelt hat','Kontakt und Zusammenarbeit']},
  'curators.html':{h2:['Key periods and projects','1 · Early work and human stories','2 · Milestones ’56 — portraits and personal histories','3 · Awakening — illness, body and recovery','4 · The World of Woman — life stages and personal stories','5 · Projects using digital technology','6 · Touch — intimacy and consent','7 · Why the work may be relevant to exhibitions and collections','Possible exhibition concepts','How I photograph people','How the work developed']},
  'hu/curators.html':{h2:['Főbb korszakok és projektek','1 · Korai munkák és emberi történetek','2 · Mérföldkövek ’56 — portrék és személyes történetek','3 · Ébredés — betegség, testkép és felépülés','4 · A Nő világa — életszakaszok és személyes történetek','5 · Digitális technológiával készült projektek','6 · Touch — intimitás és beleegyezés','7 · Miért lehet releváns kiállításokhoz és gyűjteményekhez','Hogyan fényképezek embereket','Hogyan alakult a munka']},
  'de-at/curators.html':{h2:['Wichtige Phasen und Projekte','1 · Frühe Arbeiten und menschliche Geschichten','2 · Meilensteine ’56 — Porträts und persönliche Geschichten','3 · Erwachen — Krankheit, Körperbild und Genesung','4 · Die Welt der Frau — Lebensphasen und persönliche Geschichten','5 · Projekte mit digitaler Technologie','6 · Touch — Intimität und Einvernehmen','7 · Relevanz für Ausstellungen und Sammlungen','Mögliche Ausstellungskonzepte','Wie ich Menschen fotografiere','Wie sich die Arbeit entwickelt hat']},
  'press.html':{h2:['Interviews and conversations','Coverage of projects about the body, illness and recovery','Exhibitions and institutional coverage','Community projects and public work','Interviews with Norbert Bánhalmi','Sources and documentation']},
  'hu/press.html':{h2:['Interjúk és beszélgetések','A testtel, betegséggel és felépüléssel foglalkozó projektek a sajtóban','Kiállítások és intézményi megjelenések','Közösségi projektek és nyilvános munka','Interjúk Bánhalmi Norberttel','Források és dokumentáció']},
  'de-at/press.html':{h2:['Interviews und Gespräche','Berichterstattung über Projekte zu Körper, Krankheit und Genesung','Ausstellungen und institutionelle Berichterstattung','Gemeinschaftsprojekte und öffentliche Arbeit','Interviews mit Norbert Bánhalmi','Quellen und Dokumentation']},
  'private-photography.html':{h2:['Your idea and the photographs you want','Three types of personal photography','Related artistic projects']},
  'hu/private-photography.html':{h2:['Az elképzelése és a kívánt képek','A személyes fotózás három formája','Kapcsolódó művészeti projektek']},
  'de-at/private-photography.html':{h2:['Ihre Idee und die gewünschten Fotografien','Drei Formen persönlicher Fotografie','Verwandte künstlerische Projekte']},
  'exhibitions/ebredes.html':{h2:['Illness, body image and recovery in the Awakening series']},
  'hu/exhibitions/ebredes.html':{h2:['Betegség, testkép és felépülés az Ébredés sorozatban']},
  'de-at/exhibitions/ebredes.html':{h2:['Krankheit, Körperbild und Genesung in der Serie Erwachen']},
  'exhibitions/anovilaga.html':{h2:['Life stages and personal stories in The World of Woman']},
  'hu/exhibitions/anovilaga.html':{h2:['Életszakaszok és személyes történetek A Nő világa sorozatban']},
  'de-at/exhibitions/anovilaga.html':{h2:['Lebensphasen und persönliche Geschichten in Die Welt der Frau']},
  'exhibitions/touch-wien.html':{h2:['Body, touch and consent in the Touch series']},
  'hu/exhibitions/touch-wien.html':{h2:['Test, érintés és beleegyezés a Touch sorozatban']},
  'de-at/exhibitions/touch-wien.html':{h2:['Körper, Berührung und Einvernehmen in der Serie Touch']},
  'exhibitions/merfoldkovek1956.html':{h2:['Personal stories of emigration after the 1956 Hungarian Revolution']},
  'hu/exhibitions/merfoldkovek1956.html':{h2:['Személyes történetek az 1956 utáni emigrációról']},
  'de-at/exhibitions/merfoldkovek1956.html':{h2:['Persönliche Geschichten der Emigration nach dem ungarischen Volksaufstand von 1956']}
};
const retired=[
  'When does the role fall away — and the person remain?',
  'Mikor tűnik el a szerep, és marad ott az ember?',
  'Wann tritt die Rolle zurück und der Mensch hervor?',
  'The investigation of presence · Since 1999','A jelenlét kutatása · 1999 óta','Die Erforschung der Präsenz · Seit 1999',
  'Throughout my life, I have explored presence through photography.','Egész életemben a fotográfián keresztül a jelenlétet kutattam.','Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.',
  'The body as battlefield and sanctuary: Awakening',
  'A test mint csatatér és szentély: Ébredés',
  'Der Körper als Schlachtfeld und Heiligtum: Erwachen',
  'Toward sacred intimacy: Touch',
  'A szakrális intimitás felé: Touch',
  'Auf dem Weg zur sakralen Intimität: Touch',
  'Recognising the moment','A pillanat felismerése','Den Augenblick erkennen',
  'The idea comes first','Először az elképzelés','Zuerst die Vorstellung'
];
for(const [file,contract] of Object.entries(required)){
  if(!fs.existsSync(file)){failures.push(`${file}: missing`);continue;}
  const got=readHeadings(file);
  if(contract.h1){
    if(got.h1.length!==1)failures.push(`${file}: expected exactly one H1, got ${got.h1.length}`);
    if(got.h1[0]!==contract.h1)failures.push(`${file}: H1 mismatch: "${got.h1[0]||''}"`);
  }
  for(const h2 of contract.h2||[])if(!got.h2.includes(h2))failures.push(`${file}: required plain-language H2 missing: ${h2}`);
  for(const phrase of retired)if(got.text.includes(phrase))failures.push(`${file}: retired abstract heading remains: ${phrase}`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Plain-human ART heading gate PASS: ${Object.keys(required).length} EN/HU/DE routes preserve official work titles while navigation and explanatory H1/H2 copy stays concrete.`);
