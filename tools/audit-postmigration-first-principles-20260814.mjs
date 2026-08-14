import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const homes=['index.html','hu/index.html','de-at/index.html'];
function section(html,id){const m=new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/section>`,'i').exec(html);return m?.[0]||''}
for(const file of homes){
  const html=fs.readFileSync(file,'utf8');
  if(/id=["']presence-periods["']/i.test(html)) failures.push(`${file}: redundant presence-periods block remains`);
  if(!/id=["']journey["'][^>]*class=["'][^"']*archive-orientation|class=["'][^"']*archive-orientation[^"']*["'][^>]*id=["']journey["']/i.test(html)) failures.push(`${file}: homepage orientation journey missing`);
  const ex=section(html,'exhibitions');
  const items=(ex.match(/class=["']t-item["']/gi)||[]).length;
  if(items<15) failures.push(`${file}: exhibition index unexpectedly incomplete (${items} items)`);
  const narrative=(ex.match(/<p(?!\s+class=["']loc["'])[^>]*>[\s\S]*?<\/p>/gi)||[]).length;
  if(narrative>2) failures.push(`${file}: exhibition index still carries duplicated long-form narrative (${narrative} generic paragraphs)`);
  if((html.match(/<h1\b/gi)||[]).length!==1) failures.push(`${file}: H1 invariant failed`);
}
for(const file of ['press.html','hu/press.html','de-at/press.html']){
  const h=fs.readFileSync(file,'utf8');
  if(/<style\b[^>]*id=["']press-editorial-redesign["']/i.test(h)) failures.push(`${file}: Press inline CSS remains`);
}
const css=fs.readFileSync('assets/css/site.css','utf8');
for(const marker of ['PRESS-EDITORIAL-REDESIGN-AUTHORITY:START','BROWSER-LAYOUT-REMEDIATION-20260814:START']) if(!css.includes(marker)) failures.push(`site.css: ${marker} missing`);
const skip=new Set(['.git','node_modules','_site','dist','coverage']);
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');if(/<meta\b[^>]*(?:name|http-equiv)=["'](?:geo\.region|geo\.placename|icbm)["']/i.test(h))failures.push(`${p}: obsolete single-location GEO meta remains`)}}}
walk('.');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('ART post-migration first-principles audit passed.');
