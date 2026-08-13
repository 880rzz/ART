import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>readFile(path.join(root,p),'utf8');
const errors=[];
const css=await read('assets/css/museum-editorial.css');
const authority=await read('assets/css/homepage-two-tone-authority.css');
const llms=await read('llms.txt');
const core=JSON.parse(await read('knowledge-core.json'));
const release=JSON.parse(await read('data/design-release.json'));
const optimizer=await read('scripts/optimize-pages-artifact.mjs');

for(const token of ['text-decoration-line:underline','text-underline-offset:.17em','PAGESPEED-STAGE31:START']){
  if(!css.includes(token)) errors.push(`museum-editorial.css missing link-recognition contract: ${token}`);
}
for(const token of ['STAGE123-CONSENT-LINK-DISCERNIBILITY:START','html body.apple-archive.apple-archive.apple-archive.apple-archive #consent a','text-decoration-color:currentColor!important','text-underline-offset:.2em!important']){
  if(!authority.includes(token)) errors.push(`homepage-two-tone-authority.css missing final consent link-recognition guard: ${token}`);
}
if(!llms.startsWith('# BANHALMI ART\n\n>')) errors.push('llms.txt must begin with H1 then blockquote summary');
for(const token of [
  'New York is a major international reference and oeuvre chapter',
  'New York is not a studio, office, headquarters or operational base',
  'Gersthofer Straße 150–154/6/2',
  'not a studio',
  'worldwide'
]){
  if(!llms.includes(token)) errors.push(`llms.txt missing archive geography context: ${token}`);
}
const geo=core.geography||{};
if(!Array.isArray(geo.studioBases)||!geo.studioBases.some(x=>x.includes('Vienna 1st district'))||!geo.studioBases.some(x=>x.includes('Budapest XI. kerület'))) errors.push('knowledge-core.json studio-base geography incomplete');
if(typeof geo.additionalActiveOffice!=='string'||!geo.additionalActiveOffice.includes('Gersthofer Straße 150–154/6/2')||!geo.additionalActiveOffice.includes('not a studio')) errors.push('knowledge-core.json Gersthofer office/client meeting geography incomplete');
if(geo.worldwideAvailability!==true) errors.push('knowledge-core.json worldwide project availability missing');
if(!/^\d{8}-[a-z0-9-]+-v\d+$/i.test(release.release)) errors.push(`Invalid design release token: ${release.release}`);
if(!/^[a-f0-9]{16}$/i.test(release.assetDigest)) errors.push(`Invalid design asset digest: ${release.assetDigest}`);
for(const token of [
  'criticalHomepageCss',
  'asyncStylesheetMarkup',
  'data-critical-css="homepage"',
  'onload="this.onload=null;this.rel=\'stylesheet\'"',
  "rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html'"
]){
  if(!optimizer.includes(token)) errors.push(`optimize-pages-artifact.mjs missing critical homepage CSS delivery contract: ${token}`);
}
for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=await read(file);
  for(const asset of ['museum-editorial.css','apple-editorial-system.css','design-refinements.css']){
    if(!html.includes(`/assets/css/${asset}?v=${release.release}`)) errors.push(`${file}: ${asset} must use active release ${release.release}`);
  }
  if(!html.includes('class="bg hero-bg-img"') || !html.includes('fetchpriority="high"')) {
    errors.push(`${file}: homepage hero must remain an eager high-priority image layer, not a late-painted CSS background`);
  }
}

const headings={
  'index.html':['<h3>Recognition</h3>','<h3>Education</h3>'],
  'hu/index.html':['<h3>Elismerések</h3>','<h3>Tanulmányok</h3>'],
  'de-at/index.html':['<h3>Anerkennungen</h3>','<h3>Ausbildung</h3>']
};
for(const [file,tokens] of Object.entries(headings)){
  const html=await read(file);
  for(const token of tokens) if(!html.includes(token)) errors.push(`${file}: sequential homepage heading missing ${token}`);
}

const bookCtas={
  'index.html':[
    ['books/book-ebredes.html','Book page — Awakening: The New Beginning! — Book','Book page →'],
    ['books/book-szosszenetek.html','Book page — Snippets','Book page →'],
    ['books/book-anovilaga.html','Book page — The World of Woman','Book page →']
  ],
  'hu/index.html':[
    ['books/book-ebredes.html','Könyvoldal — Ébredés — az Új kezdet!','Könyvoldal →'],
    ['books/book-szosszenetek.html','Könyvoldal — Szösszenetek','Könyvoldal →'],
    ['books/book-anovilaga.html','Könyvoldal — A Nő világa','Könyvoldal →']
  ],
  'de-at/index.html':[
    ['books/book-ebredes.html','Buchseite — Erwachen: Der neue Anfang! — Buch','Buchseite →'],
    ['books/book-szosszenetek.html','Buchseite — Schnipsel','Buchseite →'],
    ['books/book-anovilaga.html','Buchseite — Die Welt der Frau','Buchseite →']
  ]
};
for(const [file,contracts] of Object.entries(bookCtas)){
  const html=await read(file);
  for(const [href,label,visible] of contracts){
    const expected=`<a href="${href}" aria-label="${label}">${visible}</a>`;
    if(!html.includes(expected)) errors.push(`${file}: static destination-specific Book CTA accessible name missing for ${href}`);
  }
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`ART PageSpeed stage 31 audit passed: content links, accessibility, role-aware geography, homepage headings, Book CTAs and active release ${release.release} are guarded.`);
