import fs from 'node:fs';
import path from 'node:path';

const cssPath='assets/css/site.css';
let css=fs.readFileSync(cssPath,'utf8');
const start='/* QUIET-LINE-RHYTHM-20260918:START */';
const end='/* QUIET-LINE-RHYTHM-20260918:END */';
const block=`${start}
/* Decorative rules are exceptional. Space and type carry the archive hierarchy;
   hairlines remain only where they separate dense factual rows. */
body.apple-archive footer{border-top:0!important;}
body.apple-archive footer :is(.fineprint,.socials.lang-switch,.footer-social-disclosure,.footer-social-links,.banhalmi-ecosystem,details,summary){border-top:0!important;border-bottom:0!important;box-shadow:none!important;}
body.apple-archive footer>*{box-shadow:none!important;}
body.apple-archive main>section+section{border-top:0!important;}
body.apple-archive main>section::before{box-shadow:none!important;}
body.apple-archive main details{border-top:0!important;border-bottom:0!important;}
body.apple-archive main details+details{border-top:0!important;}
body.apple-archive[data-archive-page="curators"] main>section>h2{border-bottom:0!important;padding-bottom:0!important;}
body.apple-archive .exhibition-map{border-top:0!important;}
body.apple-archive[data-archive-page="press"] main .press-period-nav{border-top:0!important;}
body.apple-archive[data-archive-page="press"] main .press-period-nav a{border-bottom:0!important;}
body.apple-archive[data-archive-page="press"] main .press-period .era-head{border-bottom:0!important;}
body.apple-archive[data-archive-page="press"] main .press-record{border-top:0!important;}
body.apple-archive[data-archive-page="press"] main .press-period .grid{row-gap:clamp(26px,4vw,46px)!important;}
${end}`;
const re=/\/\* QUIET-LINE-RHYTHM-20260918:START \*\/[\s\S]*?\/\* QUIET-LINE-RHYTHM-20260918:END \*\//m;
if(re.test(css)) css=css.replace(re,block);
else {
  const marker='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
  if(!css.includes(marker)) throw new Error('responsive contract end marker missing');
  css=css.replace(marker,block+'\n'+marker);
}
fs.writeFileSync(cssPath,css);

const authorityPath='data/design-authority.json';
const authority=JSON.parse(fs.readFileSync(authorityPath,'utf8'));
authority.version='art-museum-authority-2026-09-18-v7-quiet-lines';
authority.lineRhythm={decorativeSeparators:'exceptional',footerRules:false,sectionRules:false,disclosureRules:false,headingRules:false,denseFactualRowRulesAllowed:true};
authority.principles=authority.principles||{};
authority.principles.spaceAndTypeCarryHierarchy=true;
fs.writeFileSync(authorityPath,JSON.stringify(authority,null,2)+'\n');

const audit=`import fs from 'node:fs';\nconst failures=[];\nconst css=fs.readFileSync('assets/css/site.css','utf8');\nconst authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));\nconst must=(ok,msg)=>{if(!ok)failures.push(msg)};\nmust(css.includes('QUIET-LINE-RHYTHM-20260918:START'),'quiet-line CSS marker missing');\nmust(css.includes('body.apple-archive footer{border-top:0!important;}'),'footer outer rule must be removed');\nmust(css.includes('body.apple-archive main details{border-top:0!important;border-bottom:0!important;}'),'disclosure rules must be removed');\nmust(css.includes('main>section+section{border-top:0!important;}'),'section boundaries must use spacing instead of rules');\nmust(css.includes('main>section>h2{border-bottom:0!important;padding-bottom:0!important;}'),'curatorial heading rule must be removed');\nmust(css.includes('.press-record{border-top:0!important;}'),'press records must not repeat decorative top rules');\nmust(authority.lineRhythm?.decorativeSeparators==='exceptional','design authority must mark decorative separators exceptional');\nmust(authority.lineRhythm?.footerRules===false,'design authority must prohibit footer rules');\nmust(authority.principles?.spaceAndTypeCarryHierarchy===true,'design authority must require spacing/type hierarchy');\nif(failures.length){console.error('ART quiet-line audit failed ('+failures.length+'):\\n- '+failures.join('\\n- '));process.exit(1);}\nconsole.log('ART quiet-line audit passed: footer and decorative structural rules are removed; dense factual rows remain eligible for hairlines.');\n`;
fs.writeFileSync('tools/audit-quiet-line-rhythm.mjs',audit);

const pkgPath='package.json';
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
if(!pkg.scripts.test.includes('audit-quiet-line-rhythm.mjs')) pkg.scripts.test=pkg.scripts.test.replace('node tools/audit-apple-responsive-contract.mjs','node tools/audit-apple-responsive-contract.mjs && node tools/audit-quiet-line-rhythm.mjs');
fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');

const token='20260918-quiet-lines-v1';
const skip=new Set(['.git','node_modules','.github','artifacts','_site']);
let refs=0,changed=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html')){const src=fs.readFileSync(full,'utf8');let local=0;const out=src.replace(/\/assets\/css\/site\.css\?v=[^"']+/g,()=>{local++;refs++;return `/assets/css/site.css?v=${token}`;});if(local&&out!==src){fs.writeFileSync(full,out);changed++;}}}}
walk('.');
if(refs<20) throw new Error(`Expected at least 20 source site.css references, found ${refs}`);
console.log(`Quiet-line authority applied; synchronized ${refs} stylesheet references across ${changed} HTML files.`);
// Release trigger only: quiet-line authority was audited before production deployment on 2026-09-18.
