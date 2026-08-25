const fs=require('fs');
const path=require('path');
const cssPath='assets/css/site.css';
let css=fs.readFileSync(cssPath,'utf8');
const END='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if(!css.includes(END)) throw new Error('final CSS authority end marker missing');
const START='/* ART-CURATORS-LAYOUT-REPAIR-20260825:START */';
const STOP='/* ART-CURATORS-LAYOUT-REPAIR-20260825:END */';
const block=`${START}
/* Curatorial dossiers are long-form reading pages, never a two-column dashboard. */
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type{
  display:block!important;
  grid-template-columns:none!important;
  grid-auto-flow:initial!important;
  width:min(calc(100% - (2 * var(--art-final-gutter, clamp(20px,4vw,56px)))), var(--art-final-wide, 900px))!important;
  max-width:var(--art-final-wide,900px)!important;
  margin-inline:auto!important;
  padding-inline:0!important;
  text-align:left!important;
}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>*{
  grid-column:auto!important;
  grid-row:auto!important;
  width:100%!important;
  max-width:var(--art-final-reading,760px)!important;
  margin-left:0!important;
  margin-right:0!important;
}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>.note{
  max-width:var(--art-final-reading,760px)!important;
  margin-bottom:clamp(3rem,6vw,5rem)!important;
}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>h2{
  margin-top:clamp(3.5rem,7vw,6rem)!important;
  margin-bottom:clamp(1rem,2vw,1.5rem)!important;
}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>h3{
  margin-top:clamp(2rem,4vw,3.25rem)!important;
  margin-bottom:.75rem!important;
}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>p,
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>ul,
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>.meta{
  margin-top:0!important;
  margin-bottom:clamp(1.1rem,2vw,1.6rem)!important;
}
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>.meta{padding-top:.2rem!important}
@media(max-width:700px){
  html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type{
    width:calc(100% - 40px)!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>h2{margin-top:3rem!important}
}
${STOP}`;
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
css=css.replace(new RegExp(esc(START)+'[\\s\\S]*?'+esc(STOP)+'\\n?','g'),'');
css=css.replace(END,block+'\n'+END);
fs.writeFileSync(cssPath,css);

const htmlFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','_site'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))htmlFiles.push(p)}}
walk('.');
let changed=0;
for(const p of htmlFiles){let h=fs.readFileSync(p,'utf8');const n=h.replace(/site\.css\?v=[^"']+/g,'site.css?v=20260825-art-design-v3');if(n!==h){fs.writeFileSync(p,n);changed++}}

const curatorAudit=`import{readFile}from'node:fs/promises';const css=await readFile('assets/css/site.css','utf8'),pages=['curators.html','hu/curators.html','de-at/curators.html'],errors=[];for(const t of['ART-CURATORS-LAYOUT-REPAIR-20260825:START','[data-archive-page="curators"] main>section.wrap.narrow:first-of-type{','display:block!important','grid-template-columns:none!important','--art-final-reading'])if(!css.includes(t))errors.push('curatorial layout authority missing '+t);for(const p of pages){const h=await readFile(p,'utf8');if(!h.includes('data-archive-page="curators"'))errors.push(p+': curatorial marker missing');if(!h.includes('site.css?v=20260825-art-design-v3'))errors.push(p+': stale CSS cache key')}if(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Curatorial layout audit passed: EN/HU/DE dossiers use one readable vertical axis from the final site.css authority.');\n`;
fs.writeFileSync('tests/audit-curatorial-canvas-stage98.mjs',curatorAudit);

const universalAudit=`import fs from'node:fs';import path from'node:path';const c=fs.readFileSync('assets/css/site.css','utf8'),e=[];for(const t of['APPLE-RESPONSIVE-CONTRACT-V1:START','APPLE-RESPONSIVE-CONTRACT-V1:END','ART-CURATORS-LAYOUT-REPAIR-20260825:START','--art-final-dark:#202530','--art-final-light:#2D3444','--art-final-page:1200px'])if(!c.includes(t))e.push('missing final site.css authority '+t);let pages=0,linked=0;const skip=new Set(['.git','node_modules','.github','data','reports','_site']);function walk(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(x.name))continue;const f=path.join(d,x.name);if(x.isDirectory())walk(f);else if(x.name.endsWith('.html')){const h=fs.readFileSync(f,'utf8');if(!/class=["'][^"']*apple-archive/i.test(h)||!/<main\\b/i.test(h)||/http-equiv=["']refresh["']|location\\.replace\\(/i.test(h))continue;pages++;const a=[...h.matchAll(/<link\\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]);const site=a.filter(x=>x.includes('/assets/css/site.css'));if(site.length!==1)e.push(f+' must load exactly one site.css authority');else{linked++;if(!site[0].includes('?v=20260825-art-design-v3'))e.push(f+' stale site.css cache key')}}}}walk('.');if(pages<80||linked!==pages)e.push('coverage '+linked+'/'+pages);if(e.length){console.error(e.join('\\n'));process.exit(1)}console.log('Universal ART design audit passed: '+pages+' pages load exactly one versioned site.css authority.');\n`;
fs.writeFileSync('tests/audit-universal-design-contract-stage142.mjs',universalAudit);
console.log(`Applied ART curatorial layout repair, refreshed ${changed} HTML cache keys, and retargeted stale design audits to site.css.`);
// trigger-v2: repair the production source, not only the audit harness
