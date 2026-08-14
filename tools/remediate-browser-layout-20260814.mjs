import fs from 'node:fs';

const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if(!css.includes(end)) throw new Error('Apple responsive contract END marker missing');
const patch=`
/* BROWSER-LAYOUT-REMEDIATION-20260814:START */
/* Real Chromium regression findings: keep homepage editorial intro on the reading axis
   and guarantee WCAG-sized consent actions at the tablet boundary. */
html body.apple-archive.apple-archive main .intro{
  text-align:left!important;
  margin-left:0!important;
  margin-right:auto!important;
}
html body.apple-archive.apple-archive #consent :is(.c-no,.c-yes){
  min-height:44px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
}
/* BROWSER-LAYOUT-REMEDIATION-20260814:END */
`;
if(css.includes('BROWSER-LAYOUT-REMEDIATION-20260814:START')) {
  css=css.replace(/\/\* BROWSER-LAYOUT-REMEDIATION-20260814:START \*\/[\s\S]*?\/\* BROWSER-LAYOUT-REMEDIATION-20260814:END \*\/\n?/,'');
}
css=css.replace(end,patch+end);
fs.writeFileSync(file,css);
console.log('Applied targeted ART Chromium layout remediation.');
