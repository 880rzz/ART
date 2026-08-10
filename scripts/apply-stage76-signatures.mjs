import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const runtimePath = path.join(root, 'assets/js/responsive-header-system.js');
const cssPath = path.join(root, 'assets/css/record-editorial-system.css');
const testPath = path.join(root, 'tests/audit-record-editorial-stage75.mjs');
const configPath = path.join(root, 'data/design-release.json');

let runtime = await readFile(runtimePath, 'utf8');
if (!runtime.includes('body.dataset.recordSlug')) {
  const needle = "  if (isExhibitionRecord) body.dataset.recordType = 'exhibition';\n  else if (isBookRecord) body.dataset.recordType = 'book';\n";
  const replacement = "  if (isExhibitionRecord) {\n    body.dataset.recordType = 'exhibition';\n    body.dataset.recordSlug = (cleanPath.split('/').pop() || '').replace(/\\.html$/i, '');\n  } else if (isBookRecord) {\n    body.dataset.recordType = 'book';\n    body.dataset.recordSlug = (cleanPath.split('/').pop() || '').replace(/\\.html$/i, '');\n  }\n";
  if (!runtime.includes(needle)) throw new Error('Stage 76 runtime insertion anchor not found');
  runtime = runtime.replace(needle, replacement);
  await writeFile(runtimePath, runtime);
}

let css = await readFile(cssPath, 'utf8');
if (!css.includes('/* Stage 76 — exhibition signatures */')) {
  css += `\n\n/* Stage 76 — exhibition signatures\n   Four landmark exhibitions now have recognisable editorial pacing without\n   changing archival facts, schema or the two-blue BANHALMI palette. */\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"]{--record-measure:66ch}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"] header.sub .wrap{max-width:1220px!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"] header.sub h1{max-width:15ch!important;font-size:clamp(3rem,7vw,6.25rem)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"] header.sub::after{width:min(62vw,880px);right:-10vw;background:radial-gradient(circle,rgba(175,196,217,.24) 0%,rgba(183,156,68,.07) 30%,transparent 68%)}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"] .collage{columns:2!important;column-gap:clamp(22px,3vw,46px)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"] .collage figure:nth-child(3n+1){break-inside:avoid;margin-bottom:clamp(34px,5vw,68px)!important}\n\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"]{--record-measure:62ch;--record-line:rgba(175,196,217,.22)}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"] header.sub h1{max-width:14ch!important;letter-spacing:-.035em!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"] main section>.wrap{max-width:1060px!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"] main section h2{padding-left:1rem;border-left:2px solid var(--record-gold)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"] .collage{columns:2!important;column-gap:clamp(16px,2vw,26px)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"] .collage figcaption{font-size:.82rem!important;max-width:52ch}\n\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"]{--record-measure:70ch}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] header.sub .wrap{max-width:1140px!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] header.sub h1{max-width:16ch!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] main>section{padding-block:clamp(4.75rem,9vw,8rem)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] .collage{columns:2!important;column-gap:clamp(28px,4vw,58px)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] .collage figure:nth-child(even){margin-top:clamp(22px,4vw,54px)!important}\n\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"]{--record-line:rgba(175,196,217,.26)}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] header.sub::after{border-radius:0;aspect-ratio:1.35;right:-8vw;top:6%;background:transparent;border:1px solid rgba(183,156,68,.26);transform:rotate(-3deg)}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] main section>.wrap{max-width:1120px!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] .collage{columns:2!important;column-gap:clamp(22px,3vw,42px)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] .collage figure{padding:clamp(8px,1vw,14px)!important;border:1px solid var(--record-line)!important}\nbody.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] .collage figcaption{padding:.75rem .2rem .15rem!important}\n\n@media(max-width:640px){\n  body.apple-archive[data-record-type="exhibition"][data-record-slug="euforia"] .collage,\n  body.apple-archive[data-record-type="exhibition"][data-record-slug="merfoldkovek1956"] .collage,\n  body.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] .collage,\n  body.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] .collage{columns:1!important}\n  body.apple-archive[data-record-type="exhibition"][data-record-slug="anovilaga"] .collage figure:nth-child(even){margin-top:0!important}\n  body.apple-archive[data-record-type="exhibition"][data-record-slug="theframe"] header.sub::after{right:-30vw;top:20%;width:78vw}\n}\n`;
  await writeFile(cssPath, css);
}

let test = await readFile(testPath, 'utf8');
if (!test.includes('Stage 76 exhibition signature selectors are missing')) {
  const anchor = "must(css.includes('@media(max-width:640px)'), 'record system has no mobile contract');\n";
  const addition = "must(runtime.includes('body.dataset.recordSlug'), 'runtime does not expose the canonical record slug');\nmust(['euforia','merfoldkovek1956','anovilaga','theframe'].every((slug) => css.includes(`[data-record-slug=\\\"${slug}\\\"]`)), 'Stage 76 exhibition signature selectors are missing');\n";
  if (!test.includes(anchor)) throw new Error('Stage 76 test insertion anchor not found');
  test = test.replace(anchor, anchor + addition);
  await writeFile(testPath, test);
}

const config = JSON.parse(await readFile(configPath, 'utf8'));
config.release = '20260810-exhibition-signatures-v76';
config.note = 'Stage 76 exhibition signatures: EUFÓRIA, Milestones 1956, The World of Woman and The Frame gain distinct museum-editorial pacing across EN/HU/DE-AT while preserving the shared two-blue palette, content, schema and archive structure.';
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

execFileSync('npm', ['run', 'bump:release'], { cwd: root, stdio: 'inherit' });

const footerPath = path.join(root, 'assets/css/footer-elegant.css');
let footer = await readFile(footerPath, 'utf8');
footer = footer.replace(/palette-blue-final\.css\?v=[^')\"]+/g, `palette-blue-final.css?v=${config.release}`);
await writeFile(footerPath, footer);

const hash = createHash('sha256');
for (const name of (await readdir(path.join(root, 'assets/css'))).filter((f) => f.endsWith('.css')).sort()) hash.update(await readFile(path.join(root, 'assets/css', name)));
for (const name of (await readdir(path.join(root, 'assets/js'))).filter((f) => f.endsWith('.js')).sort()) hash.update(await readFile(path.join(root, 'assets/js', name)));
for (const name of (await readdir(path.join(root, 'assets/video'))).filter((f) => f.endsWith('.mp4')).sort()) hash.update(await readFile(path.join(root, 'assets/video', name)));
config.assetDigest = hash.digest('hex').slice(0, 16);
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

console.log(`Stage 76 migration prepared at ${config.release} with digest ${config.assetDigest}.`);