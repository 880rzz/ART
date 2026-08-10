import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

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
  const replacement=`<section class="wrap narrow rule usage-section">\n  <h2>${heading}</h2>\n  ${m[2]}\n  <details class="usage-disclosure">\n    <summary><span>${summary}</span></summary>\n    ${m[1]}\n  </details>\n</section>`;
  html=html.replace(rx,replacement);
  fs.writeFileSync(file,html,'utf8');
}

const cssFile='assets/css/homepage-two-tone-authority.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('STAGE83-EUFORIA-SOURCE-DISCLOSURE:START')){
  css += `\n\n/* STAGE83-EUFORIA-SOURCE-DISCLOSURE:START\n   Keep the public-use evidence complete without presenting ten outbound links\n   at once. The explanatory paragraph stays visible; the source catalogue is a\n   quiet native disclosure with no card chrome. */\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive .usage-section .lead{margin-bottom:clamp(1.25rem,2vw,1.8rem)!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure{\n  margin:0!important;padding:0!important;background:transparent!important;border:0!important;\n  border-top:1px solid rgba(175,196,217,.18)!important;border-bottom:1px solid rgba(175,196,217,.18)!important;\n  border-radius:0!important;box-shadow:none!important;\n}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>summary{\n  list-style:none!important;cursor:pointer!important;padding:1rem 0!important;color:var(--art-home-ink)!important;\n  font-weight:600!important;letter-spacing:-.015em!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;\n}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>summary::-webkit-details-marker{display:none!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>summary::after{content:"+";font-size:1.35rem;font-weight:400;color:var(--art-home-gold);line-height:1}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure[open]>summary::after{content:"−"}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>.linklist{margin:0!important;padding:0 0 1.15rem 1.2rem!important}\nhtml body.apple-archive.apple-archive.apple-archive.apple-archive details.usage-disclosure>.linklist li{margin:.52rem 0!important}\n/* STAGE83-EUFORIA-SOURCE-DISCLOSURE:END */\n`;
  fs.writeFileSync(cssFile,css,'utf8');
}

const testFile='tests/audit-euforia-source-disclosure-stage83.mjs';
fs.writeFileSync(testFile,`import fs from 'node:fs';\nconst pages=[\n  ['exhibitions/euforia.html','Where the picture travelled','10 documented publications'],\n  ['hu/exhibitions/euforia.html','Merre járt a kép','10 dokumentált megjelenés'],\n  ['de-at/exhibitions/euforia.html','Wohin das Bild reiste','10 dokumentierte Veröffentlichungen']\n];\nconst errors=[];\nfor(const [file,heading,summary] of pages){\n  const html=fs.readFileSync(file,'utf8');\n  const h=html.indexOf('<h2>'+heading+'</h2>');\n  const p=html.indexOf('<p class="lead"',h);\n  const d=html.indexOf('<details class="usage-disclosure">',h);\n  const s=html.indexOf('<summary><span>'+summary+'</span></summary>',d);\n  if(h<0||p<h||d<p||s<d)errors.push(file+': simplified usage disclosure order missing');\n  const close=html.indexOf('</details>',d);\n  const block=html.slice(d,close);\n  const count=(block.match(/<li>/g)||[]).length;\n  if(count!==10)errors.push(file+': expected 10 preserved publication entries, found '+count);\n}\nconst css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');\nfor(const token of ['STAGE83-EUFORIA-SOURCE-DISCLOSURE:START','details.usage-disclosure','border-radius:0!important','summary::after'])if(!css.includes(token))errors.push('CSS missing '+token);\nif(errors.length){console.error(errors.join('\\n'));process.exit(1)}\nconsole.log('Stage 83 passed: EUFÓRIA keeps all ten documented publication links in each language while the page presents them as a quiet collapsed disclosure.');\n`,'utf8');

const packageFile='package.json';
const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
if(!pkg.scripts.test.includes('audit-euforia-source-disclosure-stage83.mjs')) pkg.scripts.test += ' && node tests/audit-euforia-source-disclosure-stage83.mjs';
fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n','utf8');

const releaseFile='data/design-release.json';
const release=JSON.parse(fs.readFileSync(releaseFile,'utf8'));
release.release='20260810-euforia-disclosure-v83';
release.assetDigest='b1cb95dfd2f7ff75';
fs.writeFileSync(releaseFile,JSON.stringify(release,null,2)+'\n','utf8');
execFileSync(process.execPath,['scripts/bump-editorial-release-cache.mjs'],{stdio:'inherit'});
console.log('Stage 83 EUFÓRIA disclosure simplification applied.');
