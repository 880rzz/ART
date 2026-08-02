import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = await readFile(path.join(root, 'assets/css/museum-editorial.css'), 'utf8');
const errors = [];
const required = [
  '16. Canonical section surface system',
  '--mus-ground:#0a0a0a',
  '--mus-raised:#202020',
  '--mus-panel:#303030',
  'main>section:nth-of-type(even)',
  'main>section::before',
  'width:100vw',
  'main>.statement::before'
];
for (const token of required) if (!css.includes(token)) errors.push('museum-editorial.css: missing ' + token);
const finalBlock = css.slice(css.indexOf('16. Canonical section surface system'));
if (finalBlock.includes(':not([class*="tone-"])')) errors.push('final surface system still lets legacy tone classes escape structural alternation');

const skip = new Set(['.git','node_modules','.github','data','reports']);
const files = [];
async function walk(dir){
  for (const entry of await readdir(dir,{withFileTypes:true})){
    if (skip.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);
let pages = 0;
let sections = 0;
for (const file of files){
  const html = await readFile(file,'utf8');
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html) || !/<main\b/i.test(html)) continue;
  pages += 1;
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
  sections += (main.match(/<section\b/gi) || []).length;
  const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
  const museum = links.findIndex(h=>h.includes('/assets/css/museum-editorial.css'));
  if (museum < 0) errors.push(path.relative(root,file)+': museum-editorial.css missing');
  else if (museum !== links.length-1) errors.push(path.relative(root,file)+': museum-editorial.css is not the final stylesheet');
}
if (pages < 80) errors.push('surface audit covered unexpectedly few pages: '+pages);
if (sections < 300) errors.push('surface audit covered unexpectedly few sections: '+sections);
if (errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Section surface audit passed: '+sections+' sections across '+pages+' pages use the final full-bleed three-tone system.');
