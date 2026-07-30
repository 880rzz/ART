import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const skip=new Set(['.git','node_modules','.github']);
const release='20260730-final-release-v2';

async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(skip.has(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) await walk(full);
    else if(entry.name.endsWith('.html')){
      const original=await readFile(full,'utf8');
      const updated=original.replace(
        /\/assets\/css\/apple-editorial-system\.css(?:\?v=[^"']+)?/g,
        `/assets/css/apple-editorial-system.css?v=${release}`
      );
      if(updated!==original) await writeFile(full,updated,'utf8');
    }
  }
}

await walk(root);
console.log(`Editorial release cache key applied: ${release}`);
