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

/* Homepage editorial copy lives in data/archive/home-copy.json, not here.
   It used to be a hard-coded table in this file, and it had gone stale: every
   run of this script silently reverted approved copy — the gallery standfirst
   and the Hungarian hero subtitle — to older wording that had already been
   rejected twice. A generator must not be the place where copy is decided.
   tests/audit-generator-idempotency.mjs now fails if this chain changes any
   page, so a stale table cannot come back unnoticed. */
const homeCopy = JSON.parse(
  await readFile(path.join(root, 'data/archive/home-copy.json'), 'utf8')
).pages;

function moveContactToLeftColumn(content){
  const contactRe = /\s*<a class="m-main" href="index\.html#contact">[\s\S]*?<\/p>\s*(?=<div class="m-foot">)/i;
  const match = content.match(contactRe);
  if(!match) return content;
  const block = match[0].trim();
  content = content.replace(contactRe,'\n');
  if(!content.includes('data-contact-position="left"')) content = content.replace(/(<details class="svc">)/i,`<div data-contact-position="left">${block}</div>\n    $1`);
  return content;
}

/* This used to delete menu entries unconditionally — the Hungarian "Pályaív"
   item and the three "family origins" items — as leftovers of an old
   migration. The effect today is that the Hungarian menu silently loses an
   entry the English and German menus keep, so the menus stop matching across
   languages on every generator run. Menu composition is markup, not something
   a design script should quietly prune; the deletions are gone and parity is
   asserted by tests/audit-navigation-parity.mjs instead. */
function normalizeMenu(content){
  return content;
}

function compressDomainStory(content, summary){
  // Previously consolidated redundant domain-explanation paragraphs into one
  // summary line. The footer's own contact section already states the two
  // domains, so this extra explanatory paragraph is dropped entirely now
  // rather than replaced with a shorter one.
  const domainPattern=/(?:banhalmi\.art|norbertbanhalmi\.com|banhalminorbert\.hu|banhalmi\.at)/gi;
  const paragraphs=[...content.matchAll(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi)];
  const heavy=paragraphs.filter(m=>((m[0].match(domainPattern)||[]).length>=2));
  if(!heavy.length) return content;
  for(const m of heavy){content=content.replace(m[0],'');}
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

/* CSS is order-dependent, so a script must never move a <link> that is already
   in the right place. This function used to strip the design-refinements link
   and re-append it before </head> on every run, which pushed it past
   stylesheets that are supposed to load after it — enough on its own to make
   the site look like old and new CSS were mixing. Links are now only inserted
   when genuinely absent, and the release/versioning step at the end of the
   chain remains the single owner of ordering. */
function ensureStylesheets(content){
  if(!/archive-system\.css/i.test(content)){
    content=content.replace(/<\/head>/i,`${archiveStylesheet}\n</head>`);
  }
  if(!/design-refinements\.css/i.test(content)){
    content=content.replace(/<\/head>/i,`${refinementStylesheet}\n</head>`);
  }
  return content;
}

const changed=[];
for(const file of html){
  const original=await readFile(file,'utf8');
  let content=original;
  const rel=path.relative(root,file).replaceAll('\\','/');
  content=ensureStylesheets(content);
  content=normalizeMenu(content,rel);
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
console.log(JSON.stringify({changed,total:changed.length,principles:['one-purpose-per-domain','restrained-type-scale','consistent-section-rhythm','fifteen-images-first','contact-left','verified-links-only','human-first-person-voice','production-persistent-responsive-layer','multilingual-menu-parity']},null,2));