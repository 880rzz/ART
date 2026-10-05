import fs from 'node:fs';

const css = fs.readFileSync('assets/css/site.css','utf8');
const authority = JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
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
  '--apple-page-max:1440px','--apple-reading-max:760px','--apple-gutter:',
  '--apple-section-space:','--apple-art-ground:#202530','--apple-art-raised:#29303F','--apple-art-panel:#2D3444',
  'text-align:left','min-height:44px','@media (max-width:1024px)','@media (max-width:768px)','@media (max-width:560px)',
  'header.sub','.section-head','.timeline','.archive-grid','.project-grid','.record-grid','.source-grid','footer',
  'TYPOGRAPHY-RHYTHM-20260921:START','--apple-display-max:22ch','--apple-meta-max:860px',
  '--apple-header-copy-gap:','--apple-header-rule-gap:','--apple-media-gap:',
  'text-wrap:pretty','font-size:var(--art-page-title)','font-size:var(--art-section-title)','font-size:var(--art-chapter-title)','font-size:var(--art-lead)','hyphens:auto','header.sub) + section','header.sub) > .wrap + .wrap','[data-record-type][data-record-slug] header.sub h1','[data-record-type][data-record-slug] header.sub :is(.loc,.meta,.lead,.hero-sub)'
]) if (!contract.includes(needle)) failures.push(`contract missing: ${needle}`);

for (const forbidden of [
  'header.sub :is(.lead,.hero-sub,.loc,.meta){max-width:62ch',
  'header.sub h1{max-width:15ch',
  '.euforia-artwork__copy h2{font-family:Georgia',
  '.euforia-artwork__copy .lead{font-family:Georgia',
  '.euforia-project-hero h1{max-width:13ch;margin:.18em 0 .28em;color:#fff;font-family:Georgia',
  '.euforia-person h3{font-family:Georgia'
]) if (contract.includes(forbidden)) failures.push(`retired typography constraint remains: ${forbidden}`);


if (authority.typography?.h1 !== 'clamp(2.25rem,4.2vw,3.75rem)') failures.push('design authority H1 scale drifted from canonical Apple token');
if (authority.typography?.h2 !== 'clamp(1.65rem,2.55vw,2.5rem)') failures.push('design authority H2 scale drifted from canonical Apple token');
if (authority.typography?.h3 !== 'clamp(1.4rem,1.85vw,2rem)') failures.push('design authority H3 scale drifted from canonical Apple token');
if (authority.typography?.lead !== 'clamp(1.08rem,.42vw + 1rem,1.24rem)') failures.push('design authority lead scale drifted from canonical Apple token');
if (authority.principles?.singleCanonicalTypographyScale !== true) failures.push('single canonical typography authority not declared');
if (authority.principles?.preserveHeadingAccentTreatment !== true) failures.push('H1/H2 accent preservation contract missing');

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
