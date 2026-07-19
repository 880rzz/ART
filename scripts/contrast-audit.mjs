import fs from 'node:fs';

function hexToRgb(hex){
  const v=hex.replace('#','');
  const n=parseInt(v.length===3?v.split('').map(c=>c+c).join(''):v,16);
  return [(n>>16)&255,(n>>8)&255,n&255];
}
function channel(v){
  const s=v/255;
  return s<=0.04045?s/12.92:Math.pow((s+0.055)/1.055,2.4);
}
function luminance(hex){
  const [r,g,b]=hexToRgb(hex).map(channel);
  return 0.2126*r+0.7152*g+0.0722*b;
}
function ratio(a,b){
  const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (hi+0.05)/(lo+0.05);
}
function requireRatio(name,fg,bg,min){
  const value=ratio(fg,bg);
  if(value<min)throw new Error(`${name}: ${value.toFixed(2)}:1 < ${min}:1`);
  console.log(`PASS ${name}: ${value.toFixed(2)}:1`);
}

requireRatio('cream on darkest green','#fff7e6','#031b13',4.5);
requireRatio('cream on card green','#fff7e6','#08291f',4.5);
requireRatio('dark ink on paper','#172019','#f4edda',4.5);
requireRatio('gold UI on darkest green','#d9a83e','#031b13',3);
requireRatio('bright gold text on card green','#f4c95f','#08291f',4.5);
requireRatio('placeholder on white','#525d55','#fffdf7',4.5);

const css=fs.readFileSync('assets/css/contrast-hardening.css','utf8');
const required=[
  'nav#mainTabs.tabs.open',
  '.menu-toggle[aria-expanded="true"]',
  '.daily-gate',
  '.moon-card',
  '.cave-disclaimer',
  '[data-surface="light"]',
  'opacity:1!important'
];
for(const token of required){
  if(!css.includes(token))throw new Error(`Missing contrast/menu contract: ${token}`);
}

for(const html of ['index.html','index-en.html','yes-no.html','yes-no-en.html']){
  const source=fs.readFileSync(html,'utf8');
  const matches=[...source.matchAll(/assets\/css\/contrast-hardening\.css\?v=20260719-contrast1/g)];
  if(matches.length!==1)throw new Error(`${html}: expected exactly one contrast-hardening stylesheet binding, found ${matches.length}`);
  const ref=source.indexOf('assets/css/reference-design.css');
  const hard=source.indexOf('assets/css/contrast-hardening.css');
  if(ref<0||hard<ref)throw new Error(`${html}: contrast hardening must load after reference design`);
}

console.log('Full contrast audit passed.');
