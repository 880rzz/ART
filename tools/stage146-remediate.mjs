import fs from 'node:fs';

const path='assets/css/site.css';
let css=fs.readFileSync(path,'utf8');
const marker='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STAGE146-EXACT-MOBILE-AXIS-AND-CELL-INSETS:START */';
const end='/* STAGE146-EXACT-MOBILE-AXIS-AND-CELL-INSETS:END */';
const block=`${start}
/* Final screenshot-derived geometry: real content cells get literal insets so
   inherited custom-property drift can never collapse them to zero. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="community"] .t-item,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-fact,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive .facts>div{
  box-sizing:border-box!important;
  padding:20px 34px!important;
}

/* On narrow screens the shared editorial axis is a literal 20px gutter.
   This removes the last 4px exhibition-only drift caused by legacy mobile
   width rules while keeping every section on the same starting line. */
@media(max-width:760px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>header .wrap,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>header .wrap.narrow,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.wrap,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.wrap.narrow{
    box-sizing:border-box!important;
    width:calc(100% - 40px)!important;
    max-width:none!important;
    margin-left:20px!important;
    margin-right:20px!important;
    padding-left:0!important;
    padding-right:0!important;
    transform:none!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="community"] .t-item,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-fact,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive .facts>div{
    padding:16px 18px!important;
  }
}
${end}`;
if(css.includes(start)){
  const a=css.indexOf(start), b=css.indexOf(end,a);
  if(b<0) throw new Error('Stage146 end marker missing');
  css=css.slice(0,a)+css.slice(b+end.length);
}
if(!css.includes(marker)) throw new Error('final CSS marker missing');
css=css.replace(marker,`${block}\n\n${marker}`);
fs.writeFileSync(path,css);
console.log('Stage146 exact mobile axis and cell insets applied.');
