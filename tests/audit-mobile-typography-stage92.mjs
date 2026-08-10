import fs from 'node:fs';
import path from 'node:path';
const errors=[];
const RELEASE='20260810-mobile-typography-v92';
const authority='assets/css/homepage-two-tone-authority.css';
const css=fs.readFileSync(authority,'utf8');
for(const token of ['STAGE92-ARCHIVE-WIDE-MOBILE-TYPOGRAPHY-FLOOR', 'font-size:max(.875rem,1em)!important', 'p,li,a,button,summary,label,input,textarea,select,option,small,figcaption,td,th,dt,dd,time,address,blockquote,cite', '.meta,.loc,.muted,.fineprint,.cap,.caption,.credit,.credits,.source,.sources,.reference,.references', '.label,.eyebrow,.kicker,.presence-kicker,.era-no,.period-no,.life-stage__index,.yr']) if(!css.includes(token)) errors.push('mobile floor missing '+token);
function walk(dir,out=[]){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','.github','node_modules','reports'].includes(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p,out);else if(ent.name.endsWith('.html'))out.push(p)}return out}
const htmlFiles=walk('.');
let content=0;
for(const file of htmlFiles){const html=fs.readFileSync(file,'utf8');if(!/body[^>]*apple-archive/.test(html))continue;content++;const links=[...html.matchAll(/<link[^>]+href=["']([^"']*homepage-two-tone-authority.css[^"']*)["'][^>]*>/gi)];if(links.length!==1)errors.push(file+' must link final typography authority exactly once');else if(!links[0][1].includes(RELEASE))errors.push(file+' authority cache key is stale');const styleImportant=[...html.matchAll(/style=["'][^"']*font-sizes*:s*(d+(?:.d+)?)pxs*!important/gi)];for(const m of styleImportant){if(Number(m[1])<14)errors.push(file+' has inline !important font-size below 14px: '+m[1]+'px')}}
if(content<80)errors.push('content page inventory unexpectedly small: '+content);
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));if(!pkg.scripts.test.includes('audit-mobile-typography-stage92.mjs'))errors.push('main test chain does not include Stage92');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage 92 mobile typography audit passed: '+content+' ART content pages inherit a final 14px minimum semantic reading floor on phones; inline sub-14px !important text is forbidden.');
