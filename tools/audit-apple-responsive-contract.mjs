import fs from 'node:fs';

const css = fs.readFileSync('assets/css/site.css','utf8');
const failures = [];
const start = 'APPLE-RESPONSIVE-CONTRACT-V1:START';
const end = 'APPLE-RESPONSIVE-CONTRACT-V1:END';
const a = css.lastIndexOf(start);
const b = css.lastIndexOf(end);
if (a < 0 || b <= a) failures.push('Apple responsive contract marker missing');
if (a >= 0 && css.indexOf(start) !== a) failures.push('Apple responsive contract START marker must appear exactly once');
if (b >= 0 && css.indexOf(end) !== b) failures.push('Apple responsive contract END marker must appear exactly once');
if (b >= 0) {
  const markerClose = css.indexOf('*/', b + end.length);
  if (markerClose < 0) failures.push('Apple responsive contract END comment is not closed');
  else if (css.slice(markerClose + 2).trim()) failures.push('Apple responsive contract must be the final CSS authority; rules found after END marker');
}
const contract = a >= 0 && b > a ? css.slice(a,b) : '';

for (const needle of [
  '--apple-page-max:1200px','--apple-reading-max:760px','--apple-gutter:',
  '--apple-section-space:','--apple-art-ground:#202530','--apple-art-raised:#29303F','--apple-art-panel:#2D3444',
  'text-align:left','min-height:44px','@media (max-width:1024px)','@media (max-width:768px)','@media (max-width:560px)',
  'header.sub','.section-head','.timeline','.archive-grid','.project-grid','.record-grid','.source-grid','footer'
]) if (!contract.includes(needle)) failures.push(`contract missing: ${needle}`);

function rgb(hex){const v=hex.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255)}
function channel(v){return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function luminance(hex){const [r,g,b]=rgb(hex).map(channel);return .2126*r+.7152*g+.0722*b}
function contrast(x,y){const [hi,lo]=[luminance(x),luminance(y)].sort((m,n)=>n-m);return (hi+.05)/(lo+.05)}
for (const [fg,bg,min,label] of [
  ['#F5F5F7','#202530',7,'primary archive text'],
  ['#A1A1A6','#202530',4.5,'secondary archive text'],
  ['#DCC56B','#202530',4.5,'gold archive text'],
  ['#AFC4D9','#202530',4.5,'blue archive text']
]) if (contrast(fg,bg) < min) failures.push(`${label} contrast ${contrast(fg,bg).toFixed(2)} < ${min}`);

const htmlFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','_site'].includes(e.name)) continue; const p=`${dir}/${e.name}`.replace(/^\.\//,''); if(e.isDirectory()) walk(p); else if(p.endsWith('.html')) htmlFiles.push(p)}}
walk('.');
const realPages=htmlFiles.filter(p=>!p.includes('/post/')&&!p.startsWith('service-page/')&&!p.startsWith('fotokiallitasok/'));
if (realPages.length < 80) failures.push(`unexpectedly low archive HTML coverage: ${realPages.length}`);

if (failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Apple responsive contract passed for ART: ${realPages.length} archive HTML files; single final CSS authority, contrast and desktop/tablet/mobile layout guards active.`);
