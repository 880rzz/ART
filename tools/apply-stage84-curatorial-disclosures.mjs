import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const releaseToken='20260810-curatorial-disclosures-v84';
const pages=[
  {file:'curators.html', labels:{'curatorial-periods':'Explore the five periods','presence-anatomy':'Explore the nine dimensions','creative-method':'Explore the eight-step method'}},
  {file:'hu/curators.html', labels:{'curatorial-periods':'Az öt korszak megnyitása','presence-anatomy':'A kilenc dimenzió megnyitása','creative-method':'A nyolclépéses módszer megnyitása'}},
  {file:'de-at/curators.html', labels:{'curatorial-periods':'Die fünf Perioden öffnen','presence-anatomy':'Die neun Dimensionen öffnen','creative-method':'Die acht Schritte öffnen'}}
];

for(const {file,labels} of pages){
  let html=fs.readFileSync(file,'utf8');
  for(const [id,label] of Object.entries(labels)){
    const sectionStart=html.indexOf(`<section id="${id}"`);
    if(sectionStart<0) throw new Error(`${file}: section ${id} missing`);
    const sectionEnd=html.indexOf('</section>',sectionStart);
    if(sectionEnd<0) throw new Error(`${file}: section ${id} is not closed`);
    let segment=html.slice(sectionStart,sectionEnd+10);
    const gridStart=segment.indexOf('<div class="curatorial-periods__grid">');
    if(gridStart<0) throw new Error(`${file}: grid missing in ${id}`);
    const gridClose=segment.indexOf('</div>',gridStart);
    if(gridClose<0) throw new Error(`${file}: grid close missing in ${id}`);
    const grid=segment.slice(gridStart,gridClose+6);
    if(grid.includes('curatorial-grid-disclosure')) continue;
    const wrapped=`<details class="curatorial-grid-disclosure"><summary><span>${label}</span></summary>${grid}</details>`;
    segment=segment.slice(0,gridStart)+wrapped+segment.slice(gridClose+6);
    html=html.slice(0,sectionStart)+segment+html.slice(sectionEnd+10);
  }
  fs.writeFileSync(file,html,'utf8');
}

const cssFile='assets/css/homepage-two-tone-authority.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('STAGE84-CURATORIAL-GRID-DISCLOSURES:START')){
  css += `\n\n/* STAGE84-CURATORIAL-GRID-DISCLOSURES:START\n   Curatorial thesis pages keep their full research corpus while reducing the\n   initial visual load. Intros stay visible; supporting grids open on demand. */\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.curatorial-grid-disclosure{margin:clamp(1.1rem,2vw,1.7rem) 0 0!important;padding:0!important;background:transparent!important;border:0!important;border-top:1px solid rgba(175,196,217,.18)!important;border-bottom:1px solid rgba(175,196,217,.18)!important;border-radius:0!important;box-shadow:none!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.curatorial-grid-disclosure>summary{list-style:none!important;cursor:pointer!important;padding:1.05rem 0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;color:var(--art-home-ink)!important;font-weight:600!important;letter-spacing:-.015em!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.curatorial-grid-disclosure>summary::-webkit-details-marker{display:none!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.curatorial-grid-disclosure>summary::after{content:"+";font-size:1.35rem;font-weight:400;color:var(--art-home-gold);line-height:1}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.curatorial-grid-disclosure[open]>summary::after{content:"−"}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.curatorial-grid-disclosure>.curatorial-periods__grid{margin-top:.25rem!important;padding-bottom:clamp(1.2rem,2vw,1.8rem)!important}\n/* STAGE84-CURATORIAL-GRID-DISCLOSURES:END */\n`;
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

const testFile='tests/audit-curatorial-disclosures-stage84.mjs';
fs.writeFileSync(testFile,`import fs from 'node:fs';\nconst cases=[['curators.html',['Explore the five periods','Explore the nine dimensions','Explore the eight-step method']],['hu/curators.html',['Az öt korszak megnyitása','A kilenc dimenzió megnyitása','A nyolclépéses módszer megnyitása']],['de-at/curators.html',['Die fünf Perioden öffnen','Die neun Dimensionen öffnen','Die acht Schritte öffnen']]];const expected=[5,9,8],errors=[];for(const [file,labels] of cases){const html=fs.readFileSync(file,'utf8');const blocks=[...html.matchAll(/<details class="curatorial-grid-disclosure">([\\s\\S]*?)<\\/details>/g)];if(blocks.length!==3)errors.push(file+': expected 3 curatorial disclosures, found '+blocks.length);blocks.forEach((m,i)=>{if(/<details[^>]*\\sopen(?:\\s|>)/i.test(m[0]))errors.push(file+': disclosure '+(i+1)+' must default closed');if(!m[0].includes('<summary><span>'+labels[i]+'</span></summary>'))errors.push(file+': disclosure '+(i+1)+' summary mismatch');const count=(m[0].match(/<article class="curatorial-period"/g)||[]).length;if(count!==expected[i])errors.push(file+': disclosure '+(i+1)+' expected '+expected[i]+' records, found '+count);});}const css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');for(const token of ['STAGE84-CURATORIAL-GRID-DISCLOSURES:START','details.curatorial-grid-disclosure','border-radius:0!important','summary::after'])if(!css.includes(token))errors.push('CSS missing '+token);if(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Stage 84 passed: all three curator dossiers keep 5 + 9 + 8 research records behind three default-closed, low-chrome disclosures.');\n`,'utf8');

const packageFile='package.json';
const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
if(!pkg.scripts.test.includes('audit-curatorial-disclosures-stage84.mjs')) pkg.scripts.test += ' && node tests/audit-curatorial-disclosures-stage84.mjs';
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
console.log(`Stage 84 curatorial simplification applied with digest ${release.assetDigest}.`);
