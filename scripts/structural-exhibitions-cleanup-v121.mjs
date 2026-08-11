import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules']);
const htmlFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
await walk(root);

const disclosure = /(<a class="m-main"[^>]*data-nav-role="exhibitions"[^>]*>.*?<\/a><p class="m-desc">.*?<\/p>)<details><summary>(?:All exhibitions|Összes kiállítás|Alle Ausstellungen)<\/summary><div class="sub">.*?<\/div><\/details>/gs;
let removals = 0;
for (const file of htmlFiles) {
  const original = await readFile(file, 'utf8');
  let count = 0;
  const updated = original.replace(disclosure, (match, prefix) => { count += 1; return prefix; });
  if (count) {
    removals += count;
    await writeFile(file, updated, 'utf8');
  }
}
if (removals < 87) throw new Error(`Expected at least 87 exhibition disclosure removals, got ${removals}`);
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (/<summary>(?:All exhibitions|Összes kiállítás|Alle Ausstellungen)<\/summary>/i.test(html)) {
    throw new Error(`Legacy exhibition disclosure remains in ${path.relative(root, file)}`);
  }
}

const cssPath = path.join(root, 'assets/css/final-layout-fixes.css');
let css = await readFile(cssPath, 'utf8');
const oldCss = `/* Exhibitions remains a single navigation destination in every viewport.\n   Books has no disclosure markup at all: it is a plain destination link. */\nbody.apple-archive #menu .m-main[data-nav-role="exhibitions"] + .m-desc + details:not(.svc){\n  display:none!important;\n}`;
if (!css.includes(oldCss)) throw new Error('Expected exhibition fallback CSS not found');
css = css.replace(oldCss, '/* Books and Exhibitions are plain menu destinations; no catalogue disclosure markup remains. */');
await writeFile(cssPath, css, 'utf8');

const navPath = path.join(root, 'tests/audit-navigation-parity.mjs');
let nav = await readFile(navPath, 'utf8');
nav = nav.replace(`const approvedHungarianAwakeningDate = '<span class="yr">2017–</span>Ébredés — az Új kezdet';\n`, '');
nav = nav.replace(`      if (!menuMatch[0].includes(approvedHungarianAwakeningDate)) {\n        failures.push(\`menu copy (hu): \${rel} must show Ébredés as an ongoing exhibition from 2017\`);\n      }\n`, '');
const oldGuard = `/* The exhibition catalogue is intentionally not a menu disclosure anymore.\n   The static archival markup may retain the historical list, but the shared\n   final layout authority must suppress that exact disclosure in every viewport. */\nconst finalLayoutCss = await readFile(path.join(root, 'assets/css/final-layout-fixes.css'), 'utf8');\nif (!finalLayoutCss.includes('#menu .m-main[data-nav-role="exhibitions"] + .m-desc + details:not(.svc)')) {\n  failures.push('menu: exhibition catalogue disclosure is not globally disabled');\n}\n\n`;
if (!nav.includes(oldGuard)) throw new Error('Expected legacy navigation disclosure guard not found');
nav = nav.replace(oldGuard, '/* Exhibition catalogue disclosures are structurally absent; Stage 121 guards this contract. */\n\n');
await writeFile(navPath, nav, 'utf8');

const pageUpdates = new Map([
  ['hu/exhibitions/ebredes.html', [['Kiállítás · 2017–2018','Kiállítás · 2017–'],['2017–2018 · Budapest · Noszvaj · Veszprém','2017– · Budapest · Noszvaj · Veszprém']]],
  ['exhibitions/ebredes.html', [['Exhibition · 2017–2018','Exhibition · 2017–'],['2017–2018 · Budapest · Noszvaj · Veszprém','2017– · Budapest · Noszvaj · Veszprém']]],
  ['de-at/exhibitions/ebredes.html', [['Ausstellung · 2017–2018','Ausstellung · 2017–'],['2017–2018 · Budapest · Noszvaj · Veszprém','2017– · Budapest · Noszvaj · Veszprém']]],
]);
for (const [rel, replacements] of pageUpdates) {
  const file = path.join(root, rel);
  let html = await readFile(file, 'utf8');
  for (const [from, to] of replacements) {
    if (!html.includes(from)) throw new Error(`Missing expected Awakening date text in ${rel}: ${from}`);
    html = html.replace(from, to);
  }
  await writeFile(file, html, 'utf8');
}

