import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), errors=[];
const walk=async d=>{let o=[];for(const n of await readdir(d)){if(['.git','node_modules','_site','playwright-report','test-results'].includes(n))continue;const p=path.join(d,n),s=await stat(p);o.push(...(s.isDirectory()?await walk(p):[p]));}return o;};
const files=await walk(root), html=files.filter(p=>p.endsWith('.html'));
const rel=p=>path.relative(root,p).replaceAll('\\','/');
let redirects=0,indexable=0;
for(const p of html){const r=rel(p),h=await readFile(p,'utf8');const redirect=/http-equiv=["']refresh["']|location\.(?:href|replace)|window\.location/i.test(h);const noindex=/noindex/i.test(h.match(/<meta[^>]+name=["']robots["'][^>]*>/i)?.[0]||'');if(redirect){redirects++;if(!noindex)errors.push(`${r}: redirect must be noindex`);continue;}if(noindex||/404\.html$/.test(r))continue;indexable++;if(!/<html[^>]+lang=["'][^"']+/i.test(h))errors.push(`${r}: missing lang`);if(!/<title>[^<]+<\/title>/i.test(h))errors.push(`${r}: missing title`);if(!/<meta[^>]+name=["']description["']/i.test(h))errors.push(`${r}: missing description`);if(!/<link[^>]+rel=["']canonical["']/i.test(h))errors.push(`${r}: missing canonical`);for(const m of h.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{JSON.parse(m[1]);}catch{errors.push(`${r}: invalid JSON-LD`);}}}
for(const p of files.filter(p=>p.endsWith('.json'))){try{JSON.parse(await readFile(p,'utf8'));}catch{errors.push(`${rel(p)}: invalid JSON`);}}
for(const r of ['index.html','hu/index.html','de-at/index.html']){const h=await readFile(r,'utf8');if(!h.includes('Q56391118')||!h.includes('https://www.norbertbanhalmi.com/about/'))errors.push(`${r}: Wikidata-first Person contract incomplete`);}
const story='https://blog.banhalmi.art/blog/tags/a-no-vilaga-konyv-tortenetei';
for(const r of ['books/book-anovilaga.html','hu/books/book-anovilaga.html','de-at/books/book-anovilaga.html']){const h=await readFile(r,'utf8');if(!h.includes(story))errors.push(`${r}: missing canonical companion-story bridge`);}
const ai=await readFile('ai.txt','utf8');if(!ai.includes(story))errors.push('ai.txt: missing A nő világa companion-story bridge');if(!ai.includes('Q56391118'))errors.push('ai.txt: missing canonical Wikidata entity');
if(errors.length){console.error(`Stage50 critical ecosystem audit failed with ${errors.length} issue(s):`);errors.forEach(e=>console.error(` - ${e}`));process.exit(1);}console.log(`Stage50 critical ecosystem audit passed: ${html.length} HTML, ${indexable} indexable, ${redirects} redirects, JSON/JSON-LD parseable, EN/HU/DE entity and book-blog ecosystem bridges locked.`);
