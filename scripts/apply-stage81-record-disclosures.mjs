import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const release = '20260810-record-disclosures-v81';
const previous = '20260810-content-density-v80';
const cssPath = path.join(root, 'assets/css/record-editorial-system.css');
const releasePath = path.join(root, 'data/design-release.json');
const packagePath = path.join(root, 'package.json');
const auditPath = path.join(root, 'tests/audit-record-disclosures-stage81.mjs');

const labels = {
  en: {
    'RECORD-DEPTH': 'Why it belongs here',
    'RECORD-RELATIONSHIPS': 'Connected records',
    'PROJECT-EVIDENCE': 'Sources & documentation'
  },
  hu: {
    'RECORD-DEPTH': 'Miért tartozik ide',
    'RECORD-RELATIONSHIPS': 'Kapcsolódó rekordok',
    'PROJECT-EVIDENCE': 'Források és dokumentáció'
  },
  de: {
    'RECORD-DEPTH': 'Warum es hierher gehört',
    'RECORD-RELATIONSHIPS': 'Verbundene Einträge',
    'PROJECT-EVIDENCE': 'Quellen und Dokumentation'
  }
};

function langFor(relativePath) {
  if (relativePath.startsWith('hu/')) return 'hu';
  if (relativePath.startsWith('de-at/')) return 'de';
  return 'en';
}

function wrapMarker(html, marker, label) {
  if (html.includes(`record-supporting--${marker.toLowerCase()}`)) return html;
  const re = new RegExp(`(<!-- ${marker}:START -->\\s*)([\\s\\S]*?)(\\s*<!-- ${marker}:END -->)`, 'm');
  const match = html.match(re);
  if (!match) return html;
  const cls = marker.toLowerCase();
  return html.replace(re, `$1<details class="record-supporting record-supporting--${cls}">\n<summary><span>${label}</span></summary>\n$2\n</details>$3`);
}

let wrapped = 0;
for (const prefix of ['', 'hu', 'de-at']) {
  for (const family of ['exhibitions', 'books']) {
    const dir = path.join(root, prefix, family);
    let files = [];
    try { files = (await readdir(dir)).filter((f) => f.endsWith('.html')); } catch { continue; }
    for (const file of files) {
      const full = path.join(dir, file);
      const relative = path.relative(root, full).replaceAll('\\', '/');
      const lang = langFor(relative);
      let html = await readFile(full, 'utf8');
      const original = html;
      for (const marker of ['RECORD-DEPTH','RECORD-RELATIONSHIPS','PROJECT-EVIDENCE']) {
        html = wrapMarker(html, marker, labels[lang][marker]);
      }
      if (html !== original) {
        wrapped += 1;
        await writeFile(full, html);
      }
    }
  }
}

let css = await readFile(cssPath, 'utf8');
if (!css.includes('STAGE81-RECORD-SUPPORTING-DISCLOSURES:START')) {
  css += `\n\n/* STAGE81-RECORD-SUPPORTING-DISCLOSURES:START\n   Supporting archive context is still present in source and fully crawlable,\n   but it no longer competes with the artwork. Three recurring evidence blocks\n   become calm, native disclosures after the main catalogue narrative. */\nbody.apple-archive[data-record-type] > details.record-supporting{\n  margin:0!important;\n  border:0!important;\n  border-top:1px solid var(--record-line)!important;\n  background:var(--record-dark)!important;\n  color:var(--record-ink)!important;\n}\nbody.apple-archive[data-record-type] > details.record-supporting:nth-of-type(even){background:var(--record-light)!important}\nbody.apple-archive[data-record-type] > details.record-supporting > summary{\n  width:min(1180px,calc(100% - 2.5rem));\n  min-height:4.75rem;\n  margin:0 auto;\n  display:flex;\n  align-items:center;\n  gap:1rem;\n  padding:1.1rem 0!important;\n  color:var(--record-ink)!important;\n  font-size:clamp(1rem,1.4vw,1.12rem)!important;\n  font-weight:650!important;\n  letter-spacing:-.01em;\n  cursor:pointer;\n  list-style:none;\n}\nbody.apple-archive[data-record-type] > details.record-supporting > summary::-webkit-details-marker{display:none}\nbody.apple-archive[data-record-type] > details.record-supporting > summary::after{\n  content:'+';\n  margin-left:auto;\n  color:var(--record-gold);\n  font-size:1.45rem;\n  font-weight:400;\n  line-height:1;\n}\nbody.apple-archive[data-record-type] > details.record-supporting[open] > summary::after{content:'−'}\nbody.apple-archive[data-record-type] > details.record-supporting > section{\n  margin:0!important;\n  padding-block:clamp(2rem,4vw,3.5rem)!important;\n  border:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n}\nbody.apple-archive[data-record-type] > details.record-supporting > section::before{display:none!important}\nbody.apple-archive[data-record-type] > details.record-supporting .wrap{max-width:1180px!important}\nbody.apple-archive[data-record-type] > details.record-supporting :is(.record-depth-head,.record-context-head,.project-evidence-head){margin-bottom:clamp(1.25rem,2.5vw,2rem)!important}\nbody.apple-archive[data-record-type] > details.record-supporting :is(.record-links,.project-evidence-grid){gap:0!important}\nbody.apple-archive[data-record-type] > details.record-supporting :is(.record-links>a,.evidence-item){\n  margin:0!important;\n  padding:1rem 0!important;\n  border:0!important;\n  border-bottom:1px solid var(--record-line)!important;\n  border-radius:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n}\n@media(max-width:700px){\n  body.apple-archive[data-record-type] > details.record-supporting > summary{width:calc(100% - 2rem);min-height:4.25rem}\n  body.apple-archive[data-record-type] > details.record-supporting > section{padding-block:2rem!important}\n}\n/* STAGE81-RECORD-SUPPORTING-DISCLOSURES:END */\n`;
}
css = css.replaceAll(previous, release);
await writeFile(cssPath, css);

