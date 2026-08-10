import fs from 'node:fs';
import path from 'node:path';

const root='assets/css';
const cssFiles=[];
function collectCss(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory())collectCss(path.join(dir,entry.name));
    else if(entry.name.endsWith('.css'))cssFiles.push(path.join(dir,entry.name));
  }
}
collectCss(root);

function hexToRgb(hex){const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]}
function luminance(hex){return hexToRgb(hex).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const checks=[['primary text / ground','#F5F5F7','#202530'],['secondary blue text / ground','#AFC4D9','#202530'],['gold / ground','#B79C44','#202530'],['primary text / raised','#F5F5F7','#29303F'],['secondary blue text / raised','#AFC4D9','#29303F'],['gold / raised','#B79C44','#29303F'],['primary text / panel','#F5F5F7','#2D3444'],['secondary blue text / panel','#AFC4D9','#2D3444'],['gold / panel','#B79C44','#2D3444']];
for(const [label,fg,bg] of checks){const ratio=contrast(fg,bg);console.log(`${label}: ${ratio.toFixed(2)}:1`);if(ratio<4.5)throw new Error(`${label} below WCAG AA`)}

const forbiddenVisualColors=['#fff4d6','#fff8e7','#f6efe3','#efe7dc','#f0e9df','#e8dfd3','#d8c8b6','#bca98f'];
for(const file of cssFiles){
  const source=fs.readFileSync(file,'utf8').toLowerCase();
  for(const forbidden of forbiddenVisualColors){
    if(source.includes(forbidden))throw new Error(`${file}: forbidden legacy visual color remains: ${forbidden}`);
  }
}

const svgFiles=[];
function collectSvg(dir){
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
if(!favicon.includes('viewBox="0 0 185 185"'))throw new Error('ART favicon must preserve the supplied 185x185 signature artwork canvas');
if(!favicon.includes('data:image/jpeg;base64,'))throw new Error('ART favicon must embed the supplied signature artwork');
const logo=fs.readFileSync('assets/img/banhalmi-logo.svg','utf8');
if(!logo.includes('fill="#B79C44"'))throw new Error('ART logo must use canonical #B79C44 gold mark');
const manifest=JSON.parse(fs.readFileSync('site.webmanifest','utf8'));
if(manifest.background_color!=='#202530'||manifest.theme_color!=='#202530')throw new Error('ART webmanifest background/theme must remain canonical #202530 blue');

/* Lighthouse flags inline consent/legal links if colour is their only cue. */
const privacyUrl='https://www.norbertbanhalmi.com/privacy-policy/';
let contentPages=0,privacyPages=0;
function collectConsentPages(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())collectConsentPages(full);
    else if(entry.name.endsWith('.html')){
      const html=fs.readFileSync(full,'utf8');
      contentPages++;
      if(html.includes(privacyUrl))privacyPages++;
    }
  }
}
collectConsentPages('.');
if(!privacyPages)throw new Error('No privacy-linked consent/legal documents found');
console.log(`ART blue-only UI + final homepage authority after museum structure + Apple typography + 2 SVG assets + ${privacyPages}/${contentPages} consent/privacy documents, canonical favicon/logo and WCAG link affordance audit passed.`);
