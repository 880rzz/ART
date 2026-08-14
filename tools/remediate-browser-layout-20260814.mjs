import fs from 'node:fs';

const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if(!css.includes(end)) throw new Error('Apple responsive contract END marker missing');
const patch=`
/* BROWSER-LAYOUT-REMEDIATION-20260814:START */
/* Real Chromium findings + first-principles cleanup: one reading axis, explicit
   information gaps, compact archive navigation and a single centred footer row. */
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

/* PRESS: numbers and labels are separate information units; never let them fuse. */
html body.apple-archive.apple-archive[data-archive-page="press"] .press-hero h1{
  font-size:clamp(2.45rem,5.2vw,4.2rem)!important;
  line-height:1.02!important;
  letter-spacing:-.035em!important;
  max-width:18ch!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-hero__lead{
  max-width:64ch!important;
  line-height:1.55!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-facts{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:.75rem clamp(1.5rem,4vw,4rem)!important;
  margin-top:clamp(1.5rem,3vw,2.5rem)!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-fact{
  display:grid!important;
  grid-template-columns:auto minmax(0,1fr)!important;
  column-gap:.7rem!important;
  align-items:baseline!important;
  min-width:0!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-fact strong,
html body.apple-archive.apple-archive[data-archive-page="press"] .press-fact span{
  display:block!important;
  margin:0!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-overview__grid{
  display:grid!important;
  grid-template-columns:minmax(0,1.15fr) minmax(18rem,.85fr)!important;
  gap:clamp(2.5rem,6vw,6rem)!important;
  align-items:start!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-period-nav{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:0!important;
  align-content:start!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-period-nav>a{
  display:grid!important;
  grid-template-columns:2.25rem minmax(0,1fr)!important;
  column-gap:.9rem!important;
  align-items:start!important;
  padding:.8rem 0!important;
  min-width:0!important;
}
html body.apple-archive.apple-archive[data-archive-page="press"] .press-period-nav__copy{
  display:grid!important;
  grid-template-columns:minmax(7.5rem,auto) minmax(0,1fr)!important;
  column-gap:.9rem!important;
  align-items:baseline!important;
  min-width:0!important;
}
@media(max-width:820px){
  html body.apple-archive.apple-archive[data-archive-page="press"] .press-overview__grid{grid-template-columns:1fr!important;gap:2rem!important}
  html body.apple-archive.apple-archive[data-archive-page="press"] .press-facts{grid-template-columns:1fr!important;gap:.45rem!important}
}
@media(max-width:520px){
  html body.apple-archive.apple-archive[data-archive-page="press"] .press-hero h1{font-size:clamp(2.15rem,10vw,2.85rem)!important;max-width:none!important}
  html body.apple-archive.apple-archive[data-archive-page="press"] .press-period-nav__copy{grid-template-columns:1fr!important;row-gap:.12rem!important}
}

/* FOOTER: three official destinations form one calm, optically centred desktop row. */
@media(min-width:900px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem{
    width:max-content!important;
    max-width:100%!important;
    display:grid!important;
    grid-template-columns:repeat(3,max-content)!important;
    gap:clamp(1.6rem,3vw,3rem)!important;
    align-items:center!important;
    justify-content:center!important;
    margin-left:auto!important;
    margin-right:auto!important;
    text-align:center!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive footer .banhalmi-ecosystem>a{
    width:auto!important;
    min-width:0!important;
    min-height:44px!important;
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    padding:.45rem 0!important;
    white-space:nowrap!important;
    text-wrap:nowrap!important;
    text-align:center!important;
  }
}
/* BROWSER-LAYOUT-REMEDIATION-20260814:END */
`;
if(css.includes('BROWSER-LAYOUT-REMEDIATION-20260814:START')) {
  css=css.replace(/\/\* BROWSER-LAYOUT-REMEDIATION-20260814:START \*\/[\s\S]*?\/\* BROWSER-LAYOUT-REMEDIATION-20260814:END \*\/\n?/,'');
}
css=css.replace(end,patch+end);
fs.writeFileSync(file,css);
console.log('Applied ART first-principles browser-layout remediation.');
