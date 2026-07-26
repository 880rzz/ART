import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const files=[];const failures=[];
async function walk(d){for(const e of await readdir(d,{withFileTypes:true})){if(['.git','node_modules','.github'].includes(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))files.push(f);}}
await walk(root);
for(const file of files){const rel=path.relative(root,file).replaceAll(path.sep,'/');const s=await readFile(file,'utf8');
if(!/archive-system\.css/i.test(s))failures.push(`${rel}: missing unified design stylesheet`);
const lang=(s.match(/<html\b[^>]*lang=["']([^"']+)/i)||[])[1];if(!lang)failures.push(`${rel}: missing html lang`);
if(/class=["'][^"']*(?:collage|masonry|strip|gallery)[^"']*["']/i.test(s)&&!/data-gallery=["']reference["']/i.test(s))failures.push(`${rel}: gallery not normalized`);
if(/for\s+since\s+1999/i.test(s))failures.push(`${rel}: malformed English chronology`);
}
const css=await readFile(path.join(root,'assets/css/archive-system.css'),'utf8');
for(const token of ['height:100dvh','overflow:hidden','grid-template-columns:repeat(12','@media (max-width:560px)','--art-line:1.68'])if(!css.includes(token))failures.push(`archive-system.css: missing ${token}`);
for(const f of failures)console.error('FAIL',f);console.log(`Unified design audit checked ${files.length} HTML files in EN/HU/DE.`);if(failures.length)process.exitCode=1;
