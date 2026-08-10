import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const oldRelease='20260810-exhibition-families-v78',newRelease='20260810-simplified-authority-v79';
const authorityPath=path.join(root,'assets/css/homepage-two-tone-authority.css');
let authority=await readFile(authorityPath,'utf8');
if(!authority.includes('Stage 79 — visual simplification')) authority+=`

/* Stage 79 — visual simplification
   One final Apple-like authority across every content page: less decorative
   chrome, clearer reading hierarchy and fewer competing visual signals. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main[data-narrative="life-journey"]>header.hero h1{color:#DCE7F1!important}
@supports ((-webkit-background-clip:text) or (background-clip:text)){
html body.apple-archive.apple-archive.apple-archive.apple-archive main[data-narrative="life-journey"]>header.hero h1{background:linear-gradient(102deg,#F5F5F7 0%,#DCE7F1 28%,#AFC4D9 62%,#B79C44 100%)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important}}
html body.apple-archive.apple-archive.apple-archive.apple-archive main[data-narrative="life-journey"]>header.hero .hero-line{display:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.btn,.presence-link),
html body.apple-archive.apple-archive.apple-archive.apple-archive #menu .svc-cta{box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main .btn{border-radius:12px!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main details{box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.facts,.source-list,.record-links,.record-relationships,.project-evidence){box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.facts li,.source-list li){box-shadow:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.meta,.loc,.fineprint,figcaption,.cap){text-shadow:none!important}
html body.apple-archive.apple-archive.apple-archive.apple-archive main section :is(p:not(.label):not(.meta):not(.loc):not(.fineprint),ul:not(.facts),ol){max-width:72ch}
@media(max-width:640px){html body.apple-archive.apple-archive.apple-archive.apple-archive main .btn{border-radius:10px!important}}
`;
await writeFile(authorityPath,authority);
for(const dir of ['assets/css','assets/js'])for(const name of await readdir(path.join(root,dir))){if(!/\.(css|js)$/.test(name))continue;const p=path.join(root,dir,name);let t=await readFile(p,'utf8');t=t.replaceAll(oldRelease,newRelease);await writeFile(p,t)}
const auditPath=path.join(root,'tests/audit-design-ecosystem-stage51.mjs');let audit=await readFile(auditPath,'utf8');if(!audit.includes('Stage 79 — visual simplification')){audit=audit.replace("'width:100vw!important']","'width:100vw!important','Stage 79 — visual simplification','main[data-narrative=\\\"life-journey\\\"]>header.hero h1','main details','backdrop-filter:none!important']");audit=audit.replace("Stage51 passed:","Stage51/79 passed:");await writeFile(auditPath,audit)}
const hash=crypto.createHash('sha256');for(const name of (await readdir(path.join(root,'assets/css'))).filter(f=>f.endsWith('.css')).sort())hash.update(await readFile(path.join(root,'assets/css',name)));for(const name of (await readdir(path.join(root,'assets/js'))).filter(f=>f.endsWith('.js')).sort())hash.update(await readFile(path.join(root,'assets/js',name)));for(const name of (await readdir(path.join(root,'assets/video'))).filter(f=>f.endsWith('.mp4')).sort())hash.update(await readFile(path.join(root,'assets/video',name)));
const releasePath=path.join(root,'data/design-release.json');const release=JSON.parse(await readFile(releasePath,'utf8'));release.release=newRelease;release.note='Stage 79 simplification: explicit blue-to-gold BANHALMI homepage title and lower-chrome buttons, disclosures, metadata and information containers across all EN/HU/DE-AT content pages.';release.assetDigest=hash.digest('hex').slice(0,16);await writeFile(releasePath,JSON.stringify(release,null,2)+'\n');console.log(`Stage 79 prepared: ${newRelease}, digest ${release.assetDigest}.`);
