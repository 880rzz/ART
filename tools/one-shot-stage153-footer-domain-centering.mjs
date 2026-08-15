import fs from 'node:fs';

const cssPath = 'assets/css/site.css';
let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const block = `
/* STAGE153-FOOTER-DOMAIN-CENTERING:START */
/* Keep the three language/domain pairs geometrically centered across the full footer width. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .wrap > .socials.lang-switch{
  box-sizing:border-box!important;
  width:100%!important;
  max-width:100%!important;
  margin-left:auto!important;
  margin-right:auto!important;
  padding-left:0!important;
  padding-right:0!important;
  text-align:center!important;
  justify-content:center!important;
  justify-items:center!important;
}
@media(min-width:900px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .wrap > .socials.lang-switch{
    display:grid!important;
    grid-template-columns:repeat(6,max-content)!important;
    column-gap:clamp(16px,2vw,26px)!important;
    row-gap:0!important;
    align-items:center!important;
    justify-content:center!important;
  }
}
/* STAGE153-FOOTER-DOMAIN-CENTERING:END */

`;

if (!css.includes('STAGE153-FOOTER-DOMAIN-CENTERING:START')) {
  if (!css.includes(marker)) throw new Error('Final CSS marker not found');
  css = css.replace(marker, block + marker);
  fs.writeFileSync(cssPath, css);
}
