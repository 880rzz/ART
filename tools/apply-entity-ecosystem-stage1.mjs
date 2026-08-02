import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const textExtensions = new Set(['.html', '.json', '.jsonld', '.txt', '.md', '.js', '.mjs', '.py', '.xml']);
const replacements = new Map([
  ['https://www.banhalmi.art/#studio-vienna', 'https://www.norbertbanhalmi.com/#vienna-studio'],
  ['https://www.banhalmi.art/#studio-budapest', 'https://www.norbertbanhalmi.com/#budapest-studio']
]);
const changed = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    let text = await readFile(full, 'utf8');
    const original = text;
    for (const [from, to] of replacements) text = text.replaceAll(from, to);
    if (text !== original) {
      await writeFile(full, text, 'utf8');
      changed.push(path.relative(root, full).replaceAll(path.sep, '/'));
    }
  }
}

await walk(root);

const homepages = {
  'index.html': {
    label: 'Official BANHALMI network',
    professional: 'Professional website',
    archive: 'Art archive',
    blog: 'Essays & blog',
    professionalUrl: 'https://www.norbertbanhalmi.com/',
    archiveUrl: 'https://www.banhalmi.art/'
  },
  'hu/index.html': {
    label: 'A BANHALMI hivatalos oldalai',
    professional: 'Szakmai oldal',
    archive: 'Művészeti archívum',
    blog: 'Esszék és blog',
    professionalUrl: 'https://www.norbertbanhalmi.com/hu/',
    archiveUrl: 'https://www.banhalmi.art/hu/'
  },
  'de-at/index.html': {
    label: 'Offizielle BANHALMI Seiten',
    professional: 'Professionelle Website',
    archive: 'Kunstarchiv',
    blog: 'Essays und Blog',
    professionalUrl: 'https://www.norbertbanhalmi.com/de-at/',
    archiveUrl: 'https://www.banhalmi.art/de-at/'
  }
};

for (const [relative, labels] of Object.entries(homepages)) {
  const file = path.join(root, relative);
  let html = await readFile(file, 'utf8');
  if (html.includes('data-banhalmi-ecosystem')) continue;
  const nav = `<nav class="banhalmi-ecosystem" data-banhalmi-ecosystem aria-label="${labels.label}"><a href="${labels.professionalUrl}">${labels.professional}</a><a href="${labels.archiveUrl}" aria-current="page">${labels.archive}</a><a href="https://blog.banhalmi.art/">${labels.blog}</a></nav>`;
  if (!html.includes('</footer>')) throw new Error(`${relative}: footer closing tag missing`);
  html = html.replace('</footer>', `${nav}</footer>`);
  await writeFile(file, html, 'utf8');
  changed.push(relative);
}

console.log(`Stage-one ART entity ecosystem migration updated ${new Set(changed).size} files.`);
