import fs from 'node:fs';
const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STAGE150-PRESS-APPROVED-SURFACES:START */';
if(css.includes(start)) process.exit(0);
if(!css.includes(end)) throw new Error('Missing final CSS marker');
const block=String.raw`
/* STAGE150-PRESS-APPROVED-SURFACES:START */
/* Press uses nested period sections, so the generic main>section contract is
   not sufficient. Pin every nested Press canvas to the same approved pair. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] main.press-redesign{
  background:#202530!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] :is(.press-records,.press-period){
  background:#202530!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-period:nth-child(even),
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-overview{
  background:#2D3444!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-period :is(.era-head,.grid,.press-record){
  background:transparent!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-period :is(h2,p,.desc,.note,.era-copy,.press-record__title){
  text-align:left!important;
}
/* STAGE150-PRESS-APPROVED-SURFACES:END */

`;
css=css.replace(end,block+end);
fs.writeFileSync(file,css);
