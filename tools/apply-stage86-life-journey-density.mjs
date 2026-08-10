import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const pages=[
  ['index.html','Explore the 9-stage career arc'],
  ['curators.html','Explore the 9-stage career arc'],
  ['hu/index.html','Az életmű 9 szakasza'],
  ['hu/curators.html','Az életmű 9 szakasza'],
  ['de-at/index.html','Die 9 Etappen des Werks'],
  ['de-at/curators.html','Die 9 Etappen des Werks']
];
for(const [file,label] of pages){
  let html=fs.readFileSync(file,'utf8');
  const start=html.indexOf('<!-- LIFE-JOURNEY:START -->');
  const end=html.indexOf('<!-- LIFE-JOURNEY:END -->');
  if(start<0||end<start) throw new Error(file+': life journey markers missing');
  let block=html.slice(start,end);
  if(block.includes('class="life-journey-disclosure"')) continue;
  const stagesAt=block.indexOf('<div class="life-journey__stages">');
  if(stagesAt<0) throw new Error(file+': life journey stages wrapper missing');
  const stagesAndTail=block.slice(stagesAt);
  const tailMatch=stagesAndTail.match(/([\s\S]*)(<\/div>\s*<\/section>\s*)$/);
  if(!tailMatch) throw new Error(file+': tail split failed');
  const prefix=block.slice(0,stagesAt);
  const replacement=prefix+`<details class="life-journey-disclosure"><summary><span>${label}</span></summary>\n`+tailMatch[1]+`</details>\n`+tailMatch[2];
  html=html.slice(0,start)+replacement+html.slice(end);
  fs.writeFileSync(file,html,'utf8');
}

const cssFile='assets/css/homepage-two-tone-authority.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('STAGE86-LIFE-JOURNEY-DISCLOSURE:START')){
css += `\n\n/* STAGE86-LIFE-JOURNEY-DISCLOSURE:START\n   The nine-stage career chronology remains fully present in source and search,\n   but no longer occupies several screens before the reader asks for it. */\nhtml body.apple-archive.apple-archive.apple-archive .life-journey-disclosure{margin-top:clamp(1.5rem,3vw,2.5rem)!important;border:0!important;border-top:1px solid rgba(175,196,217,.18)!important;border-bottom:1px solid rgba(175,196,217,.18)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}\nhtml body.apple-archive.apple-archive.apple-archive .life-journey-disclosure>summary{min-height:3.8rem;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;padding:1rem 0!important;list-style:none!important;cursor:pointer!important;color:#F5F5F7!important;font-size:clamp(1rem,1.6vw,1.18rem)!important;font-weight:650!important;letter-spacing:-.012em!important}\nhtml body.apple-archive.apple-archive.apple-archive .life-journey-disclosure>summary::-webkit-details-marker{display:none!important}\nhtml body.apple-archive.apple-archive.apple-archive .life-journey-disclosure>summary::after{content:'+';color:#D3B85A!important;font-size:1.35rem;font-weight:400;line-height:1}\nhtml body.apple-archive.apple-archive.apple-archive .life-journey-disclosure[open]>summary::after{content:'−'}\nhtml body.apple-archive.apple-archive.apple-archive .life-journey-disclosure>.life-journey__stages{padding-top:clamp(1.2rem,2vw,1.8rem)!important}\n/* STAGE86-LIFE-JOURNEY-DISCLOSURE:END */\n`;
fs.writeFileSync(cssFile,css,'utf8');
}

const configFile='data/design-release.json';
const release='20260810-life-journey-v86';
const config=JSON.parse(fs.readFileSync(configFile,'utf8'));
config.release=release;config.note='Stage 86 reduces simultaneous life-journey density while preserving all nine stages and their evidence in EN/HU/DE-AT.';
fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n');

// footer-elegant.css imports palette-blue-final.css directly; keep that nested
// CSS dependency on the same release before the page-level cache propagation.
const footerFile='assets/css/footer-elegant.css';
let footer=fs.readFileSync(footerFile,'utf8');
footer=footer.replace(/palette-blue-final\.css\?v=[^')"]+/g,`palette-blue-final.css?v=${release}`);
fs.writeFileSync(footerFile,footer,'utf8');
execFileSync(process.execPath,['scripts/bump-editorial-release-cache.mjs'],{stdio:'inherit'});

const hash=createHash('sha256');
for(const f of fs.readdirSync('assets/css').filter(x=>x.endsWith('.css')).sort())hash.update(fs.readFileSync(path.join('assets/css',f)));
for(const f of fs.readdirSync('assets/js').filter(x=>x.endsWith('.js')).sort())hash.update(fs.readFileSync(path.join('assets/js',f)));
for(const f of fs.readdirSync('assets/video').filter(x=>x.endsWith('.mp4')).sort())hash.update(fs.readFileSync(path.join('assets/video',f)));
config.assetDigest=hash.digest('hex').slice(0,16);fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n');

const testFile='tests/audit-life-journey-density-stage86.mjs';
fs.writeFileSync(testFile,`import fs from 'node:fs';\nconst pages=[['index.html','Explore the 9-stage career arc'],['curators.html','Explore the 9-stage career arc'],['hu/index.html','Az életmű 9 szakasza'],['hu/curators.html','Az életmű 9 szakasza'],['de-at/index.html','Die 9 Etappen des Werks'],['de-at/curators.html','Die 9 Etappen des Werks']];const errors=[];\nfor(const [file,label] of pages){const html=fs.readFileSync(file,'utf8');const s=html.indexOf('<!-- LIFE-JOURNEY:START -->'),e=html.indexOf('<!-- LIFE-JOURNEY:END -->'),block=html.slice(s,e);if(s<0||e<s)errors.push(file+': markers missing');if(!block.includes('<details class=\"life-journey-disclosure\">'))errors.push(file+': disclosure missing');if(!block.includes('<summary><span>'+label+'</span></summary>'))errors.push(file+': localized summary missing');if(/<details class=\"life-journey-disclosure\"[^>]*\sopen(?:\s|>)/i.test(block))errors.push(file+': disclosure must default closed');const stages=(block.match(/class=\"life-stage\"/g)||[]).length;if(stages!==9)errors.push(file+': expected 9 preserved stages, found '+stages);}\nconst css=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8');for(const t of ['STAGE86-LIFE-JOURNEY-DISCLOSURE:START','.life-journey-disclosure>summary','color:#D3B85A!important'])if(!css.includes(t))errors.push('CSS missing '+t);const release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;if(release!=='20260810-life-journey-v86')errors.push('unexpected release '+release);const footer=fs.readFileSync('assets/css/footer-elegant.css','utf8');if(!footer.includes('palette-blue-final.css?v='+release))errors.push('footer palette import stale');if(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Stage 86 passed: all six EN/HU/DE life-journey views preserve nine stages behind one default-closed editorial disclosure.');\n`,'utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));if(!pkg.scripts.test.includes('audit-life-journey-density-stage86.mjs'))pkg.scripts.test+=' && node tests/audit-life-journey-density-stage86.mjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
console.log('Stage 86 applied with digest '+config.assetDigest);
