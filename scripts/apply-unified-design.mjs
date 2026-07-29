import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = [];
const skip = new Set(['.git','node_modules','.github']);
const archiveStylesheet = '<link rel="stylesheet" href="/assets/css/archive-system.css?v=20260729-apple-layout-v3">';
const refinementStylesheet = '<link rel="stylesheet" href="/assets/css/design-refinements.css?v=20260729-responsive-system-v3">';

async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    if(skip.has(e.name)) continue;
    const f=path.join(dir,e.name);
    if(e.isDirectory()) await walk(f);
    else if(e.name.endsWith('.html')) html.push(f);
  }
}
await walk(root);

const trusted = {
  mfvsz: 'https://www.mfvsz.com/hu/tagsag/',
  amcham: 'https://amcham.at/members-list/',
  wko: 'https://firmen.wko.at/norbert-banhalmi-visuelle-strategische-partnerschaft-f%C3%BCr-f%C3%BChrungskr%C3%A4fte/wien/?firmaid=12bd142c-5fcf-4457-9a90-47fbff162b40',
  om: 'https://www.milcclub.com/ambassadors',
  japanTimes: 'https://sms-bridges.com/reveal-your-artistic-side/'
};

const homeCopy = {
  'index.html': {
    heroLabel: 'Fine art photography · a life in pictures since 1999',
    heroSub: 'I work between Vienna and Budapest, but most of these stories began wherever somebody trusted me enough to stop performing for the camera.',
    statementLabel: 'A glass of wine, one honest sentence',
    statement: 'I never became interested in perfect faces. I became interested in the moment when a person forgets the camera and something real finally appears.',
    worksLabel: 'The pictures I keep returning to',
    worksTitle: 'My favourites from the archive',
    worksLead: 'This is not a ranking. These are portraits, streets, rehearsals, private moments and beautiful accidents that still speak to me. I show fifteen first; continue when you have time to stay a little longer.',
    more: 'Continue through the archive',
    less: 'Show the first fifteen',
    domainSummary: 'The structure is simple: <strong>banhalmi.art</strong> holds the artistic archive; <strong>norbertbanhalmi.com</strong> is where current commissions live. The Hungarian and Austrian domains are only language entrances.'
  },
  'hu/index.html': {
    heroLabel: 'Fotóművészet · egy képekben elmesélt élet 1999 óta',
    heroSub: 'Bécs és Budapest között dolgozom, de ezeknek a történeteknek a többsége ott kezdődött, ahol valaki annyira megbízott bennem, hogy egy pillanatra abbahagyta a szereplést a kamera előtt.',
    statementLabel: 'Egy pohár bor mellett, őszintén',
    statement: 'Engem sosem a tökéletes arc érdekelt. Az a pillanat érdekel, amikor valaki megfeledkezik a fényképezőgépről, és végre megmutatkozik belőle valami igaz.',
    worksLabel: 'Képek, amelyekhez újra meg újra visszatérek',
    worksTitle: 'A kedvenceim az archívumból',
    worksLead: 'Ez nem rangsor. Portrék, utcák, próbák, intim pillanatok és gyönyörű véletlenek – azok a képek, amelyek ennyi év után is beszélnek hozzám. Először tizenötöt mutatok; akkor menj tovább, amikor van időd egy kicsit itt maradni.',
    more: 'Tovább az archívumban',
    less: 'Csak az első tizenöt kép',
    domainSummary: 'A rendszer egyszerű: a <strong>banhalmi.art</strong> az életmű és az archívum helye, a <strong>norbertbanhalmi.com</strong> pedig a jelenlegi megbízásoké. A magyar és az osztrák domain csak nyelvi bejárat.'
  },
  'de-at/index.html': {
    heroLabel: 'Fine-Art-Fotografie · ein Leben in Bildern seit 1999',
    heroSub: 'Ich arbeite zwischen Wien und Budapest. Die meisten dieser Geschichten begannen jedoch dort, wo mir jemand genug vertraute, um vor der Kamera für einen Augenblick keine Rolle mehr zu spielen.',
    statementLabel: 'Bei einem Glas Wein, ganz ehrlich',
    statement: 'Perfekte Gesichter haben mich nie besonders interessiert. Mich interessiert der Augenblick, in dem jemand die Kamera vergisst und etwas Echtes sichtbar wird.',
    worksLabel: 'Bilder, zu denen ich immer wieder zurückkehre',
    worksTitle: 'Meine persönlichen Favoriten aus dem Archiv',
    worksLead: 'Das ist keine Rangliste. Es sind Porträts, Straßen, Proben, stille Begegnungen und schöne Zufälle – Bilder, die nach all den Jahren noch mit mir sprechen. Zuerst zeige ich fünfzehn; gehen Sie weiter, wenn Sie etwas Zeit mitgebracht haben.',
    more: 'Weiter durch das Archiv',
    less: 'Nur die ersten fünfzehn zeigen',
    domainSummary: 'Die Struktur ist einfach: <strong>banhalmi.art</strong> bewahrt das künstlerische Archiv, <strong>norbertbanhalmi.com</strong> bündelt aktuelle Aufträge. Die ungarische und österreichische Domain sind lediglich Spracheingänge.'
  }
};

