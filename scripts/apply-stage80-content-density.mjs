import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const cssPath = path.join(root, 'assets/css/archive-content-flow.css');
const runtimePath = path.join(root, 'assets/js/responsive-header-system.js');
const releasePath = path.join(root, 'data/design-release.json');
const packagePath = path.join(root, 'package.json');
const auditPath = path.join(root, 'tests/audit-content-density-stage80.mjs');
const release = '20260810-content-density-v80';
const previous = '20260810-simplified-authority-v79';

let runtime = await readFile(runtimePath, 'utf8');
if (!runtime.includes('STAGE80-CONTENT-FAMILY-CLASSIFIER')) {
  const anchor = "  const main = document.querySelector('main');";
  const classifier = `  /* STAGE80-CONTENT-FAMILY-CLASSIFIER\n     Every non-record page receives one restrained editorial family. This is\n     presentation metadata only: URLs, visible copy, schema and source facts\n     stay untouched. It lets the archive simplify dense pages consistently\n     instead of adding another page-specific CSS patch. */\n  if (!body.dataset.recordType) {\n    const familyPage = page.toLowerCase();\n    const collectionPages = new Set(['archive','archives','exhibitions','books','projects','works','gallery','search']);\n    const chronologyPages = new Set(['chronology','timeline','life','journey','oeuvre']);\n    const utilityPages = new Set(['contact','contacts','imprint','impressum','privacy','cookies','cookie-policy','accessibility','404']);\n    if (familyPage === 'index') body.dataset.contentFamily = 'home';\n    else if (curatorialPages.has(familyPage)) body.dataset.contentFamily = 'curatorial';\n    else if (collectionPages.has(familyPage)) body.dataset.contentFamily = 'collection';\n    else if (chronologyPages.has(familyPage)) body.dataset.contentFamily = 'chronology';\n    else if (utilityPages.has(familyPage)) body.dataset.contentFamily = 'utility';\n    else body.dataset.contentFamily = 'editorial';\n  }\n\n`;
  if (!runtime.includes(anchor)) throw new Error('Stage 80 runtime anchor not found');
  runtime = runtime.replace(anchor, classifier + anchor);
}
runtime = runtime.replaceAll(previous, release);
await writeFile(runtimePath, runtime);

let css = await readFile(cssPath, 'utf8');
if (!css.includes('STAGE80-ALL-PAGE-CONTENT-DENSITY:START')) {
  css += `\n\n/* STAGE80-ALL-PAGE-CONTENT-DENSITY:START\n   The archive keeps its full evidentiary depth, but non-record pages no longer\n   present every fact as an equally loud card. The system favours title, image,\n   short introduction and calm editorial rows; detailed material stays visible\n   and indexable with less interface chrome. */\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main{\n  --density-measure:68ch;\n  --density-wide:1120px;\n  --density-line:rgba(175,196,217,.16);\n}\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main > section{\n  padding-block:clamp(3.25rem,6.2vw,5.5rem)!important;\n}\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main :is(.wrap,.container,.inner){\n  max-width:min(var(--density-wide),calc(100% - 2.5rem));\n}\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main :is(.lead,.intro,.prose,p):not(.meta):not(.eyebrow):not(.kicker){\n  max-inline-size:var(--density-measure);\n  text-wrap:pretty;\n}\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main :is(.section-head,.section-intro){\n  max-width:var(--density-measure);\n  margin-bottom:clamp(1.5rem,3vw,2.5rem)!important;\n}\n\n/* Secondary factual containers become editorial rows instead of app cards. */\nhtml body.apple-archive[data-content-family]:is([data-content-family="editorial"],[data-content-family="collection"],[data-content-family="chronology"],[data-content-family="utility"]) main :is(.archive-card,.project-card,.source-card,.info-card,.fact-card,.timeline-card,.reference-card){\n  margin:0!important;\n  padding:clamp(1rem,2vw,1.45rem) 0!important;\n  border:0!important;\n  border-bottom:1px solid var(--density-line)!important;\n  border-radius:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n  transform:none!important;\n}\nhtml body.apple-archive[data-content-family]:is([data-content-family="editorial"],[data-content-family="collection"],[data-content-family="chronology"],[data-content-family="utility"]) main :is(.archive-card,.project-card,.source-card,.info-card,.fact-card,.timeline-card,.reference-card):hover{\n  transform:none!important;\n  box-shadow:none!important;\n}\n\n/* Dense metadata is scan-first: compact rows, no nested box-on-box treatment. */\nhtml body.apple-archive[data-content-family] main :is(.facts,.fact-grid,.meta-grid,.stats-grid,.credits-grid,.source-grid,.reference-grid){\n  gap:0 clamp(2rem,5vw,5rem)!important;\n}\nhtml body.apple-archive[data-content-family] main :is(.facts,.fact-grid,.meta-grid,.stats-grid,.credits-grid,.source-grid,.reference-grid) > *{\n  border-radius:0!important;\n  box-shadow:none!important;\n}\n\n/* Existing disclosure is the preferred home for supporting depth. */\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]) main details{\n  margin:0!important;\n  border:0!important;\n  border-top:1px solid var(--density-line)!important;\n  border-bottom:1px solid var(--density-line)!important;\n  border-radius:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n}\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]) main details + details{margin-top:-1px!important}\nhtml body.apple-archive[data-content-family]:not([data-content-family="home"]) main details > summary{\n  min-height:3.5rem;\n  padding:1rem 0!important;\n}\n\n/* Chronologies read as one continuous story, not a stack of detached tiles. */\nhtml body.apple-archive[data-content-family="chronology"] main :is(.timeline,.chronology,.milestones,.journey){\n  display:grid!important;\n  gap:0!important;\n  border-top:1px solid var(--density-line)!important;\n}\nhtml body.apple-archive[data-content-family="chronology"] main :is(.timeline,.chronology,.milestones,.journey) > *{\n  padding-block:clamp(1.25rem,2.4vw,1.8rem)!important;\n  border-bottom:1px solid var(--density-line)!important;\n  background:transparent!important;\n  box-shadow:none!important;\n}\n\n/* Collection landing pages retain imagery but reduce ornamental framing. */\nhtml body.apple-archive[data-content-family="collection"] main :is(.archive-grid,.project-grid,.book-grid,.exhibition-grid,.collection-grid){\n  gap:clamp(1.25rem,2.5vw,2.25rem)!important;\n}\nhtml body.apple-archive[data-content-family="collection"] main :is(.archive-grid,.project-grid,.book-grid,.exhibition-grid,.collection-grid) :is(article,.card){\n  box-shadow:none!important;\n}\n\n/* Utility pages should be shortest and calmest. */\nhtml body.apple-archive[data-content-family="utility"] main{--density-measure:62ch;--density-wide:900px}\nhtml body.apple-archive[data-content-family="utility"] main > section{padding-block:clamp(2.75rem,5vw,4.5rem)!important}\n\n@media(max-width:700px){\n  html body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main > section{\n    padding-block:3rem!important;\n  }\n  html body.apple-archive[data-content-family]:not([data-content-family="home"]):not([data-content-family="curatorial"]) main :is(.wrap,.container,.inner){\n    max-width:calc(100% - 2rem);\n  }\n}\n/* STAGE80-ALL-PAGE-CONTENT-DENSITY:END */\n`;
}
css = css.replaceAll(previous, release);
await writeFile(cssPath, css);

