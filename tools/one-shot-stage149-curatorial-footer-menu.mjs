import fs from 'node:fs';
import path from 'node:path';

const file=path.join(process.cwd(),'assets/css/site.css');
let css=fs.readFileSync(file,'utf8');
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STAGE149-CURATORIAL-FOOTER-MENU-POLISH:START */';
if(!css.includes(end)) throw new Error('Missing final CSS authority marker');
if(css.includes(start)) process.exit(0);
const block=String.raw`
/* STAGE149-CURATORIAL-FOOTER-MENU-POLISH:START */
/* Screenshot-derived final polish. Keep curatorial typography on one left
   editorial axis, retire the old slate-blue surface, restore the elegant
   curator H2 treatment, center footer link systems, and keep menu contact
   metadata left aligned. */
:root{
  --art-bg:#202530!important;
  --art-surface:#2D3444!important;
  --art-heading-blue:#AFC4D9;
  --art-heading-gold:#DCC56B;
  --art-hairline:rgba(175,196,217,.24);
}

/* Curatorial pages: every editorial text block is left aligned. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main :is(h1,h2,h3,p,ul,ol,li,.lead,.loc,.label,.meta){
  text-align:left!important;
  margin-left:0!important;
  margin-right:0!important;
}

/* Exact approved dark/light pair. This removes legacy #484F60 surfaces. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main>section,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main>section::before{
  background:var(--art-bg)!important;
  --banhalmi-section-surface:var(--art-bg)!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main>section:nth-of-type(even),
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main>section:nth-of-type(even)::before{
  background:var(--art-surface)!important;
  --banhalmi-section-surface:var(--art-surface)!important;
}

/* Community/Writing/Curators intros must not drift into centered presentation. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main>section>h2,
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-content-family="curatorial"] main>section>p.lead{
  width:min(100%,52rem)!important;
  max-width:52rem!important;
}

/* Curators: restore the refined gradient H2 plus a quiet divider between
   heading and its description. Sections without an immediate description keep
   the same heading treatment but no artificial extra content is introduced. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="curators"] main>section>h2{
  display:block!important;
  width:min(100%,52rem)!important;
  max-width:52rem!important;
  margin:0!important;
  padding:0 0 clamp(16px,1.7vw,22px)!important;
  border-bottom:1px solid var(--art-hairline)!important;
  background:linear-gradient(90deg,var(--art-heading-blue) 0%,#F5F5F7 42%,var(--art-heading-gold) 100%)!important;
  -webkit-background-clip:text!important;
  background-clip:text!important;
  -webkit-text-fill-color:transparent!important;
  color:transparent!important;
  text-align:left!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="curators"] main>section>h2 + p.lead{
  margin-top:clamp(18px,2vw,26px)!important;
  padding-top:0!important;
  text-align:left!important;
}

/* Footer language/domain row: one optically centered line on desktop. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .socials.lang-switch{
  box-sizing:border-box!important;
  width:max-content!important;
  max-width:100%!important;
  margin-left:auto!important;
  margin-right:auto!important;
  justify-content:center!important;
  text-align:center!important;
}
@media(min-width:900px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .socials.lang-switch{
    display:grid!important;
    grid-template-columns:repeat(6,max-content)!important;
    align-items:center!important;
    column-gap:clamp(16px,2vw,26px)!important;
    row-gap:0!important;
  }
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer :is(.footer-social-disclosure,.fineprint,.banhalmi-ecosystem){
  margin-left:auto!important;
  margin-right:auto!important;
  text-align:center!important;
}

/* Menu contact metadata belongs to the left edge of the menu column. */
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive #menu .mwrap .m-foot{
  box-sizing:border-box!important;
  width:100%!important;
  max-width:none!important;
  margin-left:0!important;
  margin-right:0!important;
  padding-left:0!important;
  text-align:left!important;
  justify-self:start!important;
  align-self:start!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive #menu .mwrap .m-foot :is(a,span,p){
  text-align:left!important;
}

@media(max-width:899px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive footer .socials.lang-switch{
    width:min(100%,32rem)!important;
    display:flex!important;
    flex-wrap:wrap!important;
    justify-content:center!important;
    gap:10px 18px!important;
  }
}
/* STAGE149-CURATORIAL-FOOTER-MENU-POLISH:END */

`;
css=css.replace(end,block+end);
fs.writeFileSync(file,css);
console.log('Stage149 curatorial/footer/menu polish inserted.');
