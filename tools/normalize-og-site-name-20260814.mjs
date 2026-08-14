import fs from 'node:fs';
import path from 'node:path';
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
let changed=0,seen=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))migrate(p)}}
function migrate(file){let h=fs.readFileSync(file,'utf8');const re=/<meta\b(?=[^>]*\bproperty=["']og:site_name["'])[^>]*>/i;const m=re.exec(h);if(!m)return;seen++;let tag=m[0];if(/\bcontent=["'][^"']*["']/i.test(tag))tag=tag.replace(/\bcontent=(["'])[^"']*\1/i,'content="BANHALMI ART"');else tag=tag.replace(/\s*\/?>(?=$)/,' content="BANHALMI ART">');if(tag!==m[0]){h=h.slice(0,m.index)+tag+h.slice(m.index+m[0].length);fs.writeFileSync(file,h);changed++;console.log(`${file}: og:site_name → BANHALMI ART`);}}
walk('.');
if(seen<40)throw new Error(`og:site_name coverage unexpectedly low: ${seen}`);
console.log(`Normalized og:site_name on ${changed} pages; inspected ${seen}.`);