/* All CSS/JS internal imports and runtime-loaded assets use the same release. */
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

const audit = `import fs from 'node:fs';\nconst errors=[];\nconst js=fs.readFileSync('assets/js/responsive-header-system.js','utf8');\nconst css=fs.readFileSync('assets/css/archive-content-flow.css','utf8');\nconst release=JSON.parse(fs.readFileSync('data/design-release.json','utf8')).release;\nfor(const token of ['STAGE80-CONTENT-FAMILY-CLASSIFIER','contentFamily = \'home\'','contentFamily = \'curatorial\'','contentFamily = \'collection\'','contentFamily = \'chronology\'','contentFamily = \'utility\'','contentFamily = \'editorial\'']) if(!js.includes(token)) errors.push('runtime missing '+token);\nfor(const token of ['STAGE80-ALL-PAGE-CONTENT-DENSITY:START','data-content-family=\\"chronology\\"','data-content-family=\\"collection\\"','data-content-family=\\"utility\\"','--density-measure:68ch']) if(!css.includes(token)) errors.push('content CSS missing '+token);\nif(release!=='${release}') errors.push('unexpected design release '+release);\nfor(const file of ['index.html','hu/index.html','de-at/index.html','press.html','hu/press.html','de-at/press.html','curators.html','hu/curators.html','de-at/curators.html']) if(!fs.existsSync(file)) errors.push('missing representative page '+file);\nif(errors.length){console.error(errors.join('\\n'));process.exit(1)}\nconsole.log('Stage 80 content-density audit passed: all-page family classifier and low-chrome editorial simplification are guarded across EN/HU/DE-AT.');\n`;
await writeFile(auditPath, audit);

const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
if (!pkg.scripts.test.includes('audit-content-density-stage80.mjs')) pkg.scripts.test += ' && node tests/audit-content-density-stage80.mjs';
pkg.scripts['test:content-density'] = 'node tests/audit-content-density-stage80.mjs';
await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');

/* Digest uses the same asset families as the release freshness audit. */
const hash = crypto.createHash('sha256');
for (const dirName of ['assets/css','assets/js','assets/video']) {
  const dir = path.join(root, dirName);
  const names = (await readdir(dir)).filter((name) => dirName.endsWith('video') ? name.endsWith('.mp4') : name.endsWith(dirName.endsWith('css') ? '.css' : '.js')).sort();
  for (const name of names) hash.update(await readFile(path.join(dir, name)));
}
const design = JSON.parse(await readFile(releasePath, 'utf8'));
design.release = release;
design.note = 'Stage 80 content density: every non-record ART page is classified into a restrained editorial family; long supporting information keeps full indexable depth but loses unnecessary card chrome and excess spacing across EN/HU/DE-AT.';
design.assetDigest = hash.digest('hex').slice(0,16);
await writeFile(releasePath, JSON.stringify(design, null, 2) + '\n');
console.log('Stage 80 content-density migration prepared:', design.assetDigest);
