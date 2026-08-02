import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cssPath = path.join(root, 'assets/css/museum-editorial.css');
const marker = '16. Canonical section surface system';
const cssPatch = String.raw`

/* --------------------------------------------------------------------------
   16. Canonical section surface system

   Design audit, 2026-08-02.

   The palette already contained three sufficiently distinct museum grounds,
   but the structural alternation explicitly excluded every section carrying
   tone-a / tone-b / tone-c. The homepage uses those legacy classes on most of
   its major blocks, so several consecutive sections remained visually fused.
   Other pages also mix full-width sections with sections that are themselves
   constrained by .wrap or .narrow, making a background colour stop before the
   viewport edge.

   The surface role is now structural and full-bleed. Legacy tone-a and tone-b
   can no longer bypass the rhythm; tone-c remains the deliberate feature
   surface. A pseudo-element paints the viewport, so the same rule works when
   the section itself is a narrow reading column. The three tones are spaced
   farther apart than before while keeping body, secondary and gold text above
   AA contrast on every surface.
   ----------------------------------------------------------------------- */
:root{
  --mus-ground:#0a0a0a;
  --mus-raised:#202020;
  --mus-panel:#303030;
  --mus-section-edge:rgba(255,255,255,.12);
}

html body.apple-archive main>section,
html body.apple-archive main>.statement,
html body.apple-archive main>header:not(.hero){
  position:relative!important;
  isolation:isolate!important;
  background:transparent!important;
  border:0!important;
  overflow:visible!important;
}

html body.apple-archive main>section{
  --banhalmi-section-surface:var(--mus-ground);
}
html body.apple-archive main>section:nth-of-type(odd){
  --banhalmi-section-surface:var(--mus-ground);
}
html body.apple-archive main>section:nth-of-type(even){
  --banhalmi-section-surface:var(--mus-raised);
}

/* The third tone is editorial emphasis, not another alternating stripe. */
html body.apple-archive main>section.tone-c,
html body.apple-archive main>section.thesis,
html body.apple-archive main>section.sources,
html body.apple-archive main>section.oeuvre-integrity{
  --banhalmi-section-surface:var(--mus-panel);
}

/* Opening context blocks get depth without becoming promotional panels. */
html body.apple-archive main>section.press-types,
html body.apple-archive main>section.presence-context--intro{
  --banhalmi-section-surface:linear-gradient(135deg,#171717 0%,#242424 100%);
}

html body.apple-archive main>section::before,
html body.apple-archive main>.statement::before,
html body.apple-archive main>header:not(.hero)::before{
  content:"";
  position:absolute;
  z-index:-1;
  top:0;
  bottom:0;
  left:50%;
  width:100vw;
  transform:translateX(-50%);
  pointer-events:none;
  box-shadow:inset 0 1px var(--mus-section-edge),inset 0 -1px rgba(0,0,0,.34);
}
html body.apple-archive main>section::before{
  background:var(--banhalmi-section-surface);
}
html body.apple-archive main>header:not(.hero)::before{
  background:var(--mus-ground);
}

/* The quotation between the opening thesis and gallery is a proper visual
   chapter break even though legacy markup uses a div rather than a section. */
html body.apple-archive main>.statement{
  --banhalmi-section-surface:linear-gradient(110deg,#303030 0%,#202020 55%,#171717 100%);
  margin-block:0!important;
  padding-block:clamp(4.25rem,7vw,7rem)!important;
}
html body.apple-archive main>.statement::before{
  background:var(--banhalmi-section-surface);
  box-shadow:inset 0 1px var(--mus-gold-hair),inset 0 -1px rgba(0,0,0,.38);
}
html body.apple-archive main>.statement blockquote{
  max-width:25ch!important;
}

/* Earlier layers drew section borders on the constrained element. The new
   full-width surface owns the boundary, so those partial rules are removed. */
html body.apple-archive main>section+section,
html body.apple-archive main>section.tone-a,
html body.apple-archive main>section.tone-b,
html body.apple-archive main>section.tone-c{
  border-top:0!important;
  border-bottom:0!important;
}

/* One heading rhythm for home, archive, press and curatorial templates. */
html body.apple-archive main>section :is(.intro,.section-head,.curatorial-periods__intro,.oeuvre-integrity-head){
  margin-bottom:clamp(3rem,5.5vw,5.25rem)!important;
}
html body.apple-archive main>section :is(.intro,.section-head,.curatorial-periods__intro,.oeuvre-integrity-head)>:last-child{
  margin-bottom:0!important;
}

/* Notes and utility panels use one restrained inset treatment everywhere. */
html body.apple-archive main>section .note,
html body.apple-archive main>section .professional-side,
html body.apple-archive main>section .press-type-grid>div{
  background:rgba(255,255,255,.026)!important;
  border:1px solid var(--mus-hair)!important;
  box-shadow:none!important;
  border-radius:0!important;
}

@media(max-width:700px){
  html body.apple-archive main>.statement{
    padding-block:3.5rem!important;
  }
  html body.apple-archive main>section :is(.intro,.section-head,.curatorial-periods__intro,.oeuvre-integrity-head){
    margin-bottom:2.6rem!important;
  }
}
`;

