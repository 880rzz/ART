import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>readFile(path.join(root,p),'utf8');
const errors=[];
const css=await read('assets/css/museum-editorial.css');
const llms=await read('llms.txt');
const release=JSON.parse(await read('data/design-release.json'));

for(const token of ['text-decoration-line:underline','text-underline-offset:.17em','PAGESPEED-STAGE31:START']){
  if(!css.includes(token)) errors.push(`museum-editorial.css missing link-recognition contract: ${token}`);
}
if(!llms.startsWith('# BANHALMI ART\n\n>')) errors.push('llms.txt must begin with H1 then blockquote summary');
for(const token of ['substantial New York chapter','operational bases remain Vienna and Budapest']){
  if(!llms.includes(token)) errors.push(`llms.txt missing archive geography context: ${token}`);
}
if(release.release!=='20260807-pagespeed-accessibility-v48') errors.push('PageSpeed accessibility cache release v48 is not active');

const headings={
  'index.html':['<h3>Recognition</h3>','<h3>Education</h3>'],
  'hu/index.html':['<h3>Elismerések</h3>','<h3>Tanulmányok</h3>'],
  'de-at/index.html':['<h3>Anerkennungen</h3>','<h3>Ausbildung</h3>']
};
for(const [file,tokens] of Object.entries(headings)){
  const html=await read(file);
  for(const token of tokens) if(!html.includes(token)) errors.push(`${file}: sequential homepage heading missing ${token}`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('ART PageSpeed stage 31 audit passed: content links are non-colour-only, homepage headings are sequential, llms entry is agent-friendly and cache release v48 is active.');
