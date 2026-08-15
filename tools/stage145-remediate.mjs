import fs from 'node:fs';

const path='assets/css/site.css';
let css=fs.readFileSync(path,'utf8');
const marker='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STAGE145-FINAL-SPECIFICITY-SAFE-LAYOUT:START */';
const end='/* STAGE145-FINAL-SPECIFICITY-SAFE-LAYOUT:END */';
const block=`${start}
:root{
  --art-bg:#202530!important;
  --art-surface:#2D3444!important;
  --art-axis-max:1200px;
  --art-axis-gutter:clamp(24px,6vw,88px);
  --art-cell-pad-x:clamp(22px,2.4vw,34px);
  --art-cell-pad-y:clamp(20px,2.2vw,30px);
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>header .wrap,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>header .wrap.narrow,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.wrap,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.wrap.narrow{
  box-sizing:border-box!important;
  width:min(calc(100% - (2 * var(--art-axis-gutter))),var(--art-axis-max))!important;
  max-width:var(--art-axis-max)!important;
  margin-left:auto!important;
  margin-right:auto!important;
  padding-left:0!important;
  padding-right:0!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section:nth-of-type(odd),
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section:nth-of-type(odd)::before{
  --banhalmi-section-surface:var(--art-bg)!important;
  background:var(--art-bg)!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section:nth-of-type(even),
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section:nth-of-type(even)::before{
  --banhalmi-section-surface:var(--art-surface)!important;
  background:var(--art-surface)!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="writing"] main :is(header,section,h1,h2,h3,p,ul,li,.label,.loc,.lead,.facts,.linklist){text-align:left!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive :is(.t-item,.press-fact,.press-record,.facts>div,[class$="__card"]){
  box-sizing:border-box!important;
  padding:var(--art-cell-pad-y) var(--art-cell-pad-x)!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="community"] .timeline{width:100%!important;max-width:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="community"] .t-item{width:100%!important;max-width:none!important;background:var(--art-surface)!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem{
  position:static!important;inset:auto!important;transform:none!important;box-sizing:border-box!important;
  margin-left:auto!important;margin-right:auto!important;text-align:center!important;
}
@media(min-width:900px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem{
    width:min(calc(100% - 40px),48rem)!important;max-width:48rem!important;display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:clamp(18px,2.5vw,32px)!important;
    align-items:center!important;justify-content:center!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem>a{
    display:flex!important;width:100%!important;min-width:0!important;min-height:44px!important;
    align-items:center!important;justify-content:center!important;margin:0!important;padding:8px 0!important;
    text-align:center!important;white-space:nowrap!important;
  }
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] .record-gallery-disclosure>summary,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] #galmore{display:none!important}
@media(max-width:760px){:root{--art-axis-gutter:20px;--art-cell-pad-x:18px;--art-cell-pad-y:16px}}
${end}`;
if(css.includes(start)){
  const a=css.indexOf(start), b=css.indexOf(end,a);
  if(b<0) throw new Error('Stage145 end marker missing');
  css=css.slice(0,a)+css.slice(b+end.length);
}
if(!css.includes(marker)) throw new Error('final CSS marker missing');
css=css.replace(marker,`${block}\n\n${marker}`);
fs.writeFileSync(path,css);
console.log('Stage145 final specificity-safe visual contract applied.');
