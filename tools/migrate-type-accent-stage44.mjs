import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root=process.cwd();
const cssPath=path.join(root,'assets/css/museum-editorial.css');
let css=fs.readFileSync(cssPath,'utf8');
if(css.includes('STAGE44-TYPE-ACCENT:START')) throw new Error('ART type accent contract already exists');
css += '\n\n/* STAGE44-TYPE-ACCENT:START — sparse semantic display emphasis */\nhtml body.apple-archive .title-accent{color:var(--mus-gold)!important}\nhtml body.apple-archive .title-accent--block{display:block}\n/* STAGE44-TYPE-ACCENT:END */\n';
fs.writeFileSync(cssPath,css);

const replacements={
  'index.html':[['<h2 id="presence-thesis-title">Throughout my life, I have explored presence through photography.</h2>','<h2 id="presence-thesis-title">Throughout my life, I have explored <span class="title-accent title-accent--block">presence through photography.</span></h2>']],
  'hu/index.html':[['<h2 id="presence-thesis-title">Egész életemben a fotográfián keresztül a jelenlétet kutattam.</h2>','<h2 id="presence-thesis-title">Egész életemben a fotográfián keresztül <span class="title-accent title-accent--block">a jelenlétet kutattam.</span></h2>']],
  'de-at/index.html':[['<h2 id="presence-thesis-title">Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.</h2>','<h2 id="presence-thesis-title">Mein ganzes Leben lang habe ich durch die Fotografie <span class="title-accent title-accent--block">Präsenz erforscht.</span></h2>']]
};
for(const [file,pairs] of Object.entries(replacements)){
  const p=path.join(root,file);let html=fs.readFileSync(p,'utf8');
  for(const [from,to] of pairs){const n=html.split(from).length-1;if(n!==1)throw new Error(`${file}: expected exactly one thesis heading, found ${n}`);html=html.replace(from,to)}
  fs.writeFileSync(p,html);
}

const cssDir=path.join(root,'assets/css');
const jsDir=path.join(root,'assets/js');
const hash=createHash('sha256');
for(const name of fs.readdirSync(cssDir).filter(f=>f.endsWith('.css')).sort()) hash.update(fs.readFileSync(path.join(cssDir,name)));
for(const name of fs.readdirSync(jsDir).filter(f=>f.endsWith('.js')).sort()) hash.update(fs.readFileSync(path.join(jsDir,name)));
const digest=hash.digest('hex').slice(0,16);
const configPath=path.join(root,'data/design-release.json');
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
if(config.release!=='20260807-blue-palette-v54') throw new Error(`unexpected starting release ${config.release}`);
config.release='20260807-type-accent-v55';
config.note='Type-accent release: sparse Apple-like semantic emphasis. ART uses brand gold #B79C44 only in selected large headings over the shared blue surfaces; WCAG AA remains guarded.';
config.assetDigest=digest;
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log(`ART type accent migrated; new asset digest ${digest}.`);
