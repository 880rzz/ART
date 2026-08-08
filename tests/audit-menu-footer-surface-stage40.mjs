import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const css=await readFile(path.join(root,'assets/css/museum-editorial.css'),'utf8');
const config=JSON.parse(await readFile(path.join(root,'data/design-release.json'),'utf8'));
const errors=[];
const surface='#202530';

for(const required of [
  'STAGE40-MENU-FOOTER-SURFACE:START',
  `html body.apple-archive #menu{\n  background:${surface}!important;`,
  `html body.apple-archive.menu-open #menu{background:${surface}!important}`,
  'backdrop-filter:none!important;',
  '-webkit-backdrop-filter:none!important;'
]) if(!css.includes(required)) errors.push(`museum-editorial.css missing: ${required}`);
if(!/^\d{8}-[a-z0-9-]+-v\d+$/.test(config.release)) errors.push(`invalid active design release: ${config.release}`);

const skip=new Set(['.git','node_modules','.github','data']);
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())await walk(full);else if(e.name.endsWith('.html'))files.push(full)}}
await walk(root);
let versioned=0;
for(const file of files){
  const html=await readFile(file,'utf8');
  for(const m of html.matchAll(/museum-editorial\.css\?v=([^"']+)/g)){
    versioned++;
    if(m[1]!==config.release) errors.push(`${path.relative(root,file)}: stale museum token ${m[1]}`);
  }
}
if(versioned<80) errors.push(`Expected >=80 versioned museum stylesheet links, found ${versioned}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Stage 40 menu/footer surface audit passed on ${surface} and release ${config.release} across ${versioned} versioned page links.`);
