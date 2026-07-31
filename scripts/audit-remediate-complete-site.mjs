import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles=[];
const skip=new Set(['.git','node_modules','.github']);
const style='<link rel="stylesheet" href="/assets/css/apple-editorial-system.css?v=20260730-complete-audit-v1">';

async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    if(skip.has(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) await walk(full);
    else if(e.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

const curatorCopy={
  en:{
    heading:'The oeuvre as five connected periods',
    intro:'These periods are not separate careers. They describe how the same central enquiry — when a person, memory or community becomes genuinely present — moved through different subjects, places and public forms.',
    periods:[
      ['I · 1999–2013','Discipline, role and constructed identity','The early practice grew from commissioned and institutional environments. The central tension was already visible: the difference between an assigned role and the person who remains present inside it. Structure, restraint and responsibility became lasting working principles.'],
      ['II · 2014–2016','Human stories and historical memory','New York, female identity, fatherhood and the portraits connected to 1956 shifted the work toward personal testimony. Photography became a way to hold individual experience and public history in the same frame without reducing either to illustration.'],
      ['III · 2017–2018','The body as memory, illness and recovery','Awakening, Snippets and The World of Woman focused on the body after change: illness, recovery, intimacy, ageing and turning points. Images, testimony, literature and performance were used together, while each person retained authorship over their own experience.'],
      ['IV · 2019–2022','Institutions, publishing and curatorial responsibility','Books, exhibitions, ambassadorship and gallery work placed the practice inside cultural and technological systems. The question became how an artwork can remain human and credible while moving through institutions, public presentation and new forms of circulation.'],
      ['V · 2023–present','Community, education and public presence','Vienna, community building, teaching, charity projects and executive portraiture extended the enquiry into relationships. Presence here means trust, responsibility and the ability to make another person visible without turning them into a visual stereotype.']
    ],
    report:'Read the curatorial overview', reportHref:'/curators.html#curatorial-periods',
    contact:'Exhibition or loan enquiry', contactHref:'mailto:hello@norbertbanhalmi.com?subject=Exhibition%20or%20loan%20enquiry',
    chronology:'Exhibitions in chronological order', chronologyHref: '/#exhibitions'
  },
  hu:{
    heading:'Az életmű öt összekapcsolódó korszaka',
    intro:'Ezek nem külön pályák. Azt mutatják meg, hogyan haladt végig ugyanaz a központi kérdés — mikor válik egy ember, egy emlék vagy egy közösség valóban jelenlévővé — különböző témákon, helyszíneken és nyilvános formákon.',
    periods:[
      ['I · 1999–2013','Fegyelem, szerep és konstruált identitás','A korai gyakorlat megbízásos és intézményi környezetekből indult. Már ekkor megjelent a későbbi életmű alapfeszültsége: mi a különbség a kiosztott szerep és a szerepen belül jelen maradó ember között. A struktúra, a visszafogottság és a felelősség tartós munkamódszerré vált.'],
      ['II · 2014–2016','Emberi történetek és történelmi emlékezet','New York, a női identitás, az apaság és az 1956-hoz kapcsolódó portrék a személyes tanúságtétel felé fordították a munkát. A fotográfia egyszerre tartotta meg az egyéni tapasztalatot és a nyilvános történelmet, anélkül hogy bármelyiket puszta illusztrációvá egyszerűsítette volna.'],
      ['III · 2017–2018','A test mint emlékezet, betegség és gyógyulás','Az Ébredés, a Szösszenetek és A Nő világa a változás utáni testtel foglalkozott: betegséggel, felépüléssel, intimitással, öregedéssel és életfordulókkal. A képek, a személyes vallomások, az irodalom és a performansz együtt jelentek meg, miközben minden résztvevő megtartotta saját történetének szerzőségét.'],
      ['IV · 2019–2022','Intézmények, kiadványok és kurátori felelősség','A könyvek, kiállítások, márkanagyköveti és galériás munkák kulturális és technológiai rendszerekbe helyezték az alkotói gyakorlatot. A kérdés az lett, hogyan maradhat emberi és hiteles egy mű, miközben intézményeken, nyilvános bemutatáson és új terjesztési formákon halad keresztül.'],
      ['V · 2023–napjaink','Közösség, oktatás és nyilvános jelenlét','Bécs, a közösségépítés, az oktatás, a jótékonysági projektek és az executive portré a kapcsolatok felé tágították a kutatást. A jelenlét itt bizalmat, felelősséget és annak képességét jelenti, hogy valaki láthatóvá váljon anélkül, hogy vizuális sztereotípiává egyszerűsödne.']
    ],
    report:'Kurátori összefoglaló', reportHref:'/hu/curators.html#curatorial-periods',
    contact:'Kiállítási vagy kölcsönzési megkeresés', contactHref:'mailto:hello@norbertbanhalmi.com?subject=Kiállítási%20vagy%20kölcsönzési%20megkeresés',
    chronology:'Kiállítások időrendben', chronologyHref:'/hu/#exhibitions'
  },
  de:{
    heading:'Das Œuvre in fünf verbundenen Perioden',
    intro:'Diese Perioden sind keine getrennten Karrieren. Sie zeigen, wie dieselbe zentrale Frage — wann ein Mensch, eine Erinnerung oder eine Gemeinschaft wirklich präsent wird — durch unterschiedliche Themen, Orte und öffentliche Formen weitergeführt wurde.',
    periods:[
      ['I · 1999–2013','Disziplin, Rolle und konstruierte Identität','Die frühe Praxis entstand in Auftrags- und Institutionszusammenhängen. Schon hier wurde die Grundspannung des späteren Werks sichtbar: der Unterschied zwischen einer zugewiesenen Rolle und dem Menschen, der innerhalb dieser Rolle gegenwärtig bleibt. Struktur, Zurückhaltung und Verantwortung wurden zu dauerhaften Arbeitsprinzipien.'],
      ['II · 2014–2016','Menschliche Geschichten und historisches Gedächtnis','New York, weibliche Identität, Vaterschaft und die mit 1956 verbundenen Porträts führten die Arbeit zur persönlichen Zeugenschaft. Fotografie hielt individuelle Erfahrung und öffentliche Geschichte im selben Bildraum, ohne eine von beiden zur bloßen Illustration zu reduzieren.'],
      ['III · 2017–2018','Der Körper als Erinnerung, Krankheit und Genesung','Awakening, Snippets und The World of Woman richteten den Blick auf den Körper nach Veränderung: Krankheit, Genesung, Intimität, Altern und Wendepunkte. Bilder, Zeugnisse, Literatur und Performance wurden verbunden, während jede beteiligte Person die Autorschaft über die eigene Erfahrung behielt.'],
      ['IV · 2019–2022','Institutionen, Publikationen und kuratorische Verantwortung','Bücher, Ausstellungen, Markenbotschafter- und Galeriearbeit verorteten die Praxis in kulturellen und technologischen Systemen. Im Zentrum stand nun die Frage, wie ein Werk menschlich und glaubwürdig bleiben kann, während es Institutionen, öffentliche Präsentation und neue Zirkulationsformen durchläuft.'],
      ['V · 2023–heute','Gemeinschaft, Bildung und öffentliche Präsenz','Wien, Gemeinschaftsarbeit, Unterricht, gemeinnützige Projekte und Executive Portraiture erweiterten die Untersuchung in Richtung Beziehung. Präsenz bedeutet hier Vertrauen, Verantwortung und die Fähigkeit, einen Menschen sichtbar zu machen, ohne ihn auf ein visuelles Stereotyp zu reduzieren.']
    ],
    report:'Kuratorische Übersicht lesen', reportHref:'/de-at/curators.html#curatorial-periods',
    contact:'Anfrage zu Ausstellung oder Leihgabe', contactHref:'mailto:hello@norbertbanhalmi.com?subject=Anfrage%20zu%20Ausstellung%20oder%20Leihgabe',
    chronology:'Ausstellungen in chronologischer Reihenfolge', chronologyHref:'/de-at/#exhibitions'
  }
};

function languageFor(rel){return rel.startsWith('hu/')?'hu':rel.startsWith('de-at/')?'de':'en';}
function curatorSection(copy){
  return `<section id="curatorial-periods" class="curatorial-periods"><div class="wrap"><div class="curatorial-periods__intro"><p class="label">Curatorial framework</p><h2>${copy.heading}</h2><p class="lead">${copy.intro}</p></div><div class="curatorial-periods__grid">${copy.periods.map(([n,t,p])=>`<article class="curatorial-period"><span class="period-no">${n}</span><h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>`;
}
function normalizeCtas(content,copy){
  const replacements=[
    [/(<a\b[^>]*>)(?:Teljes jelentés a banhalmi\.art-on|Full statement on banhalmi\.art|Vollständige Darstellung auf banhalmi\.art)(<\/a>)/gi,`<a class="btn" href="${copy.reportHref}">${copy.report}</a>`],
    [/(<a\b[^>]*>)(?:Írj kölcsönzésről vagy projektről|Write about a loan or project|Anfrage zu Leihgabe oder Projekt)(<\/a>)/gi,`<a class="btn" href="${copy.contactHref}">${copy.contact}</a>`],
    [/(<a\b[^>]*>)(?:Kiállítások időrendben|Exhibitions chronologically|Ausstellungen chronologisch)(<\/a>)/gi,`<a class="btn" href="${copy.chronologyHref}">${copy.chronology}</a>`]
  ];
  for(const [re,to] of replacements) content=content.replace(re,to);
  return content;
}
function removeAdjacentDuplicateParagraphs(content){
  return content.replace(/(<p(?:\s[^>]*)?>\s*([\s\S]*?)\s*<\/p>)\s*<p(?:\s[^>]*)?>\s*\2\s*<\/p>/gi,'$1');
}
function removeUncertainExhibitionClaims(content,rel){
  if(!/(^|\/)exhibitions\//.test(rel)) return content;
  return content.replace(/<p(?:\s[^>]*)?>[^<]*(?:unverified|not independently verified|uncertain source|bizonytalan forrás|nem ellenőrzött|nem igazolt|nicht verifiziert|unsichere Quelle)[\s\S]*?<\/p>/gi,'');
}
function ensureExternalRel(content){
  return content.replace(/<a\b([^>]*href=["']https?:\/\/[^"']+["'][^>]*)>/gi,(m,a)=>{
    let attrs=a;
    if(!/target=/i.test(attrs)) attrs+=' target="_blank"';
    if(!/rel=/i.test(attrs)) attrs+=' rel="noopener noreferrer"';
    return `<a${attrs}>`;
  });
}
function markPage(content,rel){
  if(/(?:family-origins|familienwurzeln|csaladi-gyokerek)\.html$/.test(rel)){
    content=content.replace(/<body\b([^>]*)>/i,(m,a)=>/family-page/.test(a)?m:/class=["']([^"']*)["']/.test(a)?`<body${a.replace(/class=["']([^"']*)["']/,(_,c)=>`class="${c} family-page"`)}>`:`<body${a} class="family-page">`);
  }
  if(/writing\.html$/.test(rel)) content=content.replace(/<main\b([^>]*)>/i,(m,a)=>/writing-page/.test(a)?m:/class=["']([^"']*)["']/.test(a)?`<main${a.replace(/class=["']([^"']*)["']/,(_,c)=>`class="${c} writing-page"`)}>`:`<main${a} class="writing-page">`);
  if(/community\.html$/.test(rel)) content=content.replace(/<main\b([^>]*)>/i,(m,a)=>/community-page/.test(a)?m:/class=["']([^"']*)["']/.test(a)?`<main${a.replace(/class=["']([^"']*)["']/,(_,c)=>`class="${c} community-page"`)}>`:`<main${a} class="community-page">`);
  return content;
}
async function localExists(rel,href){
  if(!href||href.startsWith('#')||/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(href)) return true;
  const clean=href.split('#')[0].split('?')[0];
  if(!clean) return true;
  let target=clean.startsWith('/')?path.join(root,clean):path.resolve(path.dirname(path.join(root,rel)),clean);
  if(target.endsWith(path.sep)) target=path.join(target,'index.html');
  try{await access(target);return true;}catch{}
  if(!path.extname(target)){try{await access(`${target}.html`);return true;}catch{}}
  return false;
}

const report={pages:0,changed:[],brokenLocalLinks:[],emptyControls:[],duplicateIds:[]};
for(const file of htmlFiles){
  const rel=path.relative(root,file).replaceAll('\\','/');
  const original=await readFile(file,'utf8');
  let content=original;
  report.pages++;
  content=content.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/apple-editorial-system\.css(?:\?v=[^"]+)?">/gi,'');
  content=content.replace(/<\/head>/i,`${style}\n</head>`);
  content=markPage(content,rel);
  content=removeAdjacentDuplicateParagraphs(content);
  content=removeUncertainExhibitionClaims(content,rel);
  content=ensureExternalRel(content);
  if(/curators\.html$/.test(rel)){
    const copy=curatorCopy[languageFor(rel)];
    content=normalizeCtas(content,copy);
    if(!content.includes('id="curatorial-periods"')){
      const section=curatorSection(copy);
      /* The anchor search must be confined to <main>. Searching the whole
         document matched the cookie dialog's <div class="c-actions"> first
         on the English and German pages, which injected the entire
         curatorial-periods section inside #consent — hiding it from readers
         (the dialog is hidden by default) and stuffing the cookie banner
         with a full content section. Anchor on the presence-context section
         inside main instead, which is where the Hungarian page carries it. */
      const mainStart=content.search(/<main\b/i);
      const mainEnd=content.search(/<\/main>/i);
      if(mainStart>-1&&mainEnd>mainStart){
        const head=content.slice(0,mainStart);
        const body=content.slice(mainStart,mainEnd);
        const tail=content.slice(mainEnd);
        const pc=/<section[^>]*class=["'][^"']*presence-context[^"']*["'][^>]*>[\s\S]*?<\/section>/i.exec(body);
        content = pc
          ? head+body.slice(0,pc.index+pc[0].length)+`\n${section}`+body.slice(pc.index+pc[0].length)+tail
          : head+body+`${section}\n`+tail;
      }
    }
  }
  const ids=[...content.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
  for(const id of new Set(ids)) if(ids.filter(x=>x===id).length>1) report.duplicateIds.push({page:rel,id});
  for(const m of content.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)){
    const text=m[3].replace(/<[^>]+>/g,'').trim();
    if(!text&&!/aria-label=/i.test(m[2])) report.emptyControls.push({page:rel,tag:m[1]});
  }
  for(const m of content.matchAll(/\bhref=["']([^"']+)["']/gi)) if(!(await localExists(rel,m[1]))) report.brokenLocalLinks.push({page:rel,href:m[1]});
  if(content!==original){await writeFile(file,content,'utf8');report.changed.push(rel);}
}
report.brokenLocalLinks=[...new Map(report.brokenLocalLinks.map(x=>[`${x.page}|${x.href}`,x])).values()];
await writeFile(path.join(root,'complete-site-audit.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify({pages:report.pages,changed:report.changed.length,brokenLocalLinks:report.brokenLocalLinks.length,emptyControls:report.emptyControls.length,duplicateIds:report.duplicateIds.length},null,2));
