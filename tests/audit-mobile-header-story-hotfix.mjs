import fs from 'node:fs';
import path from 'node:path';

// Permanent regression coverage for the reported iPhone Safari defects.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const css=fs.readFileSync(path.join(root,'assets/css/responsive-header-system.css'),'utf8');
for(const token of [
  'body.apple-archive:not(.menu-open) #menu',
  'pointer-events:none!important',
  'clip-path:inset(0 0 100% 0)!important',
  'body.apple-archive.menu-open #menu',
  '#story-dialog .story-panel',
  'max-height:calc(100dvh',
  '-webkit-overflow-scrolling:touch!important',
  'touch-action:pan-y!important'
]) if(!css.includes(token)) errors.push(`responsive header CSS missing ${token}`);

const pages=[
  'exhibitions/merfoldkovek1956.html',
  'hu/exhibitions/merfoldkovek1956.html',
  'de-at/exhibitions/merfoldkovek1956.html'
];
for(const relative of pages){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if(!html.includes('id="story-dialog"')) errors.push(`${relative}: story dialog missing`);
  if(!html.includes('class="story-panel"')) errors.push(`${relative}: story panel missing`);
  if(!html.includes('/assets/css/responsive-header-system.css')) errors.push(`${relative}: responsive header stylesheet missing`);
  if(!html.includes('body.classList.add(\'story-modal-open\')') && !html.includes('body.classList.add("story-modal-open")')) errors.push(`${relative}: modal body lock missing`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Mobile header leakage and 1956 story scrolling audit passed across all three languages.');
