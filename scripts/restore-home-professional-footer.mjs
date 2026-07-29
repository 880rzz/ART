import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

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

const changed = [];
for (const [rel, copy] of Object.entries(pages)) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  const block = `<div class="note professional-side" style="margin-top:2.5rem"><p class="label" style="margin-bottom:.5rem">${copy.label}</p><p>${copy.text}</p><p class="professional-side__cta"><a class="btn" href="${copy.href}" target="_blank" rel="noopener">${copy.cta}</a></p></div>`;
  let content = original.replace(/<div class="note(?: professional-side)?" style="margin-top:2\.5rem"><p class="label" style="margin-bottom:\.5rem">(?:The professional side|A professzionális oldal|Die professionelle Seite|A szakmai oldal)<\/p>(?:[\s\S]*?)<\/div>/i, block);
  if (!content.includes('class="professional-side"') && content.includes('</div></section>')) {
    content = content.replace(/(<section id="contact"[\s\S]*?)(<\/div><\/section>)/i, `$1${block}\n$2`);
  }
  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
