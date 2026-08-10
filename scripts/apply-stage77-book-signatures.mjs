import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cssPath = path.join(root, 'assets/css/record-editorial-system.css');
const runtimePath = path.join(root, 'assets/js/responsive-header-system.js');
const testPath = path.join(root, 'tests/audit-record-editorial-stage75.mjs');
const configPath = path.join(root, 'data/design-release.json');
const footerPath = path.join(root, 'assets/css/footer-elegant.css');
const releaseToken = '20260810-book-signatures-v77';

let css = await readFile(cssPath, 'utf8');
if (!css.includes('/* Stage 77 — book signatures */')) {
  css += `\n\n/* Stage 77 — book signatures\n   The three photography books retain one shared museum catalogue system, but\n   each title now has its own editorial cadence. No archival text, schema,\n   canonical route or BANHALMI two-blue/gold colour authority is changed. */\n\n/* Awakening — intimate, human, quiet. */\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"]{--record-measure:64ch;--record-line:rgba(175,196,217,.18)}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] header.sub .wrap{max-width:1040px!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] header.sub h1{max-width:14ch!important;letter-spacing:-.038em!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] header.sub::after{width:min(58vw,760px);right:-9vw;top:-18%;background:radial-gradient(circle,rgba(175,196,217,.22) 0%,rgba(183,156,68,.08) 28%,transparent 68%)}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] .book-lead{grid-template-columns:minmax(210px,.64fr) minmax(0,1.28fr)!important;gap:clamp(3rem,8vw,8rem)!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] .book-lead .book-cover{max-width:380px!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] main section h2{max-width:16ch!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] main details>summary{font-weight:520!important}\n\n/* Fragments — compact notebook / essay rhythm. */\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"]{--record-measure:60ch;--record-line:rgba(175,196,217,.22)}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] header.sub .wrap{max-width:980px!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] header.sub h1{max-width:12ch!important;font-size:clamp(2.8rem,6vw,5rem)!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] header.sub::after{width:min(42vw,560px);aspect-ratio:1.35;right:-6vw;top:8%;border-radius:0;background:transparent;border:1px solid rgba(183,156,68,.22);transform:rotate(2deg)}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] .book-lead{grid-template-columns:minmax(200px,.58fr) minmax(0,1.15fr)!important;gap:clamp(2.25rem,6vw,5.5rem)!important;align-items:start!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] .book-lead .book-cover{max-width:350px!important;margin-top:clamp(.5rem,2vw,1.5rem)!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] .facts{grid-template-columns:1fr!important;max-width:760px!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] main section h2{padding-left:1rem;border-left:2px solid var(--record-gold)!important}\n\n/* The World of Woman — broader art-book spread and more gallery-like air. */\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"]{--record-measure:70ch}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] header.sub .wrap{max-width:1180px!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] header.sub h1{max-width:16ch!important;font-size:clamp(3rem,6.7vw,5.8rem)!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] header.sub::after{width:min(66vw,900px);right:-16vw;top:-30%;background:radial-gradient(circle,rgba(83,111,143,.28) 0%,rgba(175,196,217,.10) 34%,transparent 70%)}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] .book-lead{grid-template-columns:minmax(260px,.88fr) minmax(0,1.25fr)!important;gap:clamp(3.5rem,8vw,8.5rem)!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] .book-lead .book-cover{max-width:470px!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] main>section{padding-block:clamp(4.75rem,9vw,8rem)!important}\nbody.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] main section>.wrap{max-width:1220px!important}\n\n@media(max-width:900px){\n  body.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] .book-lead,\n  body.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] .book-lead,\n  body.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] .book-lead{grid-template-columns:1fr!important;gap:2.75rem!important}\n}\n@media(max-width:640px){\n  body.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] header.sub::after{right:-28vw;top:6%;width:76vw}\n  body.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] header.sub::after{right:-32vw;top:20%;width:72vw}\n  body.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] header.sub::after{right:-36vw;top:4%;width:88vw}\n  body.apple-archive[data-record-type="book"][data-record-slug="book-ebredes"] .book-lead .book-cover,\n  body.apple-archive[data-record-type="book"][data-record-slug="book-szosszenetek"] .book-lead .book-cover,\n  body.apple-archive[data-record-type="book"][data-record-slug="book-anovilaga"] .book-lead .book-cover{width:min(74vw,360px)!important;margin-inline:auto!important}\n}\n`;
  await writeFile(cssPath, css);
}

let test = await readFile(testPath, 'utf8');
if (!test.includes('Stage 77 book signature selectors are missing')) {
  const anchor = "must(['euforia','merfoldkovek1956','anovilaga','theframe'].every((slug) => css.includes(`[data-record-slug=\\\"${slug}\\\"]`)), 'Stage 76 exhibition signature selectors are missing');\n";
  const addition = "must(['book-ebredes','book-szosszenetek','book-anovilaga'].every((slug) => css.includes(`[data-record-slug=\\\"${slug}\\\"]`)), 'Stage 77 book signature selectors are missing');\n";
  if (!test.includes(anchor)) throw new Error('Stage 77 test insertion anchor not found');
  test = test.replace(anchor, anchor + addition);
  await writeFile(testPath, test);
}

const config = JSON.parse(await readFile(configPath, 'utf8'));
config.release = releaseToken;
config.note = 'Stage 77 book signatures: Awakening, Fragments and The World of Woman gain distinct museum-editorial pacing across EN/HU/DE-AT while preserving shared two-blue/gold authority, content, schema and archive routes.';
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

let runtime = await readFile(runtimePath, 'utf8');
runtime = runtime.replace(/archive-content-flow\.css\?v=[^'\"]+/g, `archive-content-flow.css?v=${releaseToken}`);
runtime = runtime.replace(/record-editorial-system\.css\?v=[^'\"]+/g, `record-editorial-system.css?v=${releaseToken}`);
await writeFile(runtimePath, runtime);

let footer = await readFile(footerPath, 'utf8');
footer = footer.replace(/palette-blue-final\.css\?v=[^')\"]+/g, `palette-blue-final.css?v=${releaseToken}`);
await writeFile(footerPath, footer);

execFileSync('npm', ['run', 'bump:release'], { cwd: root, stdio: 'inherit' });

const hash = createHash('sha256');
for (const name of (await readdir(path.join(root, 'assets/css'))).filter((f) => f.endsWith('.css')).sort()) hash.update(await readFile(path.join(root, 'assets/css', name)));
for (const name of (await readdir(path.join(root, 'assets/js'))).filter((f) => f.endsWith('.js')).sort()) hash.update(await readFile(path.join(root, 'assets/js', name)));
for (const name of (await readdir(path.join(root, 'assets/video'))).filter((f) => f.endsWith('.mp4')).sort()) hash.update(await readFile(path.join(root, 'assets/video', name)));
config.assetDigest = hash.digest('hex').slice(0, 16);
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

console.log(`Stage 77 book signature migration prepared at ${config.release} with digest ${config.assetDigest}.`);
