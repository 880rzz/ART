const fs=require('fs');
const path='assets/css/site.css';
let css=fs.readFileSync(path,'utf8');
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
html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>.meta{
  padding-top:.2rem!important;
}
@media(max-width:700px){
  html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type{
    width:calc(100% - 40px)!important;
    max-width:none!important;
  }
  html body.apple-archive[data-archive-page="curators"] main>section.wrap.narrow:first-of-type>h2{
    margin-top:3rem!important;
  }
}
${STOP}`;
const re=new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s\\S]*?'+STOP.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\n?','g');
css=css.replace(re,'');
css=css.replace(END,block+'\n'+END);
fs.writeFileSync(path,css);
for(const p of ['curators.html','hu/curators.html','de-at/curators.html']){
  let h=fs.readFileSync(p,'utf8');
  h=h.replace(/site\.css\?v=[^"']+/g,'site.css?v=20260825-art-design-v3');
  fs.writeFileSync(p,h);
}
const audit=`import{readFile}from'node:fs/promises';const css=await readFile('assets/css/site.css','utf8'),pages=['curators.html','hu/curators.html','de-at/curators.html'],errors=[];for(const t of['ART-CURATORS-LAYOUT-REPAIR-20260825:START','[data-archive-page="curators"] main>section.wrap.narrow:first-of-type{','display:block!important','grid-template-columns:none!important','--art-final-reading'])if(!css.includes(t))errors.push('curatorial layout authority missing '+t);if(/\[data-archive-page=["']curators["']\][^{]*main>section\.wrap\.narrow:first-of-type\s*\{[^}]*display:grid!important/s.test(css)&&!css.includes('ART-CURATORS-LAYOUT-REPAIR-20260825:START'))errors.push('legacy two-column curator layout remains authoritative');for(const p of pages){const h=await readFile(p,'utf8');if(!h.includes('data-archive-page="curators"'))errors.push(p+': curatorial marker missing');if(!h.includes('site.css?v=20260825-art-design-v3'))errors.push(p+': stale CSS cache key')}if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Curatorial layout audit passed: EN/HU/DE dossiers use one readable vertical axis from the final site.css authority.');\n`;
fs.writeFileSync('tests/audit-curatorial-canvas-stage98.mjs',audit);
console.log('Applied ART curatorial layout repair and cache bust.');
