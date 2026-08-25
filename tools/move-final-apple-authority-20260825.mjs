import fs from 'node:fs';
const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const final='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const start='/* STRICT-APPLE-FINAL-20260825 */';
const s=css.indexOf(start), f=css.lastIndexOf(final);
if(s<0||f<0) throw new Error('Required Apple authority markers not found');
if(s<f){console.log('Final strict block is already inside Apple authority.');process.exit(0)}
const block=css.slice(s).trimEnd();
css=css.slice(0,s).trimEnd()+'\n';
const i=css.lastIndexOf(final);
if(i<0) throw new Error('Final authority marker lost');
css=css.slice(0,i)+block+'\n\n'+css.slice(i);
fs.writeFileSync(file,css);
console.log('Moved ART final strict Apple block inside the single final CSS authority.');
