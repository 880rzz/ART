import fs from 'node:fs';
import path from 'node:path';

function channel(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function lum(hex){const h=hex.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function requireRatio(name,fg,bg,min){const ratio=contrast(fg,bg);if(ratio<min)throw new Error(`${name}: ${ratio.toFixed(2)}:1 < ${min}:1`);console.log(`${name}: ${ratio.toFixed(2)}:1`)}

const base=fs.readFileSync('assets/css/page-base.css','utf8');
const museum=fs.readFileSync('assets/css/museum-editorial.css','utf8');
const authority=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');
const apple=fs.readFileSync('assets/css/apple-editorial-system.css','utf8');
const footer=fs.readFileSync('assets/css/footer-elegant.css','utf8');
const palette=fs.readFileSync('assets/css/palette-blue-final.css','utf8');
const config=JSON.parse(fs.readFileSync('data/design-release.json','utf8'));

for(const token of ['--c-ground:#202530','--c-raised:#29303F','--c-panel:#2D3444']) if(!base.includes(token)) throw new Error(`Missing ART blue palette token: ${token}`);

/* Museum remains a compatibility layer for archive component structure, but
 * the homepage authority must be a separate stylesheet after it. Story-dialog
 * scrolling is intentionally owned and audited by responsive-header-system. */
for(const token of ['.record-period','STAGE39-UI-DESIGN-CONTRACT:START']) if(!museum.includes(token)) throw new Error(`Museum structural compatibility missing: ${token}`);
for(const token of [
  '--art-home-dark:#202530',
  '--art-home-raised:#29303F',
  '--art-home-light:#484F60',
  '--art-home-soft:#AFC4D9',
  '--art-home-gold:#DCC56B',
  '--art-home-atmosphere:',
  '--art-home-footer:',
  'header.hero',
  'header.sub',
  '.curatorial-hero',
  'main>section:nth-of-type(even)',
  'main>section::before',
  'main>.statement::before',
  'footer{',
  'font-size:clamp(16px,.18vw + 15px,18px)!important',
  'font-weight:600!important',
  'font-size:clamp(2.55rem,5vw,5.1rem)!important',
  'font-size:clamp(2rem,3.4vw,3.45rem)!important'
]) if(!authority.includes(token)) throw new Error(`Homepage final visual authority missing: ${token}`);
for(const legacy of ['#0f0f0f','#171717','#211f1b']) if(authority.toLowerCase().includes(legacy)) throw new Error(`Homepage final authority contains retired neutral surface: ${legacy}`);
for(const token of [
  'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue",Arial,sans-serif!important',
  'font-weight:600!important',
  'body.apple-archive h1{font-size:clamp(2.55rem,5vw,5.1rem)!important',
  'body.apple-archive h2{font-size:clamp(2rem,3.4vw,3.45rem)!important'
]) if(!apple.includes(token)) throw new Error(`Homepage Apple typography contract missing: ${token}`);

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
  'background:linear-gradient(145deg,#484F60 0%,#30384A 58%,#202530 100%)!important',
  'html body.apple-archive.apple-archive #consent a',
  'text-decoration-line:underline!important',
  'text-decoration-thickness:.08em!important',
  'text-underline-offset:.18em!important',
  'Stage 69 — eliminate the last neutral/grey subpage surfaces',
  'html body.apple-archive.apple-archive[data-archive-page="press"]',
  'html body.apple-archive.apple-archive[data-archive-page="community"]',
  'html body.apple-archive.apple-archive[data-archive-page="writing"]',
  '--press-paper:#202530!important',
  '--press-warm:#29303F!important',
  '--press-muted:#AFC4D9!important',
  'STAGE70-HOMEPAGE-PALETTE-AUTHORITY:START',
  'html body.apple-archive.apple-archive.apple-archive',
  'main>section:nth-of-type(even)',
  '.curatorial-section[data-curatorial-surface="2"]'
]) if(!palette.includes(token)) throw new Error(`ART final blue/a11y control contract missing: ${token}`);

