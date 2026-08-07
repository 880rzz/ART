import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const cssPath='assets/css/museum-editorial.css';
let css=fs.readFileSync(cssPath,'utf8');
const marker='/* STAGE39-UI-DESIGN-CONTRACT:START */';
if(css.includes(marker)) throw new Error('Stage 39 UI design contract already exists');

const block=`

/* STAGE39-UI-DESIGN-CONTRACT:START */
/* Final layout authority. Inspired by Apple-style interface discipline: one
   spacing scale, one content axis, one image radius and deterministic component
   ownership. This block intentionally loads after all migration/history layers. */
:root{
  --ui-space-1:8px;
  --ui-space-2:12px;
  --ui-space-3:16px;
  --ui-space-4:24px;
  --ui-space-5:32px;
  --ui-space-6:48px;
  --ui-space-7:64px;
  --ui-space-8:96px;
  --ui-image-radius:4px;
  --ui-panel-radius:12px;
  --ui-gallery-gap:clamp(12px,1.15vw,16px);
  --ui-content-max:1180px;
  --ui-reading-max:68ch;
}

/* Short documents end on the colophon instead of exposing the page canvas. */
html,html body.apple-archive{min-height:100%}
html body.apple-archive{min-height:100vh;min-height:100dvh;display:flex!important;flex-direction:column!important}
html body.apple-archive>main{flex:1 0 auto;width:100%;min-width:0}
html body.apple-archive>footer{margin-top:auto!important;width:100%}

/* Canonical image treatment: photography stays almost square, never app-like. */
html body.apple-archive :is(.collage,.masonry,.gallery,.art-gallery,[data-gallery]) figure,
html body.apple-archive :is(.collage,.masonry,.gallery,.art-gallery,[data-gallery]) img,
html body.apple-archive .story-image img,
html body.apple-archive .archive-record__media img{
  border-radius:var(--ui-image-radius)!important;
}
html body.apple-archive :is(.collage,.masonry,.gallery,.art-gallery,[data-gallery]) figure{overflow:hidden!important}

/* Homepage + exhibition galleries use one continuous masonry flow. The batch
   wrappers become layout-transparent when revealed, so Load more cannot create
   a second, visibly separated gallery. */
html body.apple-archive #galwrap{
  display:block!important;
  column-count:3!important;
  column-gap:var(--ui-gallery-gap)!important;
  grid-template-columns:none!important;
}
html body.apple-archive #galwrap>.gal-batch[hidden]{display:none!important}
html body.apple-archive #galwrap>.gal-batch:not([hidden]){display:contents!important}
html body.apple-archive #galwrap>.gal-batch+.gal-batch:not([hidden]){margin-top:0!important}
html body.apple-archive #galwrap figure{
  display:block!important;
  break-inside:avoid!important;
  -webkit-column-break-inside:avoid!important;
  width:100%!important;
  margin:0 0 var(--ui-gallery-gap)!important;
  padding:0!important;
}
html body.apple-archive #galwrap figure img{display:block!important;width:100%!important;height:auto!important}

/* Non-paginated photographic collages follow the same gutter rhythm. */
html body.apple-archive .collage:not(#galwrap),
html body.apple-archive .masonry{
  display:block!important;
  column-count:3!important;
  column-gap:var(--ui-gallery-gap)!important;
  grid-template-columns:none!important;
}
html body.apple-archive .collage:not(#galwrap)>figure,
html body.apple-archive .masonry>figure{
  display:block!important;
  break-inside:avoid!important;
  margin:0 0 var(--ui-gallery-gap)!important;
}

/* Life journey disclosures: label on the left, count and +/− as one compact
   control cluster on the right. */
html body.apple-archive .life-record-group summary{
  display:grid!important;
  grid-template-columns:minmax(0,1fr) auto auto!important;
  align-items:center!important;
  justify-content:normal!important;
  gap:var(--ui-space-2)!important;
}
html body.apple-archive .life-record-group summary>span:first-child{min-width:0;margin:0!important}
html body.apple-archive .life-record-group summary small{margin:0!important;justify-self:end!important}
html body.apple-archive .life-record-group summary::after{
  order:initial!important;
  display:grid!important;
  place-items:center!important;
  width:2rem!important;
  min-width:2rem!important;
  margin:0!important;
  text-align:center!important;
}

/* Public history / exhibitions: one stable catalogue row, never a centre-axis
   timeline and never a nested grid. */
@media(min-width:901px){
  html body.apple-archive #exhibitions>.wrap{width:min(calc(100% - clamp(2.5rem,8vw,8rem)),var(--ui-content-max))!important;max-width:var(--ui-content-max)!important}
  html body.apple-archive #exhibitions>.wrap>.intro{max-width:72ch!important;margin:0 0 var(--ui-space-7)!important;text-align:left!important}
  html body.apple-archive #exhibitions .timeline[data-chronology]{display:block!important;width:100%!important;max-width:none!important;margin:0!important;border-top:1px solid var(--mus-hair-strong)!important}
  html body.apple-archive #exhibitions .timeline[data-chronology]>.t-item{
    display:grid!important;
    grid-template-columns:minmax(8rem,10.5rem) minmax(0,1fr)!important;
    column-gap:clamp(2rem,4vw,4rem)!important;
    row-gap:.35rem!important;
    align-items:start!important;
    width:100%!important;
    margin:0!important;
    padding:clamp(1.75rem,2.6vw,2.5rem) 0!important;
  }
  html body.apple-archive #exhibitions .timeline[data-chronology]>.t-item>.yr{grid-column:1!important;grid-row:1 / span 4!important;align-self:start!important;padding-top:.2rem!important}
  html body.apple-archive #exhibitions .timeline[data-chronology]>.t-item>h3,
  html body.apple-archive #exhibitions .timeline[data-chronology]>.t-item>.loc,
  html body.apple-archive #exhibitions .timeline[data-chronology]>.t-item>p{grid-column:2!important;grid-row:auto!important;max-width:68ch!important}
}

/* Contact is information architecture, not a generic card grid. */
html body.apple-archive #contact>.wrap{width:min(calc(100% - clamp(2rem,8vw,8rem)),var(--ui-content-max))!important;max-width:var(--ui-content-max)!important}
html body.apple-archive #contact>.wrap>.intro{max-width:var(--ui-reading-max)!important;margin:0 0 var(--ui-space-6)!important}
html body.apple-archive #contact .cards{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:var(--ui-space-4)!important;
  align-items:stretch!important;
  width:100%!important;
}
html body.apple-archive #contact .cards>.card{
  min-width:0!important;
  width:auto!important;
  margin:0!important;
  padding:clamp(1.5rem,3vw,2.25rem)!important;
  border:1px solid var(--mus-hair)!important;
  border-radius:var(--ui-panel-radius)!important;
  background:rgba(255,255,255,.025)!important;
  box-shadow:none!important;
}
html body.apple-archive #contact .cards>.card>:last-child{margin-bottom:0!important}
html body.apple-archive #contact .professional-side{max-width:100%!important;margin-top:var(--ui-space-5)!important}

@media(max-width:1100px){
  html body.apple-archive #galwrap,
  html body.apple-archive .collage:not(#galwrap),
  html body.apple-archive .masonry{column-count:2!important}
}
@media(max-width:700px){
  html body.apple-archive #galwrap,
  html body.apple-archive .collage:not(#galwrap),
  html body.apple-archive .masonry{column-count:1!important}
  html body.apple-archive #contact .cards{grid-template-columns:1fr!important;gap:var(--ui-space-3)!important}
  html body.apple-archive .life-record-group summary{gap:var(--ui-space-1)!important}
  html body.apple-archive .life-record-group summary::after{width:1.75rem!important;min-width:1.75rem!important}
}
/* STAGE39-UI-DESIGN-CONTRACT:END */
`;

fs.writeFileSync(cssPath,css+block);

const cssDir='assets/css';
const jsDir='assets/js';
const hash=createHash('sha256');
for(const name of fs.readdirSync(cssDir).filter(f=>f.endsWith('.css')).sort()) hash.update(fs.readFileSync(path.join(cssDir,name)));
for(const name of fs.readdirSync(jsDir).filter(f=>f.endsWith('.js')).sort()) hash.update(fs.readFileSync(path.join(jsDir,name)));
const digest=hash.digest('hex').slice(0,16);
const configPath='data/design-release.json';
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
config.release='20260807-ui-design-contract-v52';
config.note='Canonical UI design contract: deterministic final layout authority, continuous masonry gallery, life-journey disclosure alignment, stable exhibitions/contact layouts and 4px photographic radius.';
config.assetDigest=digest;
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');
console.log(`Stage 39 UI contract appended; asset digest ${digest}.`);
