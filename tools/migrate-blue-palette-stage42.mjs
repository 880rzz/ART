import fs from 'node:fs';

const basePath='assets/css/page-base.css';
const museumPath='assets/css/museum-editorial.css';
let base=fs.readFileSync(basePath,'utf8');
let museum=fs.readFileSync(museumPath,'utf8');
const replacements=[
  ['--c-ground:#0a0a0a','--c-ground:#202530'],
  ['--c-raised:#242424','--c-raised:#29303F'],
  ['--c-panel:#3c3c3c','--c-panel:#2D3444']
];
for(const [from,to] of replacements){
  if(!base.includes(from)) throw new Error(`Expected ART palette token missing: ${from}`);
  base=base.replace(from,to);
}
base=base.replaceAll('background:#1a1a1c','background:#202530');
base=base.replaceAll('background:#14120f','background:#29303F');
base=base.replaceAll('background:#1a1713','background:#2D3444');
base=base.replaceAll('rgba(20,20,22,.92)','rgba(32,37,48,.92)');
base=base.replaceAll('rgba(20,20,22,.80)','rgba(32,37,48,.80)');
base=base.replaceAll('rgba(20,20,22,.30)','rgba(32,37,48,.30)');
base=base.replaceAll('rgba(20,20,22,0)','rgba(32,37,48,0)');
base=base.replaceAll('rgba(20,20,22,.55)','rgba(32,37,48,.55)');
base=base.replaceAll('rgba(20,20,22,.86)','rgba(32,37,48,.86)');
base=base.replaceAll('rgba(20,20,22,.96)','rgba(32,37,48,.96)');
const oldSurface='radial-gradient(circle at 50% -25%,rgba(183,156,68,.10),transparent 42%),linear-gradient(180deg,#24231f 0%,#171612 100%)';
if(!museum.includes(oldSurface)) throw new Error('Expected ART menu/footer surface missing');
museum=museum.replaceAll(oldSurface,'#202530');
fs.writeFileSync(basePath,base);
fs.writeFileSync(museumPath,museum);
console.log('ART blue ground/raised/panel palette applied.');
