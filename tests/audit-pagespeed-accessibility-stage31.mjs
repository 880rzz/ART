import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (p) => readFile(path.join(root, p), 'utf8');
const errors = [];

const css = await read('assets/css/site.css');
const llms = await read('llms.txt');
const release = JSON.parse(await read('data/design-release.json'));
const optimizer = await read('scripts/optimize-pages-artifact.mjs');

for (const t of [
  'ART-TITLE-LINK-AFFORDANCE-20261102:START',
  'ART-TITLE-LINK-AFFORDANCE-20261102:END',
  'ART-LINK-ROW-GAP-20261102:START',
  'body.apple-archive :is(.service-actions,.hero-actions)',
  'body.apple-archive > nav .brand-word',
  'top:-2px',
  'body.apple-archive :is(h1,h2):not(.hero-title-visually-hidden):not(.no-title-gradient)',
  'linear-gradient(90deg,#EDF4FA,#A9C4DE 48%,#DCC56B 88%)',
  'a[data-external="true"]::after',
  'content:"\\00A0↗"',
  'main a.btn-link:not([data-external])',
  'text-decoration-line:none!important',
  'One clear line of air between title and body',
  'clamp(12px,1.15vw,26px)',
  'clamp(16px,1.5vw,28px)'
]) if (!css.includes(t)) errors.push('title/link affordance missing ' + t);

if (!llms.startsWith('# BANHALMI ART\n\n>')) errors.push('llms.txt must begin with H1 then blockquote summary');
for (const t of [
  'Vienna and Budapest are the two active operational bases',
  'New York is a major international reference and oeuvre chapter',
  'New York is not a studio, office, headquarters or operational base'
]) if (!llms.includes(t)) errors.push('llms geography context missing ' + t);

if (!/^\d{8}-[a-z0-9-]+-v\d+$/i.test(release.release)) errors.push('invalid release ' + release.release);
if (!/^[a-f0-9]{16}$/i.test(release.assetDigest)) errors.push('invalid asset digest ' + release.assetDigest);
for (const t of [
  'bundleFor(links)',
  'content-hashed CSS bundles',
  "rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html'",
  'validateResponsiveHeaderRuntime'
]) if (!optimizer.includes(t)) errors.push('production optimizer missing ' + t);

for (const file of ['index.html', 'hu/index.html', 'de-at/index.html']) {
  const h = await read(file);
  if (!h.includes('class="bg hero-bg-img"') || !h.includes('fetchpriority="high"')) {
    errors.push(file + ': hero must remain eager/high-priority image');
  }
}

const headings = {
  'index.html': ['<h3>Recognition</h3>', '<h3>Education</h3>'],
  'hu/index.html': ['<h3>Elismerések</h3>', '<h3>Tanulmányok</h3>'],
  'de-at/index.html': ['<h3>Anerkennungen</h3>', '<h3>Ausbildung</h3>']
};
for (const [file, tokens] of Object.entries(headings)) {
  const h = await read(file);
  for (const t of tokens) if (!h.includes(t)) errors.push(`${file}: sequential heading missing ${t}`);
}

const ctas = {
  'index.html': [
    ['books/book-ebredes.html', 'Book page — Awakening: The New Beginning! — Book', 'Book page →'],
    ['books/book-szosszenetek.html', 'Book page — Snippets', 'Book page →'],
    ['books/book-anovilaga.html', 'Book page — The World of Woman', 'Book page →']
  ],
  'hu/index.html': [
    ['books/book-ebredes.html', 'Könyvoldal — Ébredés — az Új kezdet!', 'Könyvoldal →'],
    ['books/book-szosszenetek.html', 'Könyvoldal — Szösszenetek', 'Könyvoldal →'],
    ['books/book-anovilaga.html', 'Könyvoldal — A Nő világa', 'Könyvoldal →']
  ],
  'de-at/index.html': [
    ['books/book-ebredes.html', 'Buchseite — Erwachen: Der neue Anfang! — Buch', 'Buchseite →'],
    ['books/book-szosszenetek.html', 'Buchseite — Schnipsel', 'Buchseite →'],
    ['books/book-anovilaga.html', 'Buchseite — Die Welt der Frau', 'Buchseite →']
  ]
};
for (const [file, contracts] of Object.entries(ctas)) {
  const h = await read(file);
  for (const [href, label, visible] of contracts) {
    const x = `<a href="${href}" aria-label="${label}">${visible}</a>`;
    if (!h.includes(x)) errors.push(`${file}: CTA accessible name missing ${href}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`ART PageSpeed/accessibility audit passed on ${release.release}: title gradient + non-underline link affordance (internal gold / external ↗), semantic headings, nine destination-specific Book CTAs, LCP image and production bundle/runtime validation are intact.`);
