import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const css=await readFile(path.join(root,'assets/css/museum-editorial.css'),'utf8');
const errors=[];
const requiredCss=[
  '/* STAGE38-INLINE-STYLE-AUTHORITY:START */',
  '.u-meta-label{opacity:.55;font-size:.72em;letter-spacing:.05em;text-transform:uppercase;margin-right:.3em}',
  '.u-gold-text{color:var(--gold)}',
  '.u-inline-flex-row{display:flex;align-items:center;gap:.6rem}',
  '/* STAGE38-INLINE-STYLE-AUTHORITY:END */'
];
for(const token of requiredCss) if(!css.includes(token)) errors.push(`museum-editorial.css: missing Stage 38 contract ${token}`);

const banned=[
  'opacity:.55;font-size:.72em;letter-spacing:.05em;text-transform:uppercase;margin-right:.3em',
  'color:var(--gold)',
  'display:flex;align-items:center;gap:.6rem'
];
const expectedClasses=new Map([['u-meta-label',261],['u-gold-text',87],['u-inline-flex-row',87]]);
const classCounts=new Map([...expectedClasses.keys()].map(k=>[k,0]));
const files=[];
async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    if(['.git','node_modules','.github','data'].includes(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) await walk(full); else if(e.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);
for(const file of files){
  const html=await readFile(file,'utf8');
  for(const style of banned){
    if(html.includes(`style="${style}"`)||html.includes(`style='${style}'`)) errors.push(`${path.relative(root,file)}: migrated inline style returned: ${style}`);
  }
  for(const cls of classCounts.keys()){
    const re=new RegExp(`\\bclass=(['"])[^'"]*\\b${cls}\\b[^'"]*\\1`,'g');
    classCounts.set(cls,classCounts.get(cls)+(html.match(re)||[]).length);
  }
}
for(const [cls,expected] of expectedClasses){
  if(classCounts.get(cls)!==expected) errors.push(`${cls}: expected ${expected} uses, found ${classCounts.get(cls)}`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage 38 inline-style authority audit passed: 435 repeated presentation declarations remain centralized in static CSS across 87 content pages.');
