import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root='.';
const cssPath='assets/css/museum-editorial.css';
const configPath='data/design-release.json';
const targets=[
  { style:'opacity:.55;font-size:.72em;letter-spacing:.05em;text-transform:uppercase;margin-right:.3em', cls:'u-meta-label', expected:261 },
  { style:'color:var(--gold)', cls:'u-gold-text', expected:87 },
  { style:'display:flex;align-items:center;gap:.6rem', cls:'u-inline-flex-row', expected:87 }
];

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','.github','data'].includes(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) walk(full,out); else if(e.name.endsWith('.html')) out.push(full);
  }
  return out;
}
function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function addClassToTag(tag, cls){
  if(/\bclass=(['"])/i.test(tag)) {
    return tag.replace(/\bclass=(['"])(.*?)\1/i,(m,q,value)=>`class=${q}${value.split(/\s+/).includes(cls)?value:`${value} ${cls}`}${q}`);
  }
  return tag.replace(/^<([A-Za-z][\w:-]*)/,`<$1 class="${cls}"`);
}

const files=walk(root);
const preCounts=new Map(targets.map(t=>[t.cls,0]));
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  for(const t of targets){
    const re=new RegExp(`\\bstyle=(['"])${esc(t.style)}\\1`,'g');
    preCounts.set(t.cls,preCounts.get(t.cls)+(html.match(re)||[]).length);
  }
}
for(const t of targets){
  const got=preCounts.get(t.cls);
  if(got!==t.expected) throw new Error(`${t.cls}: expected ${t.expected} exact inline styles before migration, found ${got}`);
}

let changedFiles=0;
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const original=html;
  for(const t of targets){
    const tagRe=new RegExp(`<([A-Za-z][\\w:-]*)([^<>]*?)\\sstyle=(['"])${esc(t.style)}\\3([^<>]*?)>`,'g');
    html=html.replace(tagRe,(whole)=>{
      const withoutStyle=whole.replace(new RegExp(`\\sstyle=(['"])${esc(t.style)}\\1`),'');
      return addClassToTag(withoutStyle,t.cls);
    });
  }
  if(html!==original){fs.writeFileSync(file,html);changedFiles++;}
}

let css=fs.readFileSync(cssPath,'utf8');
const start='/* STAGE38-INLINE-STYLE-AUTHORITY:START */';
const end='/* STAGE38-INLINE-STYLE-AUTHORITY:END */';
if(css.includes(start)||css.includes(end)) throw new Error('Stage 38 CSS marker already exists; refusing duplicate migration');
css += `\n\n${start}\n/* Exact utility migrations from repeated inline presentation. */\n.u-meta-label{opacity:.55;font-size:.72em;letter-spacing:.05em;text-transform:uppercase;margin-right:.3em}\n.u-gold-text{color:var(--gold)}\n.u-inline-flex-row{display:flex;align-items:center;gap:.6rem}\n${end}\n`;
fs.writeFileSync(cssPath,css);

const postCounts=new Map(targets.map(t=>[t.cls,0]));
const classCounts=new Map(targets.map(t=>[t.cls,0]));
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  for(const t of targets){
    const styleRe=new RegExp(`\\bstyle=(['"])${esc(t.style)}\\1`,'g');
    postCounts.set(t.cls,postCounts.get(t.cls)+(html.match(styleRe)||[]).length);
    const classRe=new RegExp(`\\bclass=(['"])[^'"]*\\b${esc(t.cls)}\\b[^'"]*\\1`,'g');
    classCounts.set(t.cls,classCounts.get(t.cls)+(html.match(classRe)||[]).length);
  }
}
for(const t of targets){
  if(postCounts.get(t.cls)!==0) throw new Error(`${t.cls}: inline style remains after migration`);
  if(classCounts.get(t.cls)!==t.expected) throw new Error(`${t.cls}: expected ${t.expected} class uses after migration, found ${classCounts.get(t.cls)}`);
}

const present=fs.readdirSync('assets/css').filter(f=>f.endsWith('.css')).sort();
const hash=createHash('sha256');
for(const name of present) hash.update(fs.readFileSync(path.join('assets/css',name)));
for(const name of fs.readdirSync('assets/js').filter(f=>f.endsWith('.js')).sort()) hash.update(fs.readFileSync(path.join('assets/js',name)));
const digest=hash.digest('hex').slice(0,16);
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
config.release='20260807-inline-style-authority-v51';
config.note='Inline-style authority release: the three highest-frequency repeated presentation patterns are centralized in museum-editorial.css while HTML keeps semantic classes and the final design authority remains static.';
config.assetDigest=digest;
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');

console.log(`Stage 38 migrated 435 repeated inline style declarations across ${changedFiles} HTML files; new asset digest ${digest}.`);
