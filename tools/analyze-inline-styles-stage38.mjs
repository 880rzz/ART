import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out=[]) {
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if (['.git','node_modules','.github'].includes(e.name)) continue;
    const full=path.join(dir,e.name);
    if (e.isDirectory()) walk(full,out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files=walk('.');
const exact=new Map();
const propSets=new Map();
let total=0;
for (const file of files) {
  const html=fs.readFileSync(file,'utf8');
  for (const m of html.matchAll(/\bstyle=(['"])(.*?)\1/gi)) {
    total++;
    const raw=m[2].trim().replace(/\s*;\s*/g,';').replace(/\s*:\s*/g,':').replace(/;+$/,'');
    if (!exact.has(raw)) exact.set(raw,{count:0,files:new Set(),examples:[]});
    const item=exact.get(raw); item.count++; item.files.add(file.replace(/^\.\//,''));
    if (item.examples.length<6) item.examples.push(file.replace(/^\.\//,''));
    const normalized=raw.split(';').filter(Boolean).map(x=>x.split(':')[0].trim()).sort().join(';');
    if (!propSets.has(normalized)) propSets.set(normalized,{count:0,files:new Set(),styles:new Set()});
    const p=propSets.get(normalized); p.count++; p.files.add(file.replace(/^\.\//,'')); p.styles.add(raw);
  }
}

const topExact=[...exact.entries()].map(([style,v])=>({style,count:v.count,fileCount:v.files.size,examples:v.examples})).sort((a,b)=>b.count-a.count || b.fileCount-a.fileCount || a.style.localeCompare(b.style));
const topPropSets=[...propSets.entries()].map(([properties,v])=>({properties,count:v.count,fileCount:v.files.size,variantCount:v.styles.size,variants:[...v.styles].slice(0,12)})).sort((a,b)=>b.count-a.count || b.fileCount-a.fileCount);

console.log(JSON.stringify({htmlFiles:files.length,totalInlineStyles:total,uniqueExactStyles:exact.size,topExact:topExact.slice(0,120),topPropertySets:topPropSets.slice(0,80)},null,2));
