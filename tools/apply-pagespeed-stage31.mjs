import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const read = (p) => readFile(path.join(root,p),'utf8');
const write = (p,s) => writeFile(path.join(root,p),s,'utf8');

const cssPath='assets/css/museum-editorial.css';
let css=await read(cssPath);
if(!css.includes('/* PAGESPEED-STAGE31:START */')){
  css += `
/* PAGESPEED-STAGE31:START */
/* Content links must not rely on colour alone. Navigation, buttons, cards and
   image controls retain their designed interaction treatment. */
main p a:not(.btn):not(.card),
main li a:not(.btn):not(.card),
main .lead a:not(.btn),
main .meta a:not(.btn),
main .fineprint a:not(.btn){
  text-decoration-line:underline;
  text-decoration-thickness:.075em;
  text-underline-offset:.17em;
  text-decoration-skip-ink:auto;
}
main p a:not(.btn):focus-visible,
main li a:not(.btn):focus-visible{
  text-decoration-thickness:.12em;
}
/* PAGESPEED-STAGE31:END */
`;
  await write(cssPath,css);
}

for(const file of ['index.html','hu/index.html','de-at/index.html']){
  let html=await read(file);
  html=html.replaceAll('<h4>Recognition</h4>','<h3>Recognition</h3>')
           .replaceAll('<h4>Education</h4>','<h3>Education</h3>')
           .replaceAll('<h4>Elismerések</h4>','<h3>Elismerések</h3>')
           .replaceAll('<h4>Tanulmányok</h4>','<h3>Tanulmányok</h3>')
           .replaceAll('<h4>Anerkennung</h4>','<h3>Anerkennung</h3>')
           .replaceAll('<h4>Ausbildung</h4>','<h3>Ausbildung</h3>');
  await write(file,html);
}

let llms=await read('llms.txt');
if(!llms.startsWith('# BANHALMI ART\n\n>')){
  llms=llms.replace(/^# BANHALMI ART$/m,'## Archive identity');
  llms=`# BANHALMI ART\n\n> Official artistic archive of Norbert Bánhalmi’s oeuvre since 1999: photography, books, exhibitions, moving image, press reception and community practice. The archive contains a substantial New York chapter; current operational bases remain Vienna and Budapest.\n\n${llms}`;
  await write('llms.txt',llms);
}

// Bump the cache key because the final cascade changed.
const cfgPath='data/design-release.json';
const cfg=JSON.parse(await read(cfgPath));
const hash=createHash('sha256');
const cssDir=path.join(root,'assets/css');
for(const f of (await readdir(cssDir)).filter(f=>f.endsWith('.css')).sort()) hash.update(await readFile(path.join(cssDir,f)));
const jsDir=path.join(root,'assets/js');
for(const f of (await readdir(jsDir)).filter(f=>f.endsWith('.js')).sort()) hash.update(await readFile(path.join(jsDir,f)));
cfg.release='20260807-pagespeed-accessibility-v48';
cfg.assetDigest=hash.digest('hex').slice(0,16);
cfg.note='PageSpeed accessibility release: content links no longer rely on colour alone, homepage heading hierarchy is sequential, and llms.txt exposes a spec-friendly H1/summary entry while preserving the archive knowledge base.';
await write(cfgPath,JSON.stringify(cfg,null,2)+'\n');

console.log('ART PageSpeed stage 31 source migration prepared.');
