import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const footerStylesheet = '<link rel="stylesheet" href="/assets/css/footer-elegant.css?v=20260729-elegant-v1">';

const pages = {
  'index.html': {
    label: 'The professional side',
    text: 'Current executive portrait, visual branding and corporate photography commissions are presented on the professional BANHALMI website.',
    cta: 'Explore professional services →',
    href: 'https://www.norbertbanhalmi.com/#services'
  },
  'hu/index.html': {
    label: 'A professzionális oldal',
    text: 'Az executive portré-, vizuális branding- és vállalati fotográfiai megbízások a BANHALMI professzionális weboldalán találhatók.',
    cta: 'Professzionális szolgáltatások →',
    href: 'https://www.norbertbanhalmi.com/hu/#services'
  },
  'de-at/index.html': {
    label: 'Die professionelle Seite',
    text: 'Aktuelle Executive-Porträts, visuelle Markenpositionierung und Unternehmensfotografie finden Sie auf der professionellen BANHALMI Website.',
    cta: 'Professionelle Leistungen →',
    href: 'https://www.norbertbanhalmi.com/de-at/#services'
  }
};

const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.github'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) files.push(file);
  }
}
await walk(root);

const changed = [];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const original = await readFile(file, 'utf8');
  let content = original.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/footer-elegant\.css(?:\?v=[^"]+)?">/gi, '');
  content = content.replace(/<\/head>/i, `${footerStylesheet}\n</head>`);

  const copy = pages[rel];
  if (copy) {
    const block = `<div class="note professional-side" style="margin-top:2.5rem"><p class="label" style="margin-bottom:.5rem">${copy.label}</p><p>${copy.text}</p><p class="professional-side__cta"><a class="btn" href="${copy.href}" target="_blank" rel="noopener">${copy.cta}</a></p></div>`;
    content = content.replace(/<div class="note(?: professional-side)?" style="margin-top:2\.5rem"><p class="label" style="margin-bottom:\.5rem">(?:The professional side|A professzionális oldal|Die professionelle Seite|A szakmai oldal)<\/p>(?:[\s\S]*?)<\/div>/i, block);
    if (!content.includes('class="note professional-side"')) {
      content = content.replace(/(<section id="contact"[\s\S]*?)(<\/div><\/section>)/i, `$1${block}\n$2`);
    }
  }

  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
