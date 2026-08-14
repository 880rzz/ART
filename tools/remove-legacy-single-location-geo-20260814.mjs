import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const skip=new Set(['.git','node_modules','_site','dist','coverage']);
const changed=[];
const pattern=/\n?[ \t]*<meta\b[^>]*(?:name|http-equiv)=["'](?:geo\.region|geo\.placename|icbm)["'][^>]*>\s*/gi;
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&skip.has(entry.name)) continue;
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(abs);
    else if(entry.isFile()&&entry.name.endsWith('.html')){
      const before=fs.readFileSync(abs,'utf8');
      const after=before.replace(pattern,'\n');
      if(after!==before){fs.writeFileSync(abs,after);changed.push(path.relative(root,abs).replaceAll('\\','/'));}
    }
  }
}
walk(root);
let remains=[];
function verify(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&skip.has(entry.name)) continue;
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory()) verify(abs);
    else if(entry.isFile()&&entry.name.endsWith('.html')){
      const html=fs.readFileSync(abs,'utf8');
      if(/<meta\b[^>]*(?:name|http-equiv)=["'](?:geo\.region|geo\.placename|icbm)["']/i.test(html)) remains.push(path.relative(root,abs));
    }
  }
}
verify(root);
if(remains.length) throw new Error('Legacy GEO meta remains: '+remains.join(', '));
console.log(`Removed obsolete single-location GEO metadata from ${changed.length} HTML files.`);
console.log(changed.join('\n'));
