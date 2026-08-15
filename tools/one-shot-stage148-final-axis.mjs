import fs from 'node:fs';

const cssPath='assets/css/site.css';
let css=fs.readFileSync(cssPath,'utf8');
const marker='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if(!css.includes(marker)) throw new Error('Final CSS marker missing');
if(css.includes('STAGE148-FINAL-EXHIBITION-AXIS:START')) process.exit(0);
const block=`/* STAGE148-FINAL-EXHIBITION-AXIS:START */
/* Final mobile record-axis authority. The exhibition gallery section was the
   only remaining 16px legacy wrapper while every other record section used
   the approved 20px mobile editorial gutter. #main-content makes this rule
   unambiguously authoritative without widening its scope beyond exhibitions. */
@media(max-width:760px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main#main-content>section.wrap,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main#main-content>section.wrap.narrow{
    box-sizing:border-box!important;
    width:calc(100% - 40px)!important;
    max-width:none!important;
    margin-left:20px!important;
    margin-right:20px!important;
    padding-left:0!important;
    padding-right:0!important;
    left:0!important;
    right:auto!important;
    transform:none!important;
    translate:none!important;
  }
}
/* STAGE148-FINAL-EXHIBITION-AXIS:END */

`;
css=css.replace(marker,block+marker);
fs.writeFileSync(cssPath,css);
console.log('Stage148 final exhibition axis applied.');
