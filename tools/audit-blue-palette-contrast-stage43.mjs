import fs from 'node:fs';

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
if(!palette.includes('--c-ink-soft:#AFC4D9')) throw new Error('ART blue-only secondary text token missing');
if(!footer.includes("@import url('./palette-blue-final.css')")) throw new Error('ART blue-only palette override is not loaded site-wide through the shared footer stylesheet');
for(const forbidden of ['#080706','#aaa8a4']) if(footer.toLowerCase().includes(forbidden)) throw new Error(`Forbidden black/neutral-gray footer color remains: ${forbidden}`);

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
console.log('ART blue-only palette and sparse type accent WCAG contrast audit passed.');
