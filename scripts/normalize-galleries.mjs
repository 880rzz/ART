import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
for (const prefix of ['', 'hu', 'de-at']) {
  const dir = path.join(root, prefix, 'exhibitions');
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.html')) files.push(path.join(dir, name));
  }
}

const labels = {
  en: { more: 'Load 15 more works', gallery: 'Works from the exhibition' },
  hu: { more: 'További 15 mű betöltése', gallery: 'Művek a kiállításról' },
  'de-AT': { more: 'Weitere 15 Werke laden', gallery: 'Werke aus der Ausstellung' },
};

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const lang = html.match(/<html\s+lang="([^"]+)"/)?.[1] || 'en';
  const copy = labels[lang] || labels.en;
  if (html.includes('id="galwrap"')) continue;
  const galleryMatch = html.match(/<div class="collage">([\s\S]*?)<\/div><p class="meta"/);
  if (!galleryMatch) continue;

  const figures = [...galleryMatch[1].matchAll(/<figure>[\s\S]*?<\/figure>/g)].map((m) => m[0]);
  if (!figures.length) continue;

  const batches = [];
  for (let i = 0; i < figures.length; i += 15) {
    const hidden = i === 0 ? '' : ' hidden';
    batches.push(`<div class="gal-batch"${hidden}>${figures.slice(i, i + 15).join('')}</div>`);
  }

  const collage = `<div class="collage" id="galwrap" data-step="15" data-total="${figures.length}">${batches.join('')}</div>`;
  const button = figures.length > 15
    ? `<button class="btn gal-more" id="galmore" type="button" data-shown="15" data-label="${copy.more}">${copy.more} (15/${figures.length})</button>`
    : '';
  html = html.replace(galleryMatch[0], `${collage}${button}<p class="meta"`);

  if (!html.includes('.gal-batch{display:contents}')) {
    html = html.replace('.gal-batch[hidden]{display:none}', '.gal-batch{display:contents}\n.gal-batch[hidden]{display:none}\n.gal-more{display:block;margin:2rem auto 0}');
  }
  fs.writeFileSync(file, html);
}

const allHtml = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) allHtml.push(full);
  }
}
walk(root);
for (const file of allHtml) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('section[id]{scroll-margin-top:')) continue;
  html = html.replace('</style>', 'section[id]{scroll-margin-top:6rem}\n</style>');
  fs.writeFileSync(file, html);
}