let css = await readFile(cssPath, 'utf8');
if (!css.includes(marker)) {
  css = css.trimEnd() + cssPatch + '\n';
  await writeFile(cssPath, css, 'utf8');
}

const testPath = path.join(root, 'tests/audit-section-surfaces.mjs');
const test = String.raw`import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = await readFile(path.join(root, 'assets/css/museum-editorial.css'), 'utf8');
const errors = [];
const required = [
  '16. Canonical section surface system',
  '--mus-ground:#0a0a0a',
  '--mus-raised:#202020',
  '--mus-panel:#303030',
  'main>section:nth-of-type(even)',
  'main>section::before',
  'width:100vw',
  'main>.statement::before'
];
for (const token of required) if (!css.includes(token)) errors.push('museum-editorial.css: missing ' + token);
const finalBlock = css.slice(css.indexOf('16. Canonical section surface system'));
if (finalBlock.includes(':not([class*="tone-"])')) errors.push('final surface system still lets legacy tone classes escape structural alternation');

const skip = new Set(['.git','node_modules','.github','data','reports']);
const files = [];
async function walk(dir){
  for (const entry of await readdir(dir,{withFileTypes:true})){
    if (skip.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
await walk(root);
let pages = 0;
let sections = 0;
for (const file of files){
  const html = await readFile(file,'utf8');
  if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html) || !/<main\b/i.test(html)) continue;
  pages += 1;
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || '';
  sections += (main.match(/<section\b/gi) || []).length;
  const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
  const museum = links.findIndex(h=>h.includes('/assets/css/museum-editorial.css'));
  if (museum < 0) errors.push(path.relative(root,file)+': museum-editorial.css missing');
  else if (museum !== links.length-1) errors.push(path.relative(root,file)+': museum-editorial.css is not the final stylesheet');
}
if (pages < 80) errors.push('surface audit covered unexpectedly few pages: '+pages);
if (sections < 300) errors.push('surface audit covered unexpectedly few sections: '+sections);
if (errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Section surface audit passed: '+sections+' sections across '+pages+' pages use the final full-bleed three-tone system.');
`;
await writeFile(testPath, test, 'utf8');

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
if (!pkg.scripts.test.includes('audit-section-surfaces.mjs')) {
  pkg.scripts.test += ' && node tests/audit-section-surfaces.mjs';
  await writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

const releasePath = path.join(root, 'data/design-release.json');
const release = JSON.parse(await readFile(releasePath, 'utf8'));
release.release = '20260802-surfaces-v21';
release.note = 'Full design audit: every main section now follows one full-bleed three-tone surface rhythm; legacy tone classes no longer flatten consecutive blocks; feature, statement, heading and utility-panel treatments are consistent across all languages and templates.';

const hash = createHash('sha256');
const cssDir = path.join(root, 'assets/css');
for (const name of (await readdir(cssDir)).filter(name=>name.endsWith('.css')).sort()) {
  hash.update(await readFile(path.join(cssDir,name)));
}
const jsDir = path.join(root, 'assets/js');
for (const name of (await readdir(jsDir)).filter(name=>name.endsWith('.js')).sort()) {
  hash.update(await readFile(path.join(jsDir,name)));
}
release.assetDigest = hash.digest('hex').slice(0,16);
await writeFile(releasePath, JSON.stringify(release, null, 2) + '\n', 'utf8');

console.log('Canonical full-bleed section surface system applied.');
