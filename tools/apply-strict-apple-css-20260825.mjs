import fs from 'node:fs';
const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const start='/* STRICT-APPLE-WEB-CONTRACT-20260825:START */';
const end='/* STRICT-APPLE-WEB-CONTRACT-20260825:END */';
const block=`${start}
/* Final release-blocking visual authority: typography, reading rhythm and visual full-bleed. */
body.apple-archive main h1,
body.apple-archive header.sub h1{
  letter-spacing:-.015em!important;
}
body.apple-archive[data-archive-page="press"] p.lead,
body.apple-archive.press-page p.lead{
  font-size:clamp(1rem,1.2vw,1.25rem)!important;
  line-height:1.42!important;
}
body.apple-archive main h3 + p{
  margin-top:.75rem!important;
}
body.apple-archive main .wrap,
body.apple-archive main .container,
body.apple-archive main .content-wrap{
  max-width:1280px!important;
}
body.apple-archive main .wrap.narrow{
  max-width:900px!important;
}
/* A constrained section may own the colored surface, but the visual cell itself must span the viewport. */
body.apple-archive main > section.wrap,
body.apple-archive main > section.wrap.narrow{
  position:relative!important;
  isolation:isolate;
}
body.apple-archive main > section.wrap::before,
body.apple-archive main > section.wrap.narrow::before{
  content:"";
  position:absolute;
  z-index:-1;
  inset-block:0;
  left:50%;
  width:100vw;
  transform:translateX(-50%);
  background:inherit;
  pointer-events:none;
}
${end}`;
const re=new RegExp(start.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s\\S]*?'+end.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
if(re.test(css)) css=css.replace(re,block);
else {
  const marker='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
  const i=css.lastIndexOf(marker);
  if(i<0) throw new Error('Final Apple CSS marker not found');
  css=css.slice(0,i)+block+'\n\n'+css.slice(i);
}
fs.writeFileSync(file,css);
console.log('ART strict Apple CSS remediation inserted before final authority marker.');
