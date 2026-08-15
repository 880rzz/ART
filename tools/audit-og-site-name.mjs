import fs from 'node:fs';
import path from 'node:path';
const failures=[];let pages=0;const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','.well-known']);
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.isFile()&&e.name.endsWith('.html'))inspect(p)}}
function inspect(file){const h=fs.readFileSync(file,'utf8');if(isRedirect(h)||!/<main\b/i.test(h))return;const m=h.match(/<meta\b(?=[^>]*\bproperty=["']og:site_name["'])[^>]*\bcontent=["']([^"']*)["'][^>]*>/i);if(!m){failures.push(`${file}: og:site_name missing`);return;}pages++;if(m[1]!=='BANHALMI ART')failures.push(`${file}: og:site_name is ${JSON.stringify(m[1])}, expected BANHALMI ART`)}
walk('.');
if(pages<40)failures.push(`og:site_name coverage unexpectedly low: ${pages}`);
if(failures.length){console.error('ART og:site_name audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`ART og:site_name audit passed across ${pages} real content pages.`);
