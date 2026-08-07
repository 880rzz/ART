import fs from 'node:fs';
const file='de-at/index.html';
let html=fs.readFileSync(file,'utf8');
if(!html.includes('<h4>Anerkennungen</h4>')) throw new Error('Expected German recognition h4 not found');
html=html.replace('<h4>Anerkennungen</h4>','<h3>Anerkennungen</h3>');
fs.writeFileSync(file,html);
if(!fs.readFileSync(file,'utf8').includes('<h3>Anerkennungen</h3>')) throw new Error('German recognition h3 not written');
console.log('German homepage recognition heading promoted from h4 to h3.');
