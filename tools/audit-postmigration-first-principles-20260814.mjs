import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const homes=['index.html','hu/index.html','de-at/index.html'];
function section(html,id){
  const m=new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>`,'i').exec(html);if(!m)return'';
  let depth=1;const re=/<\/?section\b[^>]*>/gi;re.lastIndex=m.index+m[0].length;let t;
  while((t=re.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return html.slice(m.index,re.lastIndex)}
  return'';
}
function text(s){return s.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim()}
function words(s){return (text(s).match(/\b[\wÀ-ž'-]+\b/g)||[]).length}
for(const file of homes){
  const html=fs.readFileSync(file,'utf8');
  if(/id=["']presence-periods["']/i.test(html)) failures.push(`${file}: redundant presence-periods block remains`);
  const journey=section(html,'journey'),ex=section(html,'exhibitions');
  if(!journey||!ex) failures.push(`${file}: journey/exhibitions section missing after migration`);
  if((html.match(/data-home-orientation=["']v1["']/g)||[]).length!==2) failures.push(`${file}: expected two homepage orientation sections`);
  if((journey.match(/class=["'][^"']*orientation-card[^"']*["']/gi)||[]).length!==4) failures.push(`${file}: expected four journey orientation cards`);
  const rows=(ex.match(/class=["'][^"']*exhibition-map__row[^"']*["']/gi)||[]).length;
  if(rows!==20) failures.push(`${file}: exhibition map must retain all 20 routes, found ${rows}`);
  if(words(journey)>520) failures.push(`${file}: journey remains too verbose (${words(journey)} words)`);
  if(words(ex)>360) failures.push(`${file}: exhibition map remains too verbose (${words(ex)} words)`);
  if(!/href=["']curators\.html["']/i.test(journey)||!/href=["']community\.html["']/i.test(journey)) failures.push(`${file}: journey canonical hand-off missing`);
  if((html.match(/<h1\b/gi)||[]).length!==1) failures.push(`${file}: H1 invariant failed`);
}
for(const file of ['press.html','hu/press.html','de-at/press.html']){
  const h=fs.readFileSync(file,'utf8');
  if(/<style\b[^>]*id=["']press-editorial-redesign["']/i.test(h)) failures.push(`${file}: Press inline CSS remains`);
}
const css=fs.readFileSync('assets/css/site.css','utf8');
for(const marker of ['PRESS-EDITORIAL-REDESIGN-AUTHORITY:START','BROWSER-LAYOUT-REMEDIATION-20260814:START','HOME-ORIENTATION-REMEDIATION-20260814:START']) if(!css.includes(marker)) failures.push(`site.css: ${marker} missing`);
const skip=new Set(['.git','node_modules','_site','dist','coverage']);
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');if(/<meta\b[^>]*(?:name|http-equiv)=["'](?:geo\.region|geo\.placename|icbm)["']/i.test(h))failures.push(`${p}: obsolete single-location GEO meta remains`)}}}
walk('.');
if(failures.length){console.error('ART post-migration first-principles audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('ART post-migration first-principles audit passed: orientation, Press authority, GEO cleanup and content hand-offs are consistent.');
