import fs from 'node:fs';

const files=['index.html','hu/index.html','de-at/index.html'];
let changed=0;
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  html=html.replace(/(<details\s+class="[^"]*life-record-group[^"]*")\s+open(>)/g,'$1$2');
  if(html!==before){fs.writeFileSync(file,html);changed++;}
}
if(changed===0) throw new Error('No default-open life journey groups found');
console.log(`Removed default-open state from life journey groups in ${changed} homepage(s).`);