function moveContactToLeftColumn(content){
  const contactRe = /\s*<a class="m-main" href="index\.html#contact">[\s\S]*?<\/p>\s*(?=<div class="m-foot">)/i;
  const match = content.match(contactRe);
  if(!match) return content;
  const block = match[0].trim();
  content = content.replace(contactRe,'\n');
  if(!content.includes('data-contact-position="left"')){
    content = content.replace(/(<details class="svc">)/i,`<div data-contact-position="left">${block}</div>\n    $1`);
  }
  return content;
}

function compressDomainStory(content, summary){
  const domainPattern=/(?:banhalmi\.art|norbertbanhalmi\.com|banhalminorbert\.hu|banhalmi\.at)/gi;
  const paragraphs=[...content.matchAll(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi)];
  const heavy=paragraphs.filter(m=>((m[0].match(domainPattern)||[]).length>=2));
  if(!heavy.length) return content;
  let inserted=false;
  for(const m of heavy){
    content=content.replace(m[0],inserted?'':`<p data-domain-summary="concise">${summary}</p>`);
    inserted=true;
  }
  return content;
}

function humanizeHomepage(content, copy){
  content = moveContactToLeftColumn(content);
  content = compressDomainStory(content,copy.domainSummary);
  content = content.replace(/<p class="label">Fine Art Photography[^<]*<\/p>/i,`<p class="label">${copy.heroLabel}</p>`);
  content = content.replace(/<p class="label">Fotóművészet[^<]*<\/p>/i,`<p class="label">${copy.heroLabel}</p>`);
  content = content.replace(/<p class="label">Fine-Art-Fotografie[^<]*<\/p>/i,`<p class="label">${copy.heroLabel}</p>`);
  content = content.replace(/<p class="hero-sub">[\s\S]*?<\/p>/i,`<p class="hero-sub">${copy.heroSub}</p>`);
  content = content.replace(/<div class="statement wrap tone-a">[\s\S]*?<\/div>/i,`<div class="statement wrap tone-a">\n  <p class="label">${copy.statementLabel}</p>\n  <blockquote>“${copy.statement}”</blockquote>\n</div>`);
  const worksOpen = /(<section id="works"[^>]*><div class="wrap">)\s*<div class="intro">[\s\S]*?<\/div>/i;
  content = content.replace(worksOpen,`$1\n  <div class="intro">\n    <p class="label">${copy.worksLabel}</p>\n    <h2>${copy.worksTitle}</h2>\n    <p class="lead">${copy.worksLead}</p>\n    <p style="margin-top:1.2rem"><a class="btn" href="https://www.instagram.com/norbert.banhalmi/" target="_blank" rel="noopener">Instagram · @norbert.banhalmi</a></p>\n  </div>`);
  content = content.replace(/data-step="\d+"/i,'data-step="15"');
  content = content.replace(/<span class="more-txt">[\s\S]*?<\/span>/gi,`<span class="more-txt">${copy.more}</span>`);
  content = content.replace(/<span class="less-txt">[\s\S]*?<\/span>/gi,`<span class="less-txt">${copy.less}</span>`);
  return content;
}

