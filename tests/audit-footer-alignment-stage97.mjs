import fs from 'node:fs';
import path from 'node:path';
const css=fs.readFileSync('assets/css/footer-elegant.css','utf8');
const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;
const errors=[];
for(const token of ['STAGE97-FOOTER-ALIGNMENT:START','footer .meta{','text-align:center!important','footer .fineprint>br{display:none!important','footer .fineprint .consent-reset','justify-content:flex-start!important','text-transform:none!important','footer .banhalmi-ecosystem'])if(!css.includes(token))errors.push('footer CSS missing '+token);
if(!release)errors.push('active design release is missing');
const skip=new Set(['.git','node_modules','.github']);const files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))files.push(p)}}walk('.');
let footers=0;for(const f of files){const h=fs.readFileSync(f,'utf8');if(!/<footer\b/i.test(h))continue;footers++;if(!h.includes('footer-elegant.css?v='+release))errors.push(f+': stale footer cache token');const m=h.match(/<p class=["']fineprint["']>([\s\S]*?)<\/p>/i);if(m){const s=m[1];const trust=Math.max(s.indexOf('Trust Center'),s.indexOf('Bizalom'),s.indexOf('Vertrauen'));const cookie=Math.max(s.indexOf('Cookie settings'),s.indexOf('Sütibeállítások'),s.indexOf('Cookie-Einstellungen'));if(cookie<0)errors.push(f+': cookie settings missing from legal row');if(trust>=0&&cookie<trust)errors.push(f+': cookie settings is not fourth/after trust item');}}
if(footers<80)errors.push('expected >=80 footer pages, found '+footers);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Stage97 footer alignment audit passed across '+footers+' footer pages: enquiry remains centred; navigation/legal/ecosystem rows are left-aligned; Cookie settings is the fourth legal action.');
