import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const files=[];const failures=[];const counts={en:0,hu:0,de:0,galleries:0};
async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){if(['.git','node_modules','.github'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))files.push(f);}}
await walk(root);
for(const file of files){const rel=path.relative(root,file).replaceAll(path.sep,'/');const s=await readFile(file,'utf8');
  if(!/archive-system\.css/i.test(s))failures.push(`${rel}: missing unified design stylesheet`);
  const lang=(s.match(/<html\b[^>]*lang=["']([^"']+)/i)||[])[1];
  if(!lang)failures.push(`${rel}: missing html lang`);else if(lang.toLowerCase().startsWith('hu'))counts.hu++;else if(lang.toLowerCase().startsWith('de'))counts.de++;else counts.en++;
  const gallery=/class=["'][^"']*(?:collage|masonry|strip|gallery)[^"']*["']/i.test(s);
  if(gallery){counts.galleries++;if(!/data-gallery=["']reference["']/i.test(s))failures.push(`${rel}: gallery not normalized`);}
  if(/for\s+since\s+1999/i.test(s))failures.push(`${rel}: malformed English chronology`);
  if(!/<main\b/i.test(s))failures.push(`${rel}: missing main landmark`);
  if(!/<h1\b/i.test(s))failures.push(`${rel}: missing H1`);
}
for(const key of ['en','hu','de'])if(!counts[key])failures.push(`language coverage missing: ${key}`);
const css=await readFile(path.join(root,'assets/css/archive-system.css'),'utf8');
for(const token of ['height:100dvh','overflow:hidden','body.menu-open','grid-template-columns:repeat(12','@media (max-width:900px)','@media (max-width:560px)','--art-line:1.62','main>section+section'])if(!css.includes(token))failures.push(`archive-system.css: missing ${token}`);
if(/#menu[^}]*display:grid!important/i.test(css))failures.push('archive-system.css: menu visibility may be overridden by an unconditional grid display');
for(const f of failures)console.error('FAIL',f);
console.log(`Unified design audit checked ${files.length} HTML files: EN ${counts.en}, HU ${counts.hu}, DE ${counts.de}, galleries ${counts.galleries}.`);
if(failures.length)process.exitCode=1;
