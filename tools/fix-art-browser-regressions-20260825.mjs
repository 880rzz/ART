import fs from 'node:fs';
const p='assets/css/site.css';
let css=fs.readFileSync(p,'utf8');
const end='/* CLEAN-ART-DESIGN-AUTHORITY-20260825:END */';
if(!css.includes(end)) throw new Error('Clean ART authority marker missing.');
const marker='/* CLEAN-ART-BROWSER-REGRESSION-FIX-20260825:START */';
if(css.includes(marker)){console.log('ART browser regression fix already present.');process.exit(0);}
const block=`${marker}
/* Exhaustive browser-QA corrections: accessibility-sized story controls, readable press copy and one left editorial axis. */
html body.apple-archive.apple-archive.apple-archive.apple-archive .story-open{
  min-width:44px!important;min-height:44px!important;padding:10px 16px!important;
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  color:#F5F5F7!important;background:#29303F!important;border-color:rgba(220,197,107,.72)!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive .story-open:hover,
html body.apple-archive.apple-archive.apple-archive.apple-archive .story-open:focus-visible{
  color:#FFFFFF!important;background:#2D3444!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive .story-close{
  box-sizing:border-box!important;width:44px!important;min-width:44px!important;max-width:44px!important;
  height:44px!important;min-height:44px!important;max-height:44px!important;
  padding:0!important;display:grid!important;place-items:center!important;float:right!important;
  color:#F5F5F7!important;background:#29303F!important;border:1px solid rgba(175,196,217,.38)!important;
  font-size:22px!important;line-height:1!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-record p.desc,
html body.apple-archive.apple-archive.apple-archive.apple-archive.press-page .press-record p.desc{
  color:#D7E2ED!important;opacity:1!important;
}
@media(min-width:901px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro){
    margin-left:0!important;margin-right:auto!important;text-align:left!important;transform:none!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.intro,.section-head,.section-intro,.curatorial-periods__intro,.life-journey__intro)>:is(.label,.eyebrow,.kicker,h1,h2,h3,p,.lead){
    margin-left:0!important;margin-right:auto!important;text-align:left!important;transform:none!important;
  }
  html body.apple-archive.apple-archive.apple-archive.apple-archive #works>.wrap>.intro,
  html body.apple-archive.apple-archive.apple-archive.apple-archive #works>.wrap>.intro :is(.lead,p){margin-left:0!important;margin-right:auto!important;text-align:left!important}
  html body.apple-archive.apple-archive.apple-archive.apple-archive[data-archive-page="curators"] main .curatorial-section :is(.curatorial-periods__intro,.life-journey__intro){margin-left:0!important;margin-right:auto!important;text-align:left!important}
}
/* CLEAN-ART-BROWSER-REGRESSION-FIX-20260825:END */`;
css=css.replace(end,`${block}\n${end}`);
fs.writeFileSync(p,css,'utf8');
console.log('ART browser regression corrections applied inside the final clean design authority.');
