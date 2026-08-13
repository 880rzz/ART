import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'_site');
const authority=await readFile(path.join(process.cwd(),'scripts/universal-design-authority.css'),'utf8');
const bundleDir=path.join(root,'assets/css/bundles');
for(const name of await readdir(bundleDir)){
  if(!/^art-[a-f0-9]{16}\.css$/.test(name)) continue;
  const file=path.join(bundleDir,name);
  const css=await readFile(file,'utf8');
  if(!css.includes('BANHALMI ART — universal production design authority')) await writeFile(file,`${css}\n${authority}\n`,'utf8');
}
for(const rel of ['index.html','hu/index.html','de-at/index.html']){
  const file=path.join(root,rel);let html=await readFile(file,'utf8');
  if(!html.includes('BANHALMI ART — universal production design authority')) html=html.replace('</style>\n<link rel="preload"','\n'+authority+'\n</style>\n<link rel="preload"');
  await writeFile(file,html,'utf8');
}
console.log('Universal production design authority appended to hashed bundles and homepage critical CSS.');
