import fs from 'node:fs';
const p='assets/css/site.css';
let css=fs.readFileSync(p,'utf8');
const oldRule=`html body.apple-archive.apple-archive[data-archive-page="press"] .press-redesign :is(.press-overview p,.press-period p,.press-period .desc,.press-period .note,.press-period small,.press-period-nav__range){
  color:#AFC4D9!important;
}`;
const newRule=`html body.apple-archive.apple-archive[data-archive-page="press"] .press-redesign :is(.press-overview p,.press-period p,.press-period .note,.press-period small,.press-period-nav__range){
  color:#AFC4D9!important;
}
html body.apple-archive.apple-archive.apple-archive[data-archive-page="press"] .press-redesign .press-period p.desc{
  color:#F5F5F7!important;
  opacity:1!important;
}`;
if(!css.includes(oldRule)) throw new Error('Stage69 press muted rule not found');
css=css.replace(oldRule,newRule);
fs.writeFileSync(p,css,'utf8');
console.log('ART Stage69 press description contrast authority corrected.');
