import fs from 'node:fs';
import path from 'node:path';

const homepages=['index.html','hu/index.html','de-at/index.html'];
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
function range(html,id){
  const m=new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>`,'i').exec(html);
  if(!m)return null;
  let depth=1;const re=/<\/?section\b[^>]*>/gi;re.lastIndex=m.index+m[0].length;let t;
  while((t=re.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return{start:m.index,end:re.lastIndex}}
  throw new Error(`${id}: unclosed section`);
}
let removed=0,retargetedPages=0,retargetedLinks=0;
for(const file of homepages){
  let html=fs.readFileSync(file,'utf8');
  const r=range(html,'presence-periods');
  if(r){
    html=html.slice(0,r.start)+html.slice(r.end);
    removed++;
    console.log(`${file}: removed redundant #presence-periods block.`);
  }else console.log(`${file}: no redundant #presence-periods block`);
  if(range(html,'presence-periods'))throw new Error(`${file}: presence-periods section survived cleanup`);
  if(!range(html,'journey'))throw new Error(`${file}: retained #journey archive overview section missing`);
  fs.writeFileSync(file,html);
}
function migrateLinks(file){
  let html=fs.readFileSync(file,'utf8');let local=0;
  html=html.replace(/href=(["'])([^"']*?)#presence-periods\1/gi,(all,q,prefix)=>{local++;return `href=${q}${prefix}#journey${q}`;});
  if(local){fs.writeFileSync(file,html);retargetedPages++;retargetedLinks+=local;console.log(`${file}: retargeted ${local} archive-overview link(s) from #presence-periods to retained #journey.`);}
}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))migrateLinks(p)}}
walk('.');
let stale=0;
function verify(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())verify(p);else if(e.isFile()&&e.name.endsWith('.html')){const h=fs.readFileSync(p,'utf8');if(/href=(["'])[^"']*#presence-periods\1/i.test(h)){console.error(`${p}: stale #presence-periods href remains`);stale++;}}}}
verify('.');if(stale)throw new Error(`${stale} stale presence-period links remain`);
console.log(`Presence-period cleanup complete: removed ${removed} homepage blocks; retargeted ${retargetedLinks} links across ${retargetedPages} pages to the retained #journey archive overview.`);
