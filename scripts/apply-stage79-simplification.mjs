import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const oldRelease = '20260810-exhibition-families-v78';
const newRelease = '20260810-simplified-authority-v79';
const authorityPath = path.join(root, 'assets/css/homepage-two-tone-authority.css');
const designAuditPath = path.join(root, 'tests/audit-design-ecosystem-stage51.mjs');

let authority = await readFile(authorityPath, 'utf8');
if (!authority.includes('Stage 79 — visual simplification')) {
  authority += `

/* Stage 79 — visual simplification
   One final Apple-like authority across every content page: less decorative
   chrome, clearer reading hierarchy and fewer competing visual signals. */

/* The homepage BANHALMI wordmark is the primary editorial title. Give it the
   same cool-blue-to-BANHALMI-gold treatment used by the site's meaningful
   title accents, with an explicit selector so no legacy hero rule can flatten it. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main[data-narrative="life-journey"]>header.hero h1{
  color:#DCE7F1!important;
}
@supports ((-webkit-background-clip:text) or (background-clip:text)){
  html body.apple-archive.apple-archive.apple-archive.apple-archive main[data-narrative="life-journey"]>header.hero h1{
    background:linear-gradient(102deg,#F5F5F7 0%,#DCE7F1 28%,#AFC4D9 62%,#B79C44 100%)!important;
    -webkit-background-clip:text!important;
    background-clip:text!important;
    -webkit-text-fill-color:transparent!important;
    color:transparent!important;
  }
}

/* The old ornamental divider is redundant once the title carries the visual
   signature. Removing it makes the opening composition calmer on all three homepages. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main[data-narrative="life-journey"]>header.hero .hero-line{
  display:none!important;
}

/* Buttons stay recognisable but lose layered shadows and glass effects. */
html body.apple-archive.apple-archive.apple-archive.apple-archive :is(.btn,.svc-cta,.presence-link){
  box-shadow:none!important;
  filter:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive .btn{
  border-radius:12px!important;
}

/* Disclosures are information architecture, not cards. Across archive,
   curatorial, exhibition and book pages they become quiet ruled rows. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main details{
  box-shadow:none!important;
  filter:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}

/* Repeated information containers should not compete with photographs and
   headings. Existing structure remains; only excess visual chrome is removed. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.facts,.source-list,.record-links,.record-relationships,.project-evidence){
  box-shadow:none!important;
  filter:none!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.facts li,.source-list li){
  box-shadow:none!important;
}

/* Metadata is secondary: one consistent compact rhythm instead of multiple
   pill/card treatments inherited from older layers. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main :is(.meta,.loc,.fineprint,figcaption,.cap){
  text-shadow:none!important;
}

/* Keep prose readable and visually quiet on every page family. */
html body.apple-archive.apple-archive.apple-archive.apple-archive main section :is(p:not(.label):not(.meta):not(.loc):not(.fineprint),ul:not(.facts),ol){
  max-width:72ch;
}

@media(max-width:640px){
  html body.apple-archive.apple-archive.apple-archive.apple-archive .btn{
    border-radius:10px!important;
  }
}
`;
  await writeFile(authorityPath, authority);
}

/* Propagate the release token through CSS imports and runtime-loaded assets. */
for (const dir of ['assets/css', 'assets/js']) {
  const fullDir = path.join(root, dir);
  for (const name of await readdir(fullDir)) {
    if (!/\.(css|js)$/.test(name)) continue;
    const file = path.join(fullDir, name);
    let text = await readFile(file, 'utf8');
    text = text.replaceAll(oldRelease, newRelease);
    await writeFile(file, text);
  }
}

/* Extend the permanent design gate: all real content pages are inventoried by
   this test already, so lock the simplification authority there too. */
let audit = await readFile(designAuditPath, 'utf8');
if (!audit.includes('Stage79 simplification')) {
  audit = audit.replace(
    "const authority=await readFile('assets/css/homepage-two-tone-authority.css','utf8');for(const token of ['--art-home-hero-title','main.community-page','main.writing-page','main.press-redesign','width:100%!important','header.sub,.curatorial-hero) h1','art-hero-accent','title-accent','-webkit-background-clip:text','main>section::before','width:100vw!important'])if(!authority.includes(token))errors.push('homepage-two-tone-authority.css: missing final design authority token '+token);",
    "const authority=await readFile('assets/css/homepage-two-tone-authority.css','utf8');for(const token of ['--art-home-hero-title','main.community-page','main.writing-page','main.press-redesign','width:100%!important','header.sub,.curatorial-hero) h1','art-hero-accent','title-accent','-webkit-background-clip:text','main>section::before','width:100vw!important','Stage 79 — visual simplification','main[data-narrative=\\\"life-journey\\\"]>header.hero h1','main details','backdrop-filter:none!important'])if(!authority.includes(token))errors.push('homepage-two-tone-authority.css: missing final design authority token '+token);"
  );
  audit = audit.replace(
    "console.log('Stage51 passed: '+pages+' live ART pages, '+sections+' main sections and '+redirects+' redirect stubs inventoried; full-width page canvas, two-tone full-bleed rhythm, unified hero scale, Apple-style title emphasis, lean homepage schema and three-property entity ecosystem locked.');",
    "console.log('Stage51/79 passed: '+pages+' live ART pages, '+sections+' main sections and '+redirects+' redirect stubs inventoried; full-width two-tone canvas, unified hero scale, gradient BANHALMI homepage title and simplified low-chrome content authority locked.');"
  );
  await writeFile(designAuditPath, audit);
}

/* Write release first, then let the canonical bump script rewrite all 262 HTML
   asset URLs. The asset digest covers CSS/JS/video only, so HTML rewriting does
   not invalidate it. */
const hash = crypto.createHash('sha256');
for (const name of (await readdir(path.join(root, 'assets/css'))).filter(f=>f.endsWith('.css')).sort()) hash.update(await readFile(path.join(root, 'assets/css', name)));
for (const name of (await readdir(path.join(root, 'assets/js'))).filter(f=>f.endsWith('.js')).sort()) hash.update(await readFile(path.join(root, 'assets/js', name)));
for (const name of (await readdir(path.join(root, 'assets/video'))).filter(f=>f.endsWith('.mp4')).sort()) hash.update(await readFile(path.join(root, 'assets/video', name)));
const releasePath = path.join(root, 'data/design-release.json');
const release = JSON.parse(await readFile(releasePath, 'utf8'));
release.release = newRelease;
release.note = 'Stage 79 simplification: explicit blue-to-gold BANHALMI homepage title and lower-chrome buttons, disclosures, metadata and information containers across all EN/HU/DE-AT content pages.';
release.assetDigest = hash.digest('hex').slice(0,16);
await writeFile(releasePath, JSON.stringify(release, null, 2) + '\n');
console.log(`Stage 79 prepared: ${newRelease}, digest ${release.assetDigest}.`);
