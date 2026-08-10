import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const release = '20260810-footer-simplification-v82';
const previous = '20260810-record-disclosures-v81';
const releasePath = path.join(root, 'data/design-release.json');
const footerCssPath = path.join(root, 'assets/css/footer-elegant.css');
const packagePath = path.join(root, 'package.json');
const auditPath = path.join(root, 'tests/audit-footer-simplification-stage82.mjs');
const skip = new Set(['.git','node_modules','.github']);

function language(relative) {
  if (relative.startsWith('hu/')) return 'hu';
  if (relative.startsWith('de-at/')) return 'de';
  return 'en';
}
const summary = {
  en: 'Social profiles',
  hu: 'Közösségi profilok',
  de: 'Social-Media-Profile'
};

let changed = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { await walk(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const relative = path.relative(root, full).replaceAll('\\','/');
    let html = await readFile(full,'utf8');
    if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html) || !/<footer\b/i.test(html)) continue;
    if (html.includes('class="footer-social-disclosure"')) continue;
    const socialRe = /<div class="socials">(?=[\s\S]*?Instagram)([\s\S]*?<a[^>]+>Instagram<\/a>[\s\S]*?)<\/div>/i;
    const match = html.match(socialRe);
    if (!match) continue;
    const lang = language(relative);
    const replacement = `<details class="footer-social-disclosure"><summary>${summary[lang]}</summary><div class="socials footer-social-links">${match[1]}</div></details>`;
    html = html.replace(socialRe, replacement);
    await writeFile(full, html);
    changed++;
  }
}
await walk(root);

let css = await readFile(footerCssPath,'utf8');
if (!css.includes('STAGE82-FOOTER-SIMPLIFICATION:START')) {
  css += `\n\n/* STAGE82-FOOTER-SIMPLIFICATION:START\n   The footer keeps every official profile link crawlable but shows the useful\n   archive network first. Secondary social destinations live in one quiet row. */\nbody.apple-archive footer .footer-social-disclosure{\n  width:min(100%,760px);\n  margin:clamp(1.25rem,2vw,1.75rem) auto 0!important;\n  border:0!important;\n  border-top:1px solid rgba(175,196,217,.16)!important;\n  border-bottom:1px solid rgba(175,196,217,.16)!important;\n  border-radius:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n}\nbody.apple-archive footer .footer-social-disclosure>summary{\n  min-height:3.25rem;\n  display:flex;\n  align-items:center;\n  justify-content:center;\n  gap:.75rem;\n  padding:.8rem 0!important;\n  color:#AFC4D9!important;\n  font-size:.82rem!important;\n  font-weight:600!important;\n  letter-spacing:.02em;\n  cursor:pointer;\n  list-style:none;\n}\nbody.apple-archive footer .footer-social-disclosure>summary::-webkit-details-marker{display:none}\nbody.apple-archive footer .footer-social-disclosure>summary::after{content:'+';color:#B79C44;font-size:1.15rem;font-weight:400}\nbody.apple-archive footer .footer-social-disclosure[open]>summary::after{content:'−'}\nbody.apple-archive footer .footer-social-links{\n  display:flex!important;\n  flex-wrap:wrap!important;\n  justify-content:center!important;\n  gap:.55rem 1.05rem!important;\n  padding:0 0 1rem!important;\n  margin:0!important;\n}\nbody.apple-archive footer .footer-social-links a{font-size:.78rem!important;color:#AFC4D9!important}\nbody.apple-archive footer .footer-social-links a:hover{color:#F5F5F7!important}\nbody.apple-archive footer .lang-switch{margin-top:1.25rem!important}\nbody.apple-archive footer .fineprint{margin-top:1.25rem!important}\n@media(max-width:640px){\n  body.apple-archive footer .footer-social-disclosure{width:100%}\n  body.apple-archive footer .footer-social-links{gap:.65rem .9rem!important}\n}\n/* STAGE82-FOOTER-SIMPLIFICATION:END */\n`;
}
css = css.replaceAll(previous, release);
await writeFile(footerCssPath,css);

