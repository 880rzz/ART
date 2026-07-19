import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const htmlFiles=['index.html','index-en.html','yes-no.html','yes-no-en.html'];
const required=['assets/css/app.css','assets/css/navigation-upgrade.css','assets/css/mythology-authenticity.css','assets/css/apple-ux-redesign.css','assets/css/ux-hardening.css','assets/js/yes-no.js','assets/js/runtime-enhancements.js','assets/js/mythology-authenticity.js','scripts/random-engine-test.mjs','scripts/mythology-content-test.mjs','scripts/ux-design-test.mjs','scripts/strict-ux-audit.mjs'];
const errors=[];

for(const file of [...htmlFiles,...required]){
  if(!fs.existsSync(path.join(root,file)))errors.push(`Missing file: ${file}`);
}

const runtime=fs.readFileSync(path.join(root,'assets/js/runtime-enhancements.js'),'utf8');
const runtimeNormalizesPageLinks=runtime.includes('removeAttribute("role")')&&runtime.includes('removeAttribute("aria-selected")')&&runtime.includes('tabindex');

for(const file of htmlFiles){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  if(!text.includes('assets/css/reference-design.css?v=20260719-ref1'))errors.push(`${file}: reference design layer is missing`);
  if(!text.includes('assets/css/navigation-upgrade.css?v=20260719-ui3'))errors.push(`${file}: cache-busted navigation stylesheet is not directly bound`);
  if(!text.includes('assets/css/ux-hardening.css?v=20260719-ux1'))errors.push(`${file}: final UX hardening layer is missing`);
  if((file==='index.html'||file==='index-en.html')&&!text.includes('assets/js/runtime-enhancements.js?v=20260719-ux1'))errors.push(`${file}: runtime cache version is stale`);
  if((file==='yes-no.html'||file==='yes-no-en.html')&&!text.includes('assets/js/yes-no.js?v=20260719-ui3'))errors.push(`${file}: yes/no cache version is stale`);
  if(!/<html\b[^>]*lang="(?:hu|en)"/i.test(text))errors.push(`${file}: missing supported lang attribute`);
  if(!/<meta\b[^>]*name="viewport"/i.test(text))errors.push(`${file}: missing viewport meta`);
  if(!/<title>[^<]+<\/title>/i.test(text))errors.push(`${file}: missing title`);
  if(!/<meta\b[^>]*name="description"/i.test(text))errors.push(`${file}: missing description`);
  if(!/<link\b[^>]*rel="canonical"/i.test(text))errors.push(`${file}: missing canonical`);

  const invalidPageLink=/class="[^"]*tab-page-link[^"]*"[^>]*(?:role="tab"|tabindex="-1")/i.test(text);
  if(invalidPageLink&&file.startsWith('yes-no'))errors.push(`${file}: invalid tab semantics on native page link`);
  if(invalidPageLink&&file.startsWith('index')&&!runtimeNormalizesPageLinks)errors.push(`${file}: invalid tab semantics without runtime normalization`);

  for(const match of text.matchAll(/(?:src|href)="(assets\/[^"?#]+)/g)){
    const asset=match[1];
    if(!fs.existsSync(path.join(root,asset)))errors.push(`${file}: missing referenced asset ${asset}`);
  }

  if(file==='index.html'||file==='index-en.html'){
    const appScript=file==='index.html'?'assets/js/app.hu.js':'assets/js/app.en.js';
    const appIndex=text.indexOf(appScript);
    const runtimeIndex=text.indexOf('assets/js/runtime-enhancements.js');
    if(appIndex<0)errors.push(`${file}: application core script missing`);
    if(runtimeIndex<0)errors.push(`${file}: runtime hardening script missing`);
    if(appIndex>=0&&runtimeIndex>=0&&runtimeIndex<appIndex)errors.push(`${file}: runtime hardening loads before application core`);
  }
}

for(const file of ['yes-no.html','yes-no-en.html']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  if(!/application\/ld\+json/i.test(text))errors.push(`${file}: missing JSON-LD`);
  const csp=text.match(/Content-Security-Policy" content="([^"]+)/i)?.[1]||'';
  if(/application\/ld\+json/i.test(text)&&!csp.includes("'unsafe-inline'"))errors.push(`${file}: inline JSON-LD blocked by CSP`);
  for(const id of ['yesNoMenuToggle','yesNoNav','basicStep','basicNext','qaForm','qaQ','qaNeedle','qaStatus','qaResult','qaAgain']){
    if(!text.includes(`id="${id}"`))errors.push(`${file}: missing required id ${id}`);
  }
}

const yesNo=fs.readFileSync(path.join(root,'assets/js/yes-no.js'),'utf8');
if(!yesNo.includes('try{')||!yesNo.includes('catch(error)'))errors.push('yes-no.js: missing runtime error recovery');
if(/Math\.random\s*\(/.test(yesNo))errors.push('yes-no.js: insecure Math.random fallback present');
if(!yesNo.includes("throw new Error('secure-random-unavailable')"))errors.push('yes-no.js: secure-random failure is not explicit');
if(!yesNo.includes('Math.floor(0x100000000/max)*max'))errors.push('yes-no.js: rejection-sampling limit missing');
if(!yesNo.includes('while(a[0]>=lim)'))errors.push('yes-no.js: modulo-bias rejection loop missing');
if(/innerHTML\s*=/.test(yesNo))errors.push('yes-no.js: unsafe innerHTML assignment present');

for(const appFile of ['assets/js/app.hu.js','assets/js/app.en.js']){
  const app=fs.readFileSync(path.join(root,appFile),'utf8');
  if(/Math\.random\s*\(/.test(app))errors.push(`${appFile}: insecure Math.random present`);
  if(!app.includes('getRandomValues'))errors.push(`${appFile}: Web Crypto source missing`);
  if(!app.includes('do{x=randU32();}while(x>=limit)'))errors.push(`${appFile}: rejection sampling missing`);
  if(!app.includes('secureShuffle'))errors.push(`${appFile}: secure shuffle missing`);
}

if(!runtime.includes('EVENT_HISTORY_KEY="ceridwen_card_events_v1"'))errors.push('runtime-enhancements.js: versioned event history missing');
if(!runtime.includes('historySchema:"event-id-v1"'))errors.push('runtime-enhancements.js: event identity audit marker missing');
if(!runtime.includes('eventId:`${drawId}-${index+1}`'))errors.push('runtime-enhancements.js: unique draw event IDs missing');
if(!runtime.includes('selectedIds.has(event.eventId)'))errors.push('runtime-enhancements.js: exact event deduplication missing');
if(!runtime.includes('installed:randomHardeningInstalled'))errors.push('runtime-enhancements.js: installation status missing');
if(!runtime.includes('mythology-authenticity.js'))errors.push('runtime-enhancements.js: mythology authenticity layer missing');
if(!runtime.includes('mythologyAudit:window.CeridwenMythologyAudit'))errors.push('runtime-enhancements.js: mythology status missing from self-test');

if (/navigation-upgrade\.css/.test(runtime)) {
  errors.push('runtime-enhancements.js: must not dynamically append navigation-upgrade.css because it breaks final CSS cascade order');
}
for (const page of htmlFiles) {
  const html = fs.readFileSync(path.join(root,page),'utf8');
  const nav = html.indexOf('navigation-upgrade.css');
  const ref = html.indexOf('reference-design.css');
  const contrast = html.indexOf('contrast-hardening.css');
  const ux = html.indexOf('ux-hardening.css');
  if (!(nav >= 0 && ref > nav && contrast > ref && ux > contrast)) errors.push(`${page}: final stylesheet order must be navigation -> reference -> contrast -> UX`);
}

const navCss=fs.readFileSync(path.join(root,'assets/css/navigation-upgrade.css'),'utf8');
if(!navCss.includes('apple-ux-redesign.css'))errors.push('navigation-upgrade.css: unified UX redesign is not globally loaded');

function runAudit(script,label){
  const result=spawnSync(process.execPath,[path.join(root,script)],{cwd:root,encoding:'utf8'});
  if(result.status!==0){
    errors.push(`${label} failed: ${(result.stderr||result.stdout||'unknown error').trim()}`);
  }else if(result.stdout.trim()){
    console.log(`${label}: ${result.stdout.trim()}`);
  }
}

runAudit('scripts/random-engine-test.mjs','Random engine verification');
runAudit('scripts/mythology-content-test.mjs','Mythology authenticity verification');
runAudit('scripts/ux-design-test.mjs','Responsive UX verification');
runAudit('scripts/strict-ux-audit.mjs','Strict UX verification');

if(errors.length){
  console.error(`Release audit failed with ${errors.length} issue(s):`);
  for(const error of errors)console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Release audit passed: ${htmlFiles.length} HTML files, ${required.length} core assets, exact event history, source-aware mythology, WCAG contrast and strict UX contracts verified.`);
