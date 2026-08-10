import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const release='20260810-footer-gold-v85';
const old='20260810-curatorial-disclosures-v84';

const footerFile='assets/css/footer-elegant.css';
let footer=fs.readFileSync(footerFile,'utf8');
if(!footer.includes('STAGE85-FOOTER-LEGAL-GOLD:START')){
  footer += `\n\n/* STAGE85-FOOTER-LEGAL-GOLD:START\n   Keep the legal row on one line on desktop and make the archive gold brighter\n   without sacrificing WCAG AA contrast on any canonical blue surface. */\nbody.apple-archive footer .fineprint{max-width:100%!important}\nbody.apple-archive footer .fineprint a,body.apple-archive footer .consent-reset,body.apple-archive footer .footer-social-disclosure>summary::after{color:#D3B85A!important}\n@media(min-width:720px){\n  body.apple-archive footer .fineprint{white-space:nowrap!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:center!important;gap:.32rem!important}\n  body.apple-archive footer .fineprint a{white-space:nowrap!important}\n}\n@media(max-width:719px){body.apple-archive footer .fineprint{white-space:normal!important}}\n/* STAGE85-FOOTER-LEGAL-GOLD:END */\n`;
  fs.writeFileSync(footerFile,footer,'utf8');
}

const authorityFile='assets/css/homepage-two-tone-authority.css';
let authority=fs.readFileSync(authorityFile,'utf8');
if(!authority.includes('STAGE85-BRIGHT-GOLD-AUTHORITY:START')){
  authority += `\n\n/* STAGE85-BRIGHT-GOLD-AUTHORITY:START */\nhtml body.apple-archive.apple-archive.apple-archive{--art-home-gold:#D3B85A!important;--c-gold:#D3B85A!important;--mus-gold:#D3B85A!important}\nhtml body.apple-archive.apple-archive.apple-archive :is(.art-hero-accent,.label,.kicker,.eyebrow,.period-no,.life-stage__index){color:#D3B85A!important}\nhtml body.apple-archive.apple-archive.apple-archive #menu :is(.svc-cta,.active,[aria-current=\"page\"]){border-color:rgba(211,184,90,.55)!important}\n/* STAGE85-BRIGHT-GOLD-AUTHORITY:END */\n`;
  fs.writeFileSync(authorityFile,authority,'utf8');
}

const configFile='data/design-release.json';
const config=JSON.parse(fs.readFileSync(configFile,'utf8'));
config.release=release;
config.note='Stage 85 footer/legal readability and brighter WCAG-safe gold authority across canonical blue surfaces.';
fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n','utf8');
execFileSync(process.execPath,['scripts/bump-editorial-release-cache.mjs'],{stdio:'inherit'});

// Update non-HTML cache references/tests that still name the previous release.
const skip=new Set(['.git','node_modules']);
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(/\.(css|js|mjs|json|md|txt)$/i.test(e.name)){const s=fs.readFileSync(full,'utf8');if(s.includes(old))fs.writeFileSync(full,s.split(old).join(release),'utf8');}}}
walk('.');

// Recompute the canonical asset digest after the actual CSS/JS changes.
const hash=createHash('sha256');
const cssDir='assets/css';for(const f of fs.readdirSync(cssDir).filter(x=>x.endsWith('.css')).sort())hash.update(fs.readFileSync(path.join(cssDir,f)));
const jsDir='assets/js';for(const f of fs.readdirSync(jsDir).filter(x=>x.endsWith('.js')).sort())hash.update(fs.readFileSync(path.join(jsDir,f)));
const videoDir='assets/video';for(const f of fs.readdirSync(videoDir).filter(x=>x.endsWith('.mp4')).sort())hash.update(fs.readFileSync(path.join(videoDir,f)));
config.release=release;config.assetDigest=hash.digest('hex').slice(0,16);config.note='Stage 85 footer/legal readability and brighter WCAG-safe gold authority across canonical blue surfaces.';
fs.writeFileSync(configFile,JSON.stringify(config,null,2)+'\n','utf8');

const test='tests/audit-footer-gold-stage85.mjs';
fs.writeFileSync(test,`import fs from 'node:fs';\nconst footer=fs.readFileSync('assets/css/footer-elegant.css','utf8'),authority=fs.readFileSync('assets/css/homepage-two-tone-authority.css','utf8'),release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;const errors=[];\nfor(const t of ['STAGE85-FOOTER-LEGAL-GOLD:START','white-space:nowrap!important','color:#D3B85A!important'])if(!footer.includes(t))errors.push('footer missing '+t);\nfor(const t of ['STAGE85-BRIGHT-GOLD-AUTHORITY:START','--art-home-gold:#D3B85A!important','--c-gold:#D3B85A!important'])if(!authority.includes(t))errors.push('authority missing '+t);\nif(release!=='20260810-footer-gold-v85')errors.push('unexpected release '+release);\nfunction ch(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}function lum(h){h=h.replace('#','');const a=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return .2126*ch(a[0])+.7152*ch(a[1])+.0722*ch(a[2])}function cr(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}\nfor(const [name,fg] of [['primary','#F5F5F7'],['secondary','#AFC4D9'],['gold','#D3B85A']])for(const bg of ['#202530','#29303F','#2D3444']){const r=cr(fg,bg);if(r<4.5)errors.push(name+' '+r.toFixed(2)+' on '+bg);else console.log(name+' / '+bg+': '+r.toFixed(2)+':1')}\nif(errors.length){console.error(errors.join('\\n'));process.exit(1)}console.log('Stage 85 passed: footer legal links stay on one desktop row and all canonical text/gold combinations remain WCAG AA.');\n`,'utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));if(!pkg.scripts.test.includes('audit-footer-gold-stage85.mjs'))pkg.scripts.test+=' && node tests/audit-footer-gold-stage85.mjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
console.log('Stage 85 applied with digest '+config.assetDigest);
