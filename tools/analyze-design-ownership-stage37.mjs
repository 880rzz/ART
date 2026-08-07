import fs from 'node:fs';
import path from 'node:path';

const cssDir='assets/css';
const cssFiles=fs.readdirSync(cssDir).filter(f=>f.endsWith('.css')).sort();
const major=new Set(['design-refinements.css','apple-editorial-system.css','museum-editorial.css','archive-system.css','presence-core.css','final-layout-fixes.css','responsive-header-system.css','footer-elegant.css','page-base.css']);

function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,'');}
function selectors(css){
  const clean=stripComments(css);
  const out=[];
  for(const m of clean.matchAll(/([^{}@][^{}]*)\{/g)){
    const raw=m[1].trim();
    if(!raw || raw.includes(':root') && raw.length>300) continue;
    for(const sel of raw.split(',')){
      const s=sel.trim().replace(/\s+/g,' ');
      if(s && s.length<220) out.push(s);
    }
  }
  return out;
}

const ownership=new Map();
const contents={};
for(const file of cssFiles){
  const text=fs.readFileSync(path.join(cssDir,file),'utf8');
  contents[file]=text;
  if(!major.has(file)) continue;
  for(const sel of new Set(selectors(text))){
    if(!ownership.has(sel)) ownership.set(sel,[]);
    ownership.get(sel).push(file);
  }
}

const shared=[...ownership.entries()]
  .filter(([,files])=>files.length>=2)
  .sort((a,b)=>b[1].length-a[1].length || a[0].localeCompare(b[0]));
const risky=shared.filter(([sel])=>/^(body|main|section|header|footer|h[1-6]|\.wrap|\.card|\.timeline|\.site-header|\.nav|\.nav-links|\.menu|\.hero|\.section|\.collage|\.footer|\.btn|\.prose)(\b|\.|:|\s|$)/.test(sel));

function walk(dir, out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) walk(full,out); else out.push(full);
  }
  return out;
}
const files=walk('.');
const htmlFiles=files.filter(f=>f.endsWith('.html'));
const jsFiles=files.filter(f=>f.endsWith('.js')||f.endsWith('.mjs'));
let inlineStyleCount=0;
const inlineExamples=[];
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const matches=[...html.matchAll(/\sstyle=["'][^"']*["']/gi)];
  inlineStyleCount+=matches.length;
  if(matches.length && inlineExamples.length<30) inlineExamples.push({file,count:matches.length,examples:matches.slice(0,4).map(m=>m[0].trim())});
}
const runtimeStyle=[];
for(const file of jsFiles){
  const js=fs.readFileSync(file,'utf8');
  if(/createElement\s*\(\s*['"]style['"]\s*\)|\.innerHTML\s*=\s*[`'"][\s\S]{0,500}<style|insertRule\s*\(/i.test(js)) runtimeStyle.push(file);
}

const exactPairs=[];
for(let i=0;i<cssFiles.length;i++) for(let j=i+1;j<cssFiles.length;j++){
  const a=contents[cssFiles[i]], b=contents[cssFiles[j]];
  if(a===b) exactPairs.push([cssFiles[i],cssFiles[j],'whole-file']);
}

console.log(JSON.stringify({
  cssFiles:cssFiles.map(f=>({file:f,bytes:contents[f].length,selectors:new Set(selectors(contents[f])).size})),
  sharedSelectorCount:shared.length,
  riskySharedSelectorCount:risky.length,
  riskySharedSelectors:risky.slice(0,120).map(([selector,files])=>({selector,files})),
  htmlFiles:htmlFiles.length,
  inlineStyleCount,
  inlineExamples,
  runtimeStyleInjectionFiles:runtimeStyle,
  exactCssPairs:exactPairs
},null,2));
