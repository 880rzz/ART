import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import path from 'node:path';
const personId='https://www.banhalmi.art/#about'; // Shared canonical Person ID is a provenance key, not a business call-to-action.
const expected={"en":"Norbert Bánhalmi is a photographic artist whose personal oeuvre explores human presence, identity and the body through works, books, exhibitions and documented creative periods since 1999.","hu":"Bánhalmi Norbert fotóművész személyes életműve 1999 óta a jelenlét, az identitás és a test kérdéseit vizsgálja fényképeken, könyveken, kiállításokon és dokumentált alkotói korszakokon keresztül.","de":"Norbert Bánhalmi ist Fotokünstler. Sein persönliches Werk erforscht seit 1999 menschliche Präsenz, Identität und Körperbilder in Fotografien, Büchern, Ausstellungen und dokumentierten Schaffensphasen."};
const homes=['index.html','hu/index.html','de-at/index.html'];
function meta(h,k,a='name'){const r=new RegExp('<meta\\b[^>]*'+a+'=[\"\']'+k+'[\"\'][^>]*>','i');const m=h.match(r);return m?.[0].match(/\bcontent=[\"\']([^\"\']*)[\"\']/i)?.[1]||null}
for(const rel of homes){const h=await readFile(rel,'utf8');const lang=rel.startsWith('hu/')?'hu':rel.startsWith('de-at/')?'de':'en';assert.equal(meta(h,'description'),meta(h,'og:description','property'),rel+' meta/OG description');const scripts=[...h.matchAll(/<script\b[^>]*type=[\"']application\/ld\+json[\"'][^>]*>([\s\S]*?)<\/script>/gi)];let found=false;let pageDesc=false;for(const m of scripts){let d;try{d=JSON.parse(m[1])}catch{continue}for(const n of (Array.isArray(d?.['@graph'])?d['@graph']:[d])){if(n?.['@id']===personId&&n?.['@type']==='Person'){assert.equal(n.description,expected[lang],rel+' Person description');found=true}const t=Array.isArray(n?.['@type'])?n['@type']:[n?.['@type']];if(t.includes('WebPage')||t.includes('CollectionPage')){if(String(n?.['@id']||'').includes('#webpage')){assert.equal(n.description,meta(h,'description'),rel+' WebPage description');pageDesc=true}}}}assert.ok(found,rel+' canonical Person');assert.ok(pageDesc,rel+' canonical WebPage')}
const css=await readFile('assets/css/site.css','utf8');
for(const token of [
  'ART-TITLE-LINK-AFFORDANCE-20261102:START',
  'PAGESPEED-LINK-DISCERNIBILITY-STAGE49:START',
  'a[data-external="true"]::after',
  'content:"\\00A0↗"',
  'text-decoration-line:none!important'
])assert.ok(css.includes(token),'link discernibility '+token);
const ai=await readFile('ai.txt','utf8');assert.ok(ai.includes('## Archival source and legal boundary'),'AI archive source and legal boundary');
const files=[];async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){if(['.git','node_modules','dist','.github','tests','tools','scripts'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())await walk(f);else if(/\.(html|json|jsonld|txt|md|xml)$/.test(e.name))files.push(f)}}await walk('.');for(const f of files){const s=await readFile(f,'utf8');assert.ok(!s.includes('partnerschaft-für-führungskräfte'),f+' raw WKO URL')}
console.log('ART SEO/GEO/entity + three-language PageSpeed accessibility stage49: OK');
