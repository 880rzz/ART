import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const releaseToken='20260810-euforia-disclosure-v83';
const pages=[
  {file:'exhibitions/euforia.html', heading:'Where the picture travelled', summary:'10 documented publications'},
  {file:'hu/exhibitions/euforia.html', heading:'Merre járt a kép', summary:'10 dokumentált megjelenés'},
  {file:'de-at/exhibitions/euforia.html', heading:'Wohin das Bild reiste', summary:'10 dokumentierte Veröffentlichungen'}
];

for(const {file,heading,summary} of pages){
  let html=fs.readFileSync(file,'utf8');
  const escaped=heading.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const rx=new RegExp(`<section class="wrap narrow rule">\\s*<h2>${escaped}<\\/h2>\\s*(<ul class="linklist">[\\s\\S]*?<\\/ul>)\\s*(<p class="lead"[^>]*>[\\s\\S]*?<\\/p>)\\s*<\\/section>`);
  const m=html.match(rx);
  if(!m) throw new Error(`${file}: usage/source section not found`);
  html=html.replace(rx,`<section class="wrap narrow rule usage-section">\n  <h2>${heading}</h2>\n  ${m[2]}\n  <details class="usage-disclosure">\n    <summary><span>${summary}</span></summary>\n    ${m[1]}\n  </details>\n</section>`);
  fs.writeFileSync(file,html,'utf8');
}

const cssFile='assets/css/homepage-two-tone-authority.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('STAGE83-EUFORIA-SOURCE-DISCLOSURE:START')){
  css += `\n\n/* STAGE83-EUFORIA-SOURCE-DISCLOSURE:START\n   Keep public-use evidence complete without presenting ten outbound links at once. */\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive .usage-section .lead{margin-bottom:clamp(1.25rem,2vw,1.8rem)!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure{margin:0!important;padding:0!important;background:transparent!important;border:0!important;border-top:1px solid rgba(175,196,217,.18)!important;border-bottom:1px solid rgba(175,196,217,.18)!important;border-radius:0!important;box-shadow:none!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>summary{list-style:none!important;cursor:pointer!important;padding:1rem 0!important;color:var(--art-home-ink)!important;font-weight:600!important;letter-spacing:-.015em!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>summary::-webkit-details-marker{display:none!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>summary::after{content:"+";font-size:1.35rem;font-weight:400;color:var(--art-home-gold);line-height:1}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure[open]>summary::after{content:"−"}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>.linklist{margin:0!important;padding:0 0 1.15rem 1.2rem!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>.linklist li{margin:.52rem 0!important}\n/* STAGE83-EUFORIA-SOURCE-DISCLOSURE:END */\n`;
  fs.writeFileSync(cssFile,css,'utf8');
}

const footerFile='assets/css/footer-elegant.css';
let footer=fs.readFileSync(footerFile,'utf8');
footer=footer.replace(/palette-blue-final\.css\?v=[^')"]+/g,`palette-blue-final.css?v=${releaseToken}`);
fs.writeFileSync(footerFile,footer,'utf8');

const runtimeFile='assets/js/responsive-header-system.js';
let runtime=fs.readFileSync(runtimeFile,'utf8');
runtime=runtime.replace(/archive-content-flow\.css\?v=[^'";]+/g,`archive-content-flow.css?v=${releaseToken}`);
runtime=runtime.replace(/record-editorial-system\.css\?v=[^'";]+/g,`record-editorial-system.css?v=${releaseToken}`);
fs.writeFileSync(runtimeFile,runtime,'utf8');

const testFile='tests/audit-euforia-source-disclosure-stage83.mjs';
fs.writeFileSync(testFile,`import fs from 'node:fs';\nconst pages=[['exhibitions/euforia.html','Where the picture travelled','10 documented publications'],['hu/exhibitions/euforia.html','Merre járt a kép','10 dokumentált megjelenés'],['de-at/exhibitions/euforia.html','Wohin das Bild reiste','10 dokumentierte Veröffentlichungen']];\nconst errors=[];for(const [file,heading,summary] of pages){const html=fs.readFileSync(file,'utf8');const h=html.indexOf('<h2>'+heading+'</h2>'),p=html.indexOf('<p class="lead"',h),d=html.indexOf('<details class="usage-disclosure">',h),s=html.indexOf('<summary><span>'+summary+'</span></summary>',d);if(h<0||p<h||d<p||s<d)errors.push(file+': simplified usage disclosure order missing');const close=html.indexOf('</details>',d),block=html.slice(d,close),count=(block.match(/<li>/g)||[]).length;if(count!==10)errors.push(file+': expected 10 preserved publication entries, found '+count);}\nconst css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');for(const token of ['STAGE83-EUFORIA-SOURCE-DISCLOSURE:START','details.usage-disclosure','border-radius:0!important','summary::after'])if(!css.includes(token))errors.push('CSS missing '+token);const footer=fs.readFileSync('assets/css/footer-elegant.css','utf8');if(!footer.includes('palette-blue-final.css?v=${releaseToken}'))errors.push('footer palette import is stale');const runtime=fs.readFileSync('assets/js/responsive-header-system.js','utf8');if(!runtime.includes('record-editorial-system.css?v=${releaseToken}'))errors.push('record runtime token is stale');if(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Stage 83 passed: EUFÓRIA preserves all ten documented publication links per language inside a quiet collapsed disclosure.');\n`,'utf8');

const packageFile='package.json';
const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
if(!pkg.scripts.test.includes('audit-euforia-source-disclosure-stage83.mjs')) pkg.scripts.test += ' && node tests/audit-euforia-source-disclosure-stage83.mjs';
fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n','utf8');

const hash=createHash('sha256');
for(const dir of ['assets/css','assets/js','assets/video']){
  const ext=dir.endsWith('video')?'.mp4':dir.endsWith('css')?'.css':'.js';
  for(const name of fs.readdirSync(dir).filter(f=>f.endsWith(ext)).sort()) hash.update(fs.readFileSync(`${dir}/${name}`));
}
const releaseFile='data/design-release.json';
const release=JSON.parse(fs.readFileSync(releaseFile,'utf8'));
release.release=releaseToken;
release.assetDigest=hash.digest('hex').slice(0,16);
fs.writeFileSync(releaseFile,JSON.stringify(release,null,2)+'\n','utf8');
execFileSync(process.execPath,['scripts/bump-editorial-release-cache.mjs'],{stdio:'inherit'});
console.log(`Stage 83 EUFÓRIA simplification applied with digest ${release.assetDigest}.`);
