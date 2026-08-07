import fs from 'node:fs';

const failures=[];
const js=fs.readFileSync('assets/js/responsive-header-system.js','utf8');
const museum=fs.readFileSync('assets/css/museum-editorial.css','utf8');

if(/createElement\s*\(\s*['"]style['"]\s*\)/.test(js)) failures.push('responsive-header-system.js must not create runtime style elements');
for(const forbidden of ['archiveInterfaceSystem','responsiveHeaderIcon','systemStyle.textContent','iconOverride.textContent','document.head.append(systemStyle)','document.head.append(iconOverride)']){
  if(js.includes(forbidden)) failures.push(`responsive-header-system.js contains forbidden presentation ownership: ${forbidden}`);
}
const start='/* STAGE37-STATIC-ARCHIVE-INTERFACE:START */';
const end='/* STAGE37-STATIC-ARCHIVE-INTERFACE:END */';
if((museum.split(start).length-1)!==1 || (museum.split(end).length-1)!==1) failures.push('museum-editorial.css must contain exactly one Stage 37 static archive-interface block');
for(const required of [
  'html body.apple-archive{',
  'html body.apple-archive .curatorial-hero{',
  'html body.apple-archive .curatorial-section{',
  'html body.apple-archive[data-archive-page="index"] #journey{',
  'body.apple-archive .burger::before,body.apple-archive .burger::after{content:none!important;box-shadow:none!important}'
]){
  if(!museum.includes(required)) failures.push(`museum-editorial.css missing migrated Stage 37 contract: ${required}`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Stage 37 runtime design-authority audit passed: archive presentation is static in museum-editorial.css and responsive-header-system.js is behavior-only.');
