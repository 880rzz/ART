import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets']);
let pages=0;
let removed=0;

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&skip.has(entry.name)) continue;
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(abs);
    else if(entry.isFile()&&entry.name.endsWith('.html')) migrate(abs);
  }
}

function migrate(file){
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  html=html
    .replace(/\s*<meta\s+name=["']geo\.region["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<meta\s+name=["']geo\.placename["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<meta\s+name=["']geo\.position["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<meta\s+name=["']ICBM["'][^>]*>\s*/gi,'\n');
  if(html!==before){
    const count=(before.match(/<meta\s+name=["'](?:geo\.region|geo\.placename|geo\.position|ICBM)["'][^>]*>/gi)||[]).length;
    removed+=count;
    pages++;
    fs.writeFileSync(file,html);
  }
}

walk(root);
console.log(`Removed ${removed} obsolete single-location GEO meta tags from ${pages} ART pages.`);
