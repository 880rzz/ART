import fs from 'node:fs';

const files=['index.html','hu/index.html','de-at/index.html'];
function range(html,id){
  const m=new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>`,'i').exec(html);
  if(!m)return null;
  let depth=1;const re=/<\/?section\b[^>]*>/gi;re.lastIndex=m.index+m[0].length;let t;
  while((t=re.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return{start:m.index,end:re.lastIndex}}
  throw new Error(`${id}: unclosed section`);
}
let removed=0;
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const r=range(html,'presence-periods');
  if(!r){console.log(`${file}: no redundant #presence-periods block`);continue;}
  html=html.slice(0,r.start)+html.slice(r.end);
  if(/id=["']presence-periods["']/i.test(html))throw new Error(`${file}: presence-periods survived cleanup`);
  fs.writeFileSync(file,html);removed++;
  console.log(`${file}: removed redundant #presence-periods block.`);
}
console.log(`Removed ${removed} redundant presence-periods blocks across EN/HU/DE; cleanup is idempotent.`);