const testPath = path.join(root, 'tests/audit-exhibitions-menu-structure-stage121.mjs');
const test = `/* Stage 121: Exhibitions is a plain destination and Awakening remains visibly ongoing from 2017. */\nimport {readFile,readdir} from 'node:fs/promises'; import path from 'node:path';\nconst root=path.resolve(import.meta.dirname,'..'),skip=new Set(['.git','node_modules','.github','data']),files=[];\nasync function walk(d){for(const e of await readdir(d,{withFileTypes:true})){if(skip.has(e.name))continue;const f=path.join(d,e.name);if(e.isDirectory())await walk(f);else if(e.name.endsWith('.html'))files.push(f);}} await walk(root);\nconst failures=[];let menuPages=0;const counts={en:0,hu:0,de:0};\nfor(const file of files){const html=await readFile(file,'utf8');if(!/id=[\"']menu[\"']/i.test(html))continue;menuPages++;const lang=(html.match(/<html\\b[^>]*lang=[\"']([^\"']+)/i)?.[1]||'en').toLowerCase();if(lang.startsWith('hu'))counts.hu++;else if(lang.startsWith('de'))counts.de++;else counts.en++;if(/<summary>(?:All exhibitions|Összes kiállítás|Alle Ausstellungen)<\\/summary>/i.test(html))failures.push(\`${'${'}path.relative(root,file)} still contains exhibition disclosure\`);if(!/<a class=\"m-main\"[^>]*data-nav-role=\"exhibitions\"[^>]*>[^<]+<\\/a><p class=\"m-desc\">/i.test(html))failures.push(\`${'${'}path.relative(root,file)} lacks plain Exhibitions destination\`);}\nif(menuPages<87)failures.push(\`Only ${'${'}menuPages} menu pages audited\`);for(const [l,c] of Object.entries(counts))if(c<20)failures.push(\`${'${'}l} coverage low: ${'${'}c}\`);\nconst css=await readFile(path.join(root,'assets/css/final-layout-fixes.css'),'utf8');if(css.includes('data-nav-role=\"exhibitions\"] + .m-desc + details'))failures.push('CSS still hides exhibition disclosure markup');\nconst awakening=[['hu/exhibitions/ebredes.html','Kiállítás · 2017–','2018 óta'],['exhibitions/ebredes.html','Exhibition · 2017–','Since 2018'],['de-at/exhibitions/ebredes.html','Ausstellung · 2017–','Seit 2018']];\nfor(const [rel,date,evidence] of awakening){const html=await readFile(path.join(root,rel),'utf8');if(!html.includes(date))failures.push(\`${'${'}rel} does not show ongoing 2017– date\`);if(!html.includes(evidence))failures.push(\`${'${'}rel} lacks permanent-display evidence\`);}\nif(failures.length){console.error(failures.join('\\n'));process.exit(1);}console.log(\`Stage 121 passed: ${'${'}menuPages} menus have no exhibition dropdown and Awakening is visibly 2017– with permanent-display evidence in HU/EN/DE.\`);\n`;
await writeFile(testPath, test, 'utf8');

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
const gate = 'node tests/audit-exhibitions-menu-structure-stage121.mjs';
if (!pkg.scripts.test.includes(gate)) pkg.scripts.test += ' && ' + gate;
pkg.scripts['test:exhibitions-menu-structure'] = gate;
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

for (const rel of ['data/design-release.json','data/page-simplification-review.json']) {
  const file = path.join(root, rel);
  const data = JSON.parse(await readFile(file, 'utf8'));
  data.release = '20260811-menu-structure-v121';
  if (rel.endsWith('design-release.json')) {
    data.note = 'Stage 121 removes the legacy Exhibitions disclosure markup from every multilingual menu and moves the ongoing Awakening 2017– status to its canonical exhibition pages.';
    data.updated = '2026-08-11';
  }
  await writeFile(file, JSON.stringify(data, null, 2) + '\n');
}
console.log(`Removed ${removals} legacy Exhibitions disclosures and updated Awakening ongoing status.`);