function ensureStylesheets(content){
  content=content.replace(/<link rel="stylesheet" href="\/assets\/css\/archive-system\.css\?v=[^"]+">/i,archiveStylesheet);
  if(!/archive-system\.css/i.test(content)) content=content.replace(/<\/head>/i,`${archiveStylesheet}\n</head>`);
  content=content.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/design-refinements\.css(?:\?v=[^"]+)?">/gi,'');
  return content.replace(/<\/head>/i,`${refinementStylesheet}\n</head>`);
}

const changed=[];
for(const file of html){
  const original=await readFile(file,'utf8');
  let content=original;
  const rel=path.relative(root,file).replaceAll('\\','/');
  content=ensureStylesheets(content);
  content=content.replace(/<body\b([^>]*)>/i,(m,a)=>{if(/class=["'][^"']*\bapple-archive\b/i.test(a)) return m;if(/class=["']([^"']*)["']/i.test(a)) return `<body${a.replace(/class=["']([^"']*)["']/i,(x,c)=>`class="${c} apple-archive"`)}>`;return `<body${a} class="apple-archive">`;});
  content=content.replace(/#menu\s*\{([^}]*)\}/gi,(m,body)=>`#menu{${body.replace(/\boverflow-y\s*:\s*(?:auto|scroll)\s*;?/gi,'')}}`);
  content=content.replace(/<(div|section|ul)\b([^>]*class=["'][^"']*(?:collage|masonry|strip|gallery|works|images)[^"']*["'][^>]*)>/giu,(m,t,a)=>{const attrs=/data-gallery=["'][^"']*["']/i.test(a)?a.replace(/data-gallery=["'][^"']*["']/i,'data-gallery="reference"'):`${a} data-gallery="reference"`;return `<${t}${attrs}>`;});
  content=content.replace(/<(div|section|ul)\b([^>]*class=["'][^"']*(?:exhibition-list|press-list|article-list|membership-list)[^"']*["'][^>]*)>/giu,(m,t,a)=>/\barchive-list\b/i.test(a)?m:`<${t}${a.replace(/class=["']([^"']*)["']/i,(x,c)=>`class="${c} archive-list"`)}>`);
  content=content.replace(/(<button\b[^>]*class=["'][^"']*(?:menu|nav-toggle|burger)[^"']*["'][^>]*)(>)/giu,(m,o,c)=>{let t=o;if(!/aria-label=/i.test(t)) t+=' aria-label="Menu"';if(!/aria-expanded=/i.test(t)) t+=' aria-expanded="false"';return `${t}${c}`;});
  content=content.replace(/https:\/\/www\.mfvsz\.com\/?(?:hu\/tagsag\/)?/gi,trusted.mfvsz).replace(/https:\/\/amcham\.at\/?(?:members-list\/)?/gi,trusted.amcham).replace(/https:\/\/www\.wko\.at\/?/gi,trusted.wko).replace(/https:\/\/firmen\.wko\.at\/norbert-banhalmi[^"'\s<]*/gi,trusted.wko).replace(/https:\/\/www\.milcclub\.com\/ambassadors\/?/gi,trusted.om).replace(/https:\/\/sms-bridges\.com\/reveal-your-artistic-side\/?/gi,trusted.japanTimes);
  content=content.replace(/<a href="https:\/\/(?:www\.)?tripont\.hu\/?"[^>]*>([\s\S]*?)<\/a>/gi,'$1').replace(/<a href="https:\/\/www\.milcclub\.com\/?"[^>]*>([\s\S]*?)<\/a>/gi,'$1');
  if(homeCopy[rel]) content=humanizeHomepage(content,homeCopy[rel]);
  if(['index.html','hu/index.html','de-at/index.html'].includes(rel)) content=content.replace(/<main\b([^>]*)>/i,(m,a)=>/data-narrative=/i.test(a)?m:`<main${a} data-narrative="life-journey">`);
  if(content!==original){await writeFile(file,content,'utf8');changed.push(rel);}
}
console.log(JSON.stringify({changed,total:changed.length,principles:['one-purpose-per-domain','restrained-type-scale','consistent-section-rhythm','fifteen-images-first','contact-left','verified-links-only','human-first-person-voice','production-persistent-responsive-layer']},null,2));
