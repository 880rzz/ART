import fs from 'node:fs';
import path from 'node:path';

const authority=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;
const errors=[];
for(const token of [
  'STAGE103-PREMIUM-FOOTER:START',
  'grid-template-columns:minmax(15rem,.72fr) minmax(25rem,1.28fr)',
  'radial-gradient(circle at 78% 10%',
  'footer .socials.lang-switch',
  'border-radius:20px!important',
  '@media(max-width:860px)',
  '@media(max-width:620px)'
]) if(!authority.includes(token)) errors.push('premium footer CSS missing '+token);

function channel(value){value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4}
function luminance(hex){hex=hex.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [name,foreground] of [['primary','#f5f5f7'],['secondary','#afc4d9'],['gold','#dcc56b']]){
  const ratio=contrast(foreground,'#202530');
  if(ratio<4.5) errors.push(`${name} contrast is only ${ratio.toFixed(2)}:1`);
}

const skip=new Set(['.git','node_modules','.github']);
const files=[];
function walk(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){if(skip.has(entry.name))continue;const full=path.join(directory,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.html'))files.push(full)}}
walk('.');
let checked=0;
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  if(!/<footer\b/i.test(html))continue;
  checked++;
  if(!html.includes('homepage-two-tone-authority.css?v='+release)) errors.push(file+': stale premium footer authority token');
  for(const semantic of ['class="flogo"','class="brand"','class="meta"','class="socials lang-switch"','class="footer-social-disclosure"','class="fineprint"','class="banhalmi-ecosystem"']){
    if(!html.includes(semantic)) errors.push(file+': missing footer semantic '+semantic);
  }
}
if(checked<80) errors.push('expected at least 80 footer pages, found '+checked);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Stage 103 premium footer audit passed on ${release}: ${checked} multilingual footers keep their semantics, AA palette, compact desktop grid and responsive single-column composition.`);
