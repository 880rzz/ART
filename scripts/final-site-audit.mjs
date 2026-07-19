import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const pages=['index.html','index-en.html','yes-no.html','yes-no-en.html'];
const failures=[];

function assert(condition,message){if(!condition)failures.push(message);}
function text(file){return fs.readFileSync(path.join(root,file),'utf8');}
function count(html,needle){return html.split(needle).length-1;}

for(const file of pages){
  assert(fs.existsSync(path.join(root,file)),`${file}: missing entry page`);
  if(!fs.existsSync(path.join(root,file)))continue;
  const html=text(file);
  const standalone=file.startsWith('yes-no');
  const toggleId=standalone?'yesNoMenuToggle':'menuToggle';
  const navId=standalone?'yesNoNav':'mainTabs';

  assert(/<html[^>]+lang="(hu|en)"/i.test(html),`${file}: missing valid document language`);
  assert(/<meta[^>]+name="viewport"/i.test(html),`${file}: missing responsive viewport`);
  assert(/<header[^>]+class="[^"]*\bsite\b[^"]*"/i.test(html),`${file}: missing site header`);
  assert(count(html,`id="${toggleId}"`)===1,`${file}: ${toggleId} must occur exactly once`);
  assert(count(html,`id="${navId}"`)===1,`${file}: ${navId} must occur exactly once`);
  assert(/final-audit-fixes-v2\.css\?v=20260719-final2/.test(html),`${file}: final audited v2 CSS not injected`);
  assert(/final-audit-fixes-v2\.js\?v=20260719-final2/.test(html),`${file}: final audited v2 JavaScript not injected`);
  assert(!/href="assets\/css\//.test(html),`${file}: relative CSS path remains`);
  assert(!/src="assets\/js\//.test(html),`${file}: relative JavaScript path remains`);
  assert(!/<img(?![^>]*\balt=)[^>]*>/i.test(html),`${file}: image without alt attribute`);

  if(!standalone){
    const tabs=[...html.matchAll(/<button[^>]+data-v="([^"]+)"[^>]*>/g)].map(match=>match[1]);
    assert(tabs.length>=6,`${file}: unexpectedly small application navigation`);
    for(const key of tabs){
      assert(count(html,`id="v-${key}"`)===1,`${file}: tab ${key} must have exactly one matching view`);
      assert(count(html,`id="tab-${key}"`)===1,`${file}: tab ${key} must have exactly one tab ID`);
    }
    assert(count(html,'id="heroMoonGlyph"')===1,`${file}: hero moon graphic must occur exactly once`);
  }else{
    assert(count(html,'id="basicStep"')===1,`${file}: basic entry flow missing`);
    assert(count(html,'id="qaForm"')===1,`${file}: question form missing`);
    assert(count(html,'id="qaNeedle"')===1,`${file}: pendulum needle missing`);
  }

  const language=file.includes('-en')?'en':'hu';
  const htmlLang=(html.match(/<html[^>]+lang="([^"]+)"/i)||[])[1];
  assert(htmlLang===language,`${file}: language mismatch (${htmlLang||'none'} vs ${language})`);
}

const requiredAssets=[
  'assets/css/app.css','assets/css/theme-celtic.css','assets/css/navigation-upgrade.css',
  'assets/css/reference-design.css','assets/css/contrast-hardening.css','assets/css/ux-hardening.css',
  'assets/css/final-audit-fixes.css','assets/css/final-audit-fixes-v2.css',
  'assets/js/runtime-enhancements.js','assets/js/yes-no.js','assets/js/final-audit-fixes-v2.js'
];
for(const asset of requiredAssets)assert(fs.existsSync(path.join(root,asset)),`${asset}: missing critical asset`);

const baseCss=text('assets/css/final-audit-fixes.css');
const finalCss=text('assets/css/final-audit-fixes-v2.css');
assert(baseCss.includes('.soft-detail'),`base final CSS: requested dark entry box rule missing`);
assert(baseCss.includes('#heroMoonGlyph'),`base final CSS: moon isolation rule missing`);
assert(baseCss.includes('header.site'),`base final CSS: header repair missing`);
assert(finalCss.includes('nav#yesNoNav'),`v2 final CSS: standalone menu repair missing`);

const finalJs=text('assets/js/final-audit-fixes-v2.js');
assert(finalJs.includes('stopImmediatePropagation'),`final JS: independent menu capture handler missing`);
assert(finalJs.includes('yesNoMenuToggle'),`final JS: standalone menu controller missing`);
assert(finalJs.includes('button[data-v]'),`final JS: tab/view recovery missing`);

if(failures.length){
  console.error(`FINAL SITE AUDIT FAILED (${failures.length})`);
  failures.forEach(item=>console.error(`- ${item}`));
  process.exit(1);
}
console.log(`FINAL SITE AUDIT PASSED: ${pages.length} pages, ${requiredAssets.length} critical assets, main/standalone navigation, responsive and language checks complete.`);