const expectedPaletteImport=`@import url('./palette-blue-final.css?v=${config.release}')`;
if(!footer.includes(expectedPaletteImport)) throw new Error(`ART blue-only palette override must use active release token ${config.release} through the shared footer stylesheet`);
for(const forbidden of ['#080706','#aaa8a4']) if(footer.toLowerCase().includes(forbidden)) throw new Error(`Forbidden black/neutral-gray footer color remains: ${forbidden}`);

/* Curatorial page identity must exist in source. Relying only on deferred JS
 * makes palette correctness timing/cache dependent and was the root cause of
 * the brown surface regression visible on returning browsers. */
for(const languagePrefix of ['', 'hu/', 'de-at/']){
  for(const page of ['curators','press','community','writing']){
    const file=`${languagePrefix}${page}.html`;
    const html=fs.readFileSync(file,'utf8');
    if(!new RegExp(`<body\\b[^>]*data-archive-page=["']${page}["']`,'i').test(html)){
      throw new Error(`${file}: source-level data-archive-page=${page} is missing`);
    }
  }
}

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
if(!favicon.includes('viewBox="0 0 185 185"'))throw new Error('ART favicon must preserve the supplied 185x185 signature artwork canvas');
if(!favicon.includes('data:image/jpeg;base64,'))throw new Error('ART favicon must embed the supplied signature artwork');
const logo=fs.readFileSync('assets/img/banhalmi-logo.svg','utf8');
if(!logo.includes('fill="#DCC56B"'))throw new Error('ART logo must use canonical #DCC56B gold mark');
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
      if(!/<html\b/i.test(html))continue;
      contentPages++;
      if(html.includes(privacyUrl)){
        privacyPages++;
        if(!/id=["']consent["']/i.test(html))throw new Error(`${full}: privacy link exists outside the protected #consent component`);
      }
    }
  }
}
collectConsentPages('.');
if(privacyPages===0)throw new Error('ART consent accessibility guard found no canonical privacy links to protect');

requireRatio('primary text / ground','#F5F5F7','#202530',4.5);
requireRatio('secondary blue text / ground','#AFC4D9','#202530',4.5);
requireRatio('gold / ground','#DCC56B','#202530',4.5);
requireRatio('primary text / raised','#F5F5F7','#29303F',4.5);
requireRatio('secondary blue text / raised','#AFC4D9','#29303F',4.5);
requireRatio('gold / raised','#DCC56B','#29303F',4.5);
requireRatio('primary text / panel','#F5F5F7','#484F60',4.5);
requireRatio('secondary blue text / panel','#AFC4D9','#484F60',4.5);
requireRatio('gold / panel','#DCC56B','#484F60',4.5);

for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(file,'utf8');
  const accents=(html.match(/class="title-accent title-accent--block"/g)||[]).length;
  if(accents!==1) throw new Error(`${file}: expected exactly one sparse ART title accent, found ${accents}`);
  const museumToken=`museum-editorial.css?v=${config.release}`;
  const authorityToken=`homepage-two-tone-authority.css?v=${config.release}`;
  const museumAt=html.indexOf(museumToken);
  const authorityAt=html.indexOf(authorityToken);
  if(museumAt<0) throw new Error(`${file}: active museum structural token ${config.release} missing`);
  if(authorityAt<0) throw new Error(`${file}: active homepage authority token ${config.release} missing`);
  if(authorityAt<museumAt) throw new Error(`${file}: museum layer still loads after homepage authority`);
}
console.log(`ART blue-only UI + final homepage authority after museum structure + Apple typography + ${svgFiles.length} SVG assets + ${privacyPages}/${contentPages} consent/privacy documents, supplied signature favicon/canonical logo and WCAG link affordance audit passed on ${config.release}.`);
