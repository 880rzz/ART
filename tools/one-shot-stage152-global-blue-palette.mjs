import fs from 'node:fs';

const cssFile='assets/css/site.css';
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STAGE152-GLOBAL-APPROVED-BLUE-PALETTE:START */';
const stop='/* STAGE152-GLOBAL-APPROVED-BLUE-PALETTE:END */';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes(end)) throw new Error('Responsive contract end marker missing');
if(css.includes(start)||css.includes(stop)) throw new Error('Stage152 already present or partial');

// Permanently retire the old slate-blue surface in the CSS authority.
css=css
  .replaceAll('#484F60','#2D3444')
  .replaceAll('#484f60','#2D3444')
  .replaceAll('rgb(72,79,96)','rgb(45,52,68)')
  .replaceAll('rgb(72, 79, 96)','rgb(45, 52, 68)');

const block=`\n${start}\n/* The ART archive may use exactly two blue section canvases: the approved\n   dark #202530 and light #2D3444. Legacy tone rules and pseudo-canvas\n   backgrounds are pinned here so the retired slate blue cannot reappear on\n   home, curatorial, book, exhibition or supporting archive pages. */\n:root{\n  --art-bg:#202530!important;\n  --art-surface:#2D3444!important;\n}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.tone-a,\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.tone-a::before{\n  background:#202530!important;\n  background-color:#202530!important;\n  --banhalmi-section-surface:#202530!important;\n}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.tone-b,\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive main>section.tone-b::before{\n  background:#2D3444!important;\n  background-color:#2D3444!important;\n  --banhalmi-section-surface:#2D3444!important;\n}\n/* Any explicit surface utility follows the same canonical light blue. */\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive :is(.surface,.surface-light,.archive-surface,.section-surface){\n  --banhalmi-section-surface:#2D3444!important;\n}\n${stop}\n`;
css=css.replace(end,block+end);
if(/#484f60|rgb\(72\s*,\s*79\s*,\s*96\s*\)/i.test(css)) throw new Error('Retired slate-blue token still remains in site.css');
fs.writeFileSync(cssFile,css);
console.log('Stage152: retired #484F60 and pinned all tone surfaces to #202530 / #2D3444.');
