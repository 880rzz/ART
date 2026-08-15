import fs from 'node:fs';

const file='assets/css/site.css';
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STAGE151-BOOK-CARD-ALIGNMENT:START */';
const finish='/* STAGE151-BOOK-CARD-ALIGNMENT:END */';
let css=fs.readFileSync(file,'utf8');
if(!css.includes(end)) throw new Error('Responsive contract end marker missing');
if(css.includes(start) || css.includes(finish)) throw new Error('Stage151 marker already present');
const block=`\n${start}\n/* Homepage book cards share one top baseline. Legacy stagger/offset rules are\n   explicitly neutralised so all three publication cards begin on the same line. */\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive #books .cards{\n  align-items:stretch!important;\n}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive.apple-archive #books .cards>.card{\n  margin-top:0!important;\n  top:auto!important;\n  transform:none!important;\n  translate:none!important;\n  align-self:stretch!important;\n}\n${finish}\n`;
css=css.replace(end,block+'\n'+end);
fs.writeFileSync(file,css);
console.log('Aligned all homepage book cards to one top baseline.');
