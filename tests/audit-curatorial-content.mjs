import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];

async function read(rel){ return readFile(path.join(root, rel), 'utf8'); }
async function walk(dir, out=[]){
  for(const item of await readdir(dir,{withFileTypes:true})){
    if(['.git','node_modules','.github'].includes(item.name)) continue;
    const full=path.join(dir,item.name);
    if(item.isDirectory()) await walk(full,out);
    else if(item.name.endsWith('.html')) out.push(full);
  }
  return out;
}

for(const rel of ['hu/curators.html','curators.html','de-at/curators.html']){
  const html=await read(rel);
  if(!/(?:Vállalati kezdet|Corporate beginnings|Unternehmerischer Anfang)/.test(html)) errors.push(`${rel}: missing corporate-origin explanation`);
  if(/MOL Project/.test(html)) errors.push(`${rel}: unverified client name still present`);
  if(/szívesen (?:dolgoznék|építenék)|work with you|mit Ihnen arbeiten/i.test(html)) errors.push(`${rel}: contains collaboration pitch`);
  if(/class="btn"[^>]*>[^<]*(?:Kurátori összefoglaló|Kiállítási|kölcsönzési|chronological|loan enquiry|Leihgabe)/i.test(html)) errors.push(`${rel}: contains removed curator CTA`);
}

const huHome=await read('hu/index.html');
if(/négy működő domain|banhalmi\.at domain|két fő domainre épül/i.test(huHome)) errors.push('hu/index.html: domain narrative still visible');
if(!/görögországi baleset|New Yorkhoz kapcsolódó évek|Ébredés/.test(huHome)) errors.push('hu/index.html: expanded life journey missing');

for(const rel of ['hu/press.html','press.html','de-at/press.html']){
  const html=await read(rel);
  if(!/class="press-types"/.test(html)) errors.push(`${rel}: press guide block missing`);
  if(!/press-type-grid/.test(html)) errors.push(`${rel}: press categories missing`);
}

for(const file of await walk(root)){
  const rel=path.relative(root,file).replaceAll('\\','/');
  if(!/(^|\/)exhibitions\//.test(rel)) continue;
  const html=await readFile(file,'utf8');
  if(/OEUVRE-INTEGRITY:START|id=["']curatorial-periods["']/.test(html)) errors.push(`${rel}: generated exhibition block remains`);
}

if(errors.length){
  console.error('CURATORIAL CONTENT AUDIT FAILED');
  for(const error of errors) console.error('-',error);
  process.exit(1);
}
console.log('CURATORIAL CONTENT AUDIT PASSED');