for (const dirName of ['assets/css','assets/js']) {
  const dir = path.join(root, dirName);
  for (const name of await readdir(dir)) {
    if (!/\.(css|js)$/.test(name)) continue;
    const file = path.join(dir, name);
    let text = await readFile(file, 'utf8');
    text = text.replaceAll(previous, release);
    await writeFile(file, text);
  }
}

const audit = `import { readFile, readdir } from 'node:fs/promises';\nimport path from 'node:path';\nconst root=path.resolve(import.meta.dirname,'..');\nconst failures=[];\nconst css=await readFile(path.join(root,'assets/css/record-editorial-system.css'),'utf8');\nconst release=JSON.parse(await readFile(path.join(root,'data/design-release.json'),'utf8')).release;\nif(release!=='${release}') failures.push('unexpected release '+release);\nfor(const token of ['STAGE81-RECORD-SUPPORTING-DISCLOSURES:START','details.record-supporting','summary::after']) if(!css.includes(token)) failures.push('missing CSS '+token);\nconst labels={en:['Why it belongs here','Connected records','Sources & documentation'],hu:['Miért tartozik ide','Kapcsolódó rekordok','Források és dokumentáció'],de:['Warum es hierher gehört','Verbundene Einträge','Quellen und Dokumentation']};\nlet checked=0,wrapped=0;\nfor(const prefix of ['', 'hu', 'de-at']) for(const family of ['exhibitions','books']){const dir=path.join(root,prefix,family);let files=[];try{files=(await readdir(dir)).filter(f=>f.endsWith('.html'))}catch{continue}for(const file of files){const html=await readFile(path.join(dir,file),'utf8');checked++;const lang=prefix==='hu'?'hu':prefix==='de-at'?'de':'en';const markers=['RECORD-DEPTH','RECORD-RELATIONSHIPS','PROJECT-EVIDENCE'];for(let i=0;i<markers.length;i++){if(html.includes('<!-- '+markers[i]+':START -->')){wrapped++;if(!html.includes('<details class="record-supporting record-supporting--'+markers[i].toLowerCase()+'">')) failures.push(prefix+'/'+family+'/'+file+' missing disclosure '+markers[i]);if(!html.includes('<summary><span>'+labels[lang][i]+'</span></summary>')) failures.push(prefix+'/'+family+'/'+file+' wrong summary '+markers[i]);}}if(/<details class="record-supporting[^>]*\\sopen(?:\\s|>)/i.test(html)) failures.push(prefix+'/'+family+'/'+file+' supporting disclosure must default closed');}}\nif(wrapped===0) failures.push('no record supporting blocks found');\nif(failures.length){console.error(failures.join('\\n'));process.exit(1)}\nconsole.log('Stage 81 record disclosure audit passed: '+checked+' record pages checked, '+wrapped+' supporting archive blocks default closed across EN/HU/DE-AT.');\n`;
await writeFile(auditPath, audit);

const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
if (!pkg.scripts.test.includes('audit-record-disclosures-stage81.mjs')) pkg.scripts.test += ' && node tests/audit-record-disclosures-stage81.mjs';
pkg.scripts['test:record-disclosures'] = 'node tests/audit-record-disclosures-stage81.mjs';
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');

const hash = crypto.createHash('sha256');
for (const dirName of ['assets/css','assets/js','assets/video']) {
  const dir = path.join(root, dirName);
  const ext = dirName.endsWith('css') ? '.css' : dirName.endsWith('js') ? '.js' : '.mp4';
  for (const name of (await readdir(dir)).filter(n => n.endsWith(ext)).sort()) hash.update(await readFile(path.join(dir,name)));
}
const design = JSON.parse(await readFile(releasePath, 'utf8'));
design.release = release;
design.note = 'Stage 81 record disclosures: recurring record-depth, connected-record and evidence sections remain fully present and crawlable but default to elegant closed archive disclosures across exhibition and book pages in EN/HU/DE-AT.';
design.assetDigest = hash.digest('hex').slice(0,16);
await writeFile(releasePath, JSON.stringify(design, null, 2) + '\n');
console.log(`Stage 81 prepared: ${wrapped} record pages changed; digest ${design.assetDigest}.`);
