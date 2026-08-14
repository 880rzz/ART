import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'_site');
const authority=await readFile(path.join(process.cwd(),'scripts/universal-design-authority.css'),'utf8');
const structuralFiles=['chronology-surface-authority.css','archive-content-flow.css','record-editorial-system.css'];
const structural=(await Promise.all(structuralFiles.map((file)=>readFile(path.join(root,'assets/css',file),'utf8')))).join('\n');
let review={pages:[]};
try{review=JSON.parse(await readFile(path.join(root,'data/page-simplification-review.json'),'utf8'));}catch{}
const profiles=new Map(review.pages.map((page)=>[page.file,page.profile]));
const bundleDir=path.join(root,'assets/css/bundles');
await mkdir(bundleDir,{recursive:true});
const composed=new Map();

function addAttribute(tag,name,value){
  const attrRe=new RegExp(`\\s${name}=["'][^"']*["']`,'i');
  if(attrRe.test(tag)) return tag.replace(attrRe,` ${name}="${value}"`);
  return tag.replace(/>$/,` ${name}="${value}">`);
}

function classify(rel){
  const clean=rel.replace(/^(?:hu|de-at)\//,'');
  const parts=clean.split('/');
  const file=parts.at(-1)||'index.html';
  const page=file.replace(/\.html$/i,'')||'index';
  const familyDir=parts.length>1?parts.at(-2):'';
  const recordType=familyDir==='exhibitions'?'exhibition':familyDir==='books'?'book':'';
  const slug=recordType?page:'';
  const curatorial=new Set(['curators','press','community','writing']);
  const collection=new Set(['archive','archives','exhibitions','books','projects','works','gallery','search']);
  const chronology=new Set(['chronology','timeline','life','journey','oeuvre']);
  const utility=new Set(['contact','contacts','imprint','impressum','privacy','cookies','cookie-policy','accessibility','404']);
  let contentFamily='editorial';
  if(page==='index') contentFamily='home';
  else if(curatorial.has(page)) contentFamily='curatorial';
  else if(collection.has(page)) contentFamily='collection';
  else if(chronology.has(page)) contentFamily='chronology';
  else if(utility.has(page)) contentFamily='utility';
  return {page,recordType,slug,contentFamily,archivePage:(page==='index'||curatorial.has(page))?page:''};
}

const htmlFiles=[];
async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) await walk(full);
    else if(entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

let changed=0;
for(const file of htmlFiles){
  let html=await readFile(file,'utf8');
  const rel=path.relative(root,file).replaceAll('\\','/');
  const bundlePaths=[...html.matchAll(/\/assets\/css\/bundles\/art-[a-f0-9]{16}\.css/g)].map((match)=>match[0]);
  if(!bundlePaths.length) continue;
  const oldBundle=bundlePaths[0];
  let finalBundle=composed.get(oldBundle);
  if(!finalBundle){
    const base=await readFile(path.join(root,oldBundle.slice(1)),'utf8');
    const css=`${base}\n${structural}\n${authority}\n`;
    const hash=createHash('sha256').update(css).digest('hex').slice(0,16);
    finalBundle=`/assets/css/bundles/art-${hash}.css`;
    await writeFile(path.join(root,finalBundle.slice(1)),css,'utf8');
    composed.set(oldBundle,finalBundle);
  }
  html=html.split(oldBundle).join(finalBundle);
  const escaped=finalBundle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  html=html.replace(new RegExp(`<link\\b([^>]*href=["']${escaped}["'][^>]*)>`,'gi'),(_,attrs)=>{
    let tag=`<link${attrs}>`;
    tag=addAttribute(tag,'data-art-chronology-surface-authority','true');
    tag=addAttribute(tag,'data-art-content-flow','true');
    tag=addAttribute(tag,'data-art-record-editorial','true');
    return tag;
  });

  const classification=classify(rel);
  html=html.replace(/<body\b[^>]*>/i,(bodyTag)=>{
    let tag=addAttribute(bodyTag,'data-content-family',classification.contentFamily);
    if(classification.archivePage) tag=addAttribute(tag,'data-archive-page',classification.archivePage);
    if(classification.recordType){
      tag=addAttribute(tag,'data-record-type',classification.recordType);
      tag=addAttribute(tag,'data-record-slug',classification.slug);
    }
    const profile=profiles.get(rel);
    if(profile) tag=addAttribute(tag,'data-page-density',profile);
    return tag;
  });

  if(rel==='index.html'||rel==='hu/index.html'||rel==='de-at/index.html'){
    if(!html.includes('BANHALMI ART — universal production design authority')){
      html=html.replace('</style>\n<link rel="preload"',`\n${authority}\n</style>\n<link rel="preload"`);
    }

    /* The homepage previously painted once from critical CSS, then activated
       the full bundle through rel=preload/onload. Lighthouse consistently
       attributed ~0.075 CLS to main#main-content at that exact transition.
       Load the final content-hashed bundle synchronously on the three homepages
       so first paint and settled layout use the same geometry. */
    html=html.replace(new RegExp(`<link\\b([^>]*href=["']${escaped}["'][^>]*)>`,'i'),(full,attrs)=>{
      let tag=`<link${attrs}>`;
      if(/\\brel=["']preload["']/i.test(tag)){
        tag=tag.replace(/\\brel=["']preload["']/i,'rel="stylesheet"');
        tag=tag.replace(/\\s+as=["']style["']/i,'');
        tag=tag.replace(/\\s+onload=["'][^"']*["']/i,'');
      }
      return tag;
    });
    html=html.replace(new RegExp(`<noscript>\\s*<link\\b[^>]*href=["']${escaped}["'][^>]*>\\s*</noscript>`,'i'),'');
  }

  await writeFile(file,html,'utf8');
  changed+=1;
}

console.log(`Universal production design authority applied to ${changed} HTML pages and ${composed.size} production bundle shapes.`);
