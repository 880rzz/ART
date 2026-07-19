import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const pages=['index.html','index-en.html','yes-no.html','yes-no-en.html'];
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
for(const page of pages){
  const file=path.join(root,page);assert(fs.existsSync(file),`${page}: hiányzik`);if(!fs.existsSync(file))continue;
  const html=fs.readFileSync(file,'utf8');
  const expected=page.includes('-en')?'en':'hu';
  assert(new RegExp(`<html[^>]+lang="${expected}"`,'i').test(html),`${page}: hibás lang`);
  assert(html.includes('executive-ux-v3.css?v=20260719-exec3'),`${page}: executive CSS nincs bekötve`);
  assert(html.includes('executive-ux-v3.js?v=20260719-exec3'),`${page}: executive JS nincs bekötve`);
  assert(/name="viewport"/.test(html),`${page}: viewport hiányzik`);
  assert(/class="site/.test(html),`${page}: header hiányzik`);
}
for(const asset of ['assets/css/executive-ux-v3.css','assets/js/executive-ux-v3.js'])assert(fs.existsSync(path.join(root,asset)),`${asset}: hiányzik`);
const css=fs.readFileSync(path.join(root,'assets/css/executive-ux-v3.css'),'utf8');
for(const token of ['#v-gate .gate-hero','nav#mainTabs.tabs','#pendulumType','#lexFilters','#flowNudge','@media(max-width:760px)'])assert(css.includes(token),`CSS audit token hiányzik: ${token}`);
const js=fs.readFileSync(path.join(root,'assets/js/executive-ux-v3.js'),'utf8');
for(const token of ['yesNoMenuToggle','button[data-v]','stopImmediatePropagation','reveal-on-scroll','flowNudge'])assert(js.includes(token),`JS audit token hiányzik: ${token}`);
if(failures.length){console.error(`EXECUTIVE UX AUDIT FAILED (${failures.length})`);for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('EXECUTIVE UX AUDIT PASSED: 4 entry pages, bilingual navigation, desktop/mobile design layer and critical interaction recovery present.');
