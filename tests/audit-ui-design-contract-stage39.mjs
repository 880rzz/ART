import fs from 'node:fs';

const failures=[];
const css=fs.readFileSync('assets/css/museum-editorial.css','utf8');
const config=JSON.parse(fs.readFileSync('data/design-release.json','utf8'));
const start='/* STAGE39-UI-DESIGN-CONTRACT:START */';
const end='/* STAGE39-UI-DESIGN-CONTRACT:END */';
const stage37='/* STAGE37-STATIC-ARCHIVE-INTERFACE:END */';
const stage38='/* STAGE38-INLINE-STYLE-AUTHORITY:END */';

if(!css.includes(start)||!css.includes(end)) failures.push('museum-editorial.css: Stage 39 UI design contract missing');
if(css.indexOf(start)<css.indexOf(stage37)||css.indexOf(start)<css.indexOf(stage38)) failures.push('museum-editorial.css: Stage 39 must remain the final layout authority after Stage 37/38');
for(const token of [
  '--ui-image-radius:4px',
  '--ui-gallery-gap:clamp(12px,1.15vw,16px)',
  '#galwrap>.gal-batch:not([hidden]){display:contents!important}',
  'grid-template-columns:minmax(0,1fr) auto auto!important',
  '#exhibitions .timeline[data-chronology]>.t-item',
  '#contact .cards',
  'html body.apple-archive>footer{margin-top:auto!important;width:100%}'
]) if(!css.includes(token)) failures.push(`museum-editorial.css: missing Stage 39 contract token: ${token}`);

if(!config.release||typeof config.release!=='string') failures.push('data/design-release.json: active release token missing');

for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(file,'utf8');
  for(const token of ['id="galwrap"','id="journey"','id="exhibitions"','id="contact"']) if(!html.includes(token)) failures.push(`${file}: required homepage component missing: ${token}`);
  if(!html.includes(`museum-editorial.css?v=${config.release}`)) failures.push(`${file}: active museum stylesheet token ${config.release} missing`);
}

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Stage 39 UI design contract audit passed: final authority, masonry gallery, life journey controls, exhibitions, contact, sticky footer and active cache token ${config.release} are consistent.`);
