import fs from 'node:fs';

const pages=['press.html','hu/press.html','de-at/press.html'];
const markerStart='/* PRESS-EDITORIAL-REDESIGN-AUTHORITY:START */';
const markerEnd='/* PRESS-EDITORIAL-REDESIGN-AUTHORITY:END */';
const contractEnd='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const extracted=[];
for(const file of pages){
  let html=fs.readFileSync(file,'utf8');
  const m=html.match(/<style id=["']press-editorial-redesign["']>([\s\S]*?)<\/style>/i);
  if(!m) throw new Error(`${file}: press editorial inline style missing before migration`);
  extracted.push(m[1].trim());
}
if(new Set(extracted).size!==1) throw new Error('Press inline CSS differs between languages; refusing lossy migration.');
for(const file of pages){
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/\s*<style id=["']press-editorial-redesign["']>[\s\S]*?<\/style>\s*/i,'\n');
  fs.writeFileSync(file,html);
}
const cssFile='assets/css/site.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes(contractEnd)) throw new Error('Apple responsive contract END marker missing');
const authority=`\n${markerStart}\n${extracted[0]}\n${markerEnd}\n`;
if(css.includes(markerStart)){
  css=css.replace(/\/\* PRESS-EDITORIAL-REDESIGN-AUTHORITY:START \*\/[\s\S]*?\/\* PRESS-EDITORIAL-REDESIGN-AUTHORITY:END \*\/\n?/m,'');
}
css=css.replace(contractEnd,authority+contractEnd);
fs.writeFileSync(cssFile,css);
console.log('Migrated shared Press editorial CSS from 3 HTML files into site.css authority.');
