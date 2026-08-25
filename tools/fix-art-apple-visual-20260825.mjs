import fs from 'node:fs';

const cssPath='assets/css/site.css';
let css=fs.readFileSync(cssPath,'utf8');
const markerStart='/* APPLE-VISUAL-COMPAT-20260825:START */';
const markerEnd='/* APPLE-VISUAL-COMPAT-20260825:END */';
const block=`${markerStart}
/* Keep the approved Aug-15 visual language while making newer markup obey the
   same editorial axis, spacing and readable-type rules. */
body[data-archive-page="curators"] main section.wrap.narrow > h2,
body[data-archive-page="curators"] main section.wrap.narrow > h3,
body[data-archive-page="curators"] main section.wrap.narrow > p.lead,
body[data-archive-page="curators"] main section.wrap.narrow > p.meta,
body[data-archive-page="curators"] main section.wrap.narrow > ul.linklist,
body[data-archive-page="curators"] main section.wrap.narrow > blockquote{
  margin-left:0!important;
  margin-right:0!important;
}
body[data-archive-page="curators"] main section.wrap.narrow > p.lead,
body[data-archive-page="curators"] main section.wrap.narrow > p.meta,
body[data-archive-page="curators"] main section.wrap.narrow > ul.linklist,
body[data-archive-page="curators"] main section.wrap.narrow > blockquote{
  max-width:760px!important;
}
body.apple-archive main h3 + p,
body.apple-archive main h3 + p.lead{
  margin-top:.65rem!important;
}
body.press-page .press-hero__lead,
body.press-page p.lead{
  font-size:clamp(1rem,1.15vw,1.125rem)!important;
  line-height:1.5!important;
}
body.press-page .press-hero__lead{
  margin-top:2rem!important;
}
${markerEnd}`;

const re=new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\n?`,'m');
css=css.replace(re,'');
const endToken='APPLE-RESPONSIVE-CONTRACT-V1:END';
const endIndex=css.lastIndexOf(endToken);
if(endIndex<0) throw new Error('Final Apple contract END marker missing');
const commentStart=css.lastIndexOf('/*',endIndex);
if(commentStart<0) throw new Error('Final Apple contract END comment start missing');
css=css.slice(0,commentStart).trimEnd()+`\n\n${block}\n\n`+css.slice(commentStart);
fs.writeFileSync(cssPath,css);
console.log('ART Apple visual compatibility block installed before final authority END marker.');
