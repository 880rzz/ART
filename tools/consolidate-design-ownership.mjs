import fs from 'node:fs';

const file='assets/css/design-refinements.css';
let css=fs.readFileSync(file,'utf8');
const block=`/* Homepage exhibitions: one clean two-column editorial grid, with no nested grid collision. */
@media(min-width:1101px){
  body.apple-archive #exhibitions :where(.timeline,.chronology,.archive-list,.record-list){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;column-gap:clamp(4rem,8vw,8rem)!important;row-gap:0!important;width:100%!important;max-width:100%!important;align-items:start!important}
  body.apple-archive #exhibitions :where(.timeline,.chronology,.archive-list,.record-list)>*{display:block!important;position:relative!important;min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important;padding:clamp(1.8rem,3vw,2.6rem) 0 clamp(2.3rem,4vw,3.4rem) clamp(2rem,3vw,2.7rem)!important;border-top:1px solid var(--art-line)!important;align-self:stretch!important}
  body.apple-archive #exhibitions :where(.timeline,.chronology,.archive-list,.record-list)>*::before{content:'';position:absolute;left:0;top:2.25rem;width:.55rem;height:.55rem;border-radius:50%;background:var(--art-gold)}
  body.apple-archive #exhibitions :where(.timeline,.chronology,.archive-list,.record-list)>*>*{display:block!important;min-width:0!important;width:auto!important;max-width:100%!important;margin-left:0!important;margin-right:0!important}
  body.apple-archive #exhibitions :where(.timeline,.chronology,.archive-list,.record-list) p{max-width:58ch!important;line-height:1.58!important}
}
`;
if(!css.includes(block)) throw new Error('Expected duplicate exhibitions ownership block not found');
css=css.replace(block,`/* Homepage #journey/#exhibitions desktop chronology is owned by apple-editorial-system.css.\n   This layer keeps only generic min-width/mobile safety so two desktop layout systems cannot compete. */\n`);
const fallback=`@media(max-width:1100px){
  body.apple-archive #exhibitions :where(.timeline,.chronology,.archive-list,.record-list){grid-template-columns:1fr!important}
}
`;
if(css.includes(fallback)) css=css.replace(fallback,'');
fs.writeFileSync(file,css);
console.log('Consolidated ART homepage chronology ownership into apple-editorial-system.css');