for (const dirName of ['assets/css','assets/js']) {
  const dir = path.join(root,dirName);
  for (const name of await readdir(dir)) {
    if (!/\.(css|js)$/.test(name)) continue;
    const file = path.join(dir,name);
    let text = await readFile(file,'utf8');
    text = text.replaceAll(previous,release);
    await writeFile(file,text);
  }
}

const audit = `import { readFile, readdir } from 'node:fs/promises';\nimport path from 'node:path';\nconst root=path.resolve(import.meta.dirname,'..');const failures=[];\nconst release=JSON.parse(await readFile(path.join(root,'data/design-release.json'),'utf8')).release;\nconst css=await readFile(path.join(root,'assets/css/footer-elegant.css'),'utf8');\nif(release!=='${release}') failures.push('unexpected release '+release);\nfor(const token of ['STAGE82-FOOTER-SIMPLIFICATION:START','.footer-social-disclosure','.footer-social-links']) if(!css.includes(token)) failures.push('missing footer CSS '+token);\nlet checked=0;const expected={en:'Social profiles',hu:'Közösségi profilok',de:'Social-Media-Profile'};\nasync function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.github'].includes(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory()){await walk(full);continue}if(!e.name.endsWith('.html'))continue;const rel=path.relative(root,full).replaceAll('\\\\','/');const html=await readFile(full,'utf8');if(!/<body\\b[^>]*class=[\"'][^\"']*apple-archive/i.test(html)||!/<footer\\b/i.test(html)||!html.includes('>Instagram</a>'))continue;checked++;const lang=rel.startsWith('hu/')?'hu':rel.startsWith('de-at/')?'de':'en';if(!html.includes('class=\"footer-social-disclosure\"'))failures.push(rel+' social links not disclosed');if(!html.includes('<summary>'+expected[lang]+'</summary>'))failures.push(rel+' wrong footer summary');if(/footer-social-disclosure[^>]*\\sopen(?:\\s|>)/i.test(html))failures.push(rel+' footer disclosure must default closed');for(const name of ['Instagram','LinkedIn','YouTube'])if(!html.includes('>'+name+'</a>'))failures.push(rel+' lost '+name);}}await walk(root);if(checked<80)failures.push('too few content footers checked '+checked);if(failures.length){console.error(failures.join('\\n'));process.exit(1)}console.log('Stage 82 footer simplification audit passed: '+checked+' multilingual content footers keep all social links behind one default-closed disclosure.');\n`;
await writeFile(auditPath,audit);

const pkg=JSON.parse(await readFile(packagePath,'utf8'));
if(!pkg.scripts.test.includes('audit-footer-simplification-stage82.mjs'))pkg.scripts.test+=' && node tests/audit-footer-simplification-stage82.mjs';
pkg.scripts['test:footer-simplification']='node tests/audit-footer-simplification-stage82.mjs';
await writeFile(packagePath,JSON.stringify(pkg,null,2)+'\n');

const hash=crypto.createHash('sha256');
for(const dirName of ['assets/css','assets/js','assets/video']){const dir=path.join(root,dirName);const ext=dirName.endsWith('css')?'.css':dirName.endsWith('js')?'.js':'.mp4';for(const name of (await readdir(dir)).filter(n=>n.endsWith(ext)).sort())hash.update(await readFile(path.join(dir,name)));}
const design=JSON.parse(await readFile(releasePath,'utf8'));design.release=release;design.note='Stage 82 footer simplification: official ecosystem, contact and legal destinations stay immediately visible while secondary social profiles move into one elegant default-closed disclosure across EN/HU/DE-AT content pages.';design.assetDigest=hash.digest('hex').slice(0,16);await writeFile(releasePath,JSON.stringify(design,null,2)+'\n');
console.log(`Stage 82 prepared: ${changed} footers simplified; digest ${design.assetDigest}.`);
