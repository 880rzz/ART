import fs from 'node:fs';
import path from 'node:path';

function channel(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function lum(hex){const h=hex.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function requireRatio(name,fg,bg,min){const ratio=contrast(fg,bg);if(ratio<min)throw new Error(`${name}: ${ratio.toFixed(2)}:1 < ${min}:1`);console.log(`${name}: ${ratio.toFixed(2)}:1`)}

const base=fs.readFileSync('assets/css/page-base.css','utf8');
const museum=fs.readFileSync('assets/css/museum-editorial.css','utf8');
const footer=fs.readFileSync('assets/css/footer-elegant.css','utf8');
const palette=fs.readFileSync('assets/css/palette-blue-final.css','utf8');
const config=JSON.parse(fs.readFileSync('data/design-release.json','utf8'));

for(const token of ['--c-ground:#202530','--c-raised:#29303F','--c-panel:#2D3444']) if(!base.includes(token)) throw new Error(`Missing ART blue palette token: ${token}`);
for(const token of ['html body.apple-archive #menu','STAGE44-TYPE-ACCENT:START','html body.apple-archive .title-accent{color:var(--mus-gold)!important}']) if(!museum.includes(token)) throw new Error(`ART design contract missing: ${token}`);
for(const token of [
  '--c-ink-soft:#AFC4D9',
  '--mus-ink:#F5F5F7',
  '--mus-soft:#AFC4D9',
  'border-radius:12px!important',
  'html body.apple-archive.apple-archive > nav:not(#menu):not(.menu):not(.archive-nav)',
  'background:rgba(32,37,48,.97)!important',
  'html body.apple-archive.apple-archive #menu',
  'background:#202530!important',
  'html body.apple-archive.apple-archive footer',
  'background:linear-gradient(180deg,#29303F 0%,#202530 100%)!important',
  'html body.apple-archive.apple-archive .story-backdrop',
  'background:rgba(32,37,48,.92)!important',
  'html body.apple-archive.apple-archive .story-panel',
  'background:linear-gradient(145deg,#2D3444 0%,#29303F 58%,#202530 100%)!important'
]) if(!palette.includes(token)) throw new Error(`ART final blue/rounded control contract missing: ${token}`);
if(!footer.includes("@import url('./palette-blue-final.css')")) throw new Error('ART blue-only palette override is not loaded site-wide through the shared footer stylesheet');
for(const forbidden of ['#080706','#aaa8a4']) if(footer.toLowerCase().includes(forbidden)) throw new Error(`Forbidden black/neutral-gray footer color remains: ${forbidden}`);

/* Visual-asset palette guard. SVG files are rendered UI assets too, so legacy
 * black/brown/old-gold values must never be able to bypass the CSS/HTML guards.
 * Historical audit documents are intentionally outside this visual contract. */
const forbiddenVisualColors=[
  '#0e0d0b','#0b0a09','#0a0a0a','#0c0b0a','#0c0c0c','#121212','#131313',
  '#14120f','#151411','#18130c','#181818','#1a1713','#1b1b1b','#211a11',
  '#242424','#252525','#1d1912','#3c3c3c','#c9a962','#aaa8a4','#080706'
];
const svgFiles=[];
function collectSvg(dir){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())collectSvg(full);
    else if(entry.name.toLowerCase().endsWith('.svg'))svgFiles.push(full);
  }
}
collectSvg('assets');
for(const file of svgFiles){
  const source=fs.readFileSync(file,'utf8').toLowerCase();
  for(const forbidden of forbiddenVisualColors){
    if(source.includes(forbidden))throw new Error(`${file}: forbidden legacy visual-asset color remains: ${forbidden}`);
  }
}
const favicon=fs.readFileSync('assets/img/favicon.svg','utf8');
if(!favicon.includes('fill="#202530"'))throw new Error('ART favicon must use canonical #202530 blue background');
if(!favicon.includes('fill="#B79C44"'))throw new Error('ART favicon must use canonical #B79C44 gold mark');
const logo=fs.readFileSync('assets/img/banhalmi-logo.svg','utf8');
if(!logo.includes('fill="#B79C44"'))throw new Error('ART logo must use canonical #B79C44 gold mark');
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
if(manifest.background_color!=='#202530'||manifest.theme_color!=='#202530')throw new Error('ART webmanifest background/theme must remain canonical #202530 blue');

requireRatio('primary text / ground','#F5F5F7','#202530',4.5);
requireRatio('secondary blue text / ground','#AFC4D9','#202530',4.5);
requireRatio('gold / ground','#B79C44','#202530',4.5);
requireRatio('primary text / raised','#F5F5F7','#29303F',4.5);
requireRatio('secondary blue text / raised','#AFC4D9','#29303F',4.5);
requireRatio('gold / raised','#B79C44','#29303F',4.5);
requireRatio('primary text / panel','#F5F5F7','#2D3444',4.5);
requireRatio('secondary blue text / panel','#AFC4D9','#2D3444',4.5);
requireRatio('gold / panel','#B79C44','#2D3444',4.5);

for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(file,'utf8');
  const accents=(html.match(/class="title-accent title-accent--block"/g)||[]).length;
  if(accents!==1) throw new Error(`${file}: expected exactly one sparse ART title accent, found ${accents}`);
  if(!html.includes(`museum-editorial.css?v=${config.release}`)) throw new Error(`${file}: active release token ${config.release} missing from museum stylesheet`);
}
console.log(`ART blue-only UI + ${svgFiles.length} SVG visual assets, canonical favicon/logo, rounded controls and sparse type accent WCAG contrast audit passed.`);
