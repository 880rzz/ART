import fs from 'node:fs';

const cssPath='assets/css/site.css';
let css=fs.readFileSync(cssPath,'utf8');
const marker='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if(!css.includes(marker)) throw new Error('Final CSS marker missing');
if(css.includes('STAGE147-MOBILE-EXHIBITION-AXIS:START')) process.exit(0);
const block=`/* STAGE147-MOBILE-EXHIBITION-AXIS:START */
/* Exhibition record heroes historically carried a 4px mobile parent inset.
   Normalize the parent header itself, then place every audited wrapper on the
   same literal 20px editorial axis used by the rest of the archive. */
@media(max-width:760px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main>header{
    box-sizing:border-box!important;
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    padding-left:0!important;
    padding-right:0!important;
    left:0!important;
    right:auto!important;
    transform:none!important;
    translate:none!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main>header .wrap,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main>header .wrap.narrow,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main>section.wrap,
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-record-type="exhibition"] main>section.wrap.narrow{
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
/* STAGE147-MOBILE-EXHIBITION-AXIS:END */

`;
css=css.replace(marker,block+marker);
fs.writeFileSync(cssPath,css);
console.log('Stage147 mobile exhibition axis remediation applied.');
