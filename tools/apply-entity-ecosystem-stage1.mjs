import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const textExtensions = new Set(['.html', '.json', '.jsonld', '.txt', '.md', '.js', '.mjs', '.py', '.xml']);
const replacements = new Map([
  ['https://www.banhalmi.art/#studio-vienna', 'https://www.norbertbanhalmi.com/#vienna-studio'],
  ['https://www.banhalmi.art/#studio-budapest', 'https://www.norbertbanhalmi.com/#budapest-studio']
]);
const changed = new Set();
const htmlFiles = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) continue;
    let text = await readFile(full, 'utf8');
    const original = text;
    for (const [from, to] of replacements) text = text.replaceAll(from, to);
    if (text !== original) {
      await writeFile(full, text, 'utf8');
      changed.add(path.relative(root, full).replaceAll(path.sep, '/'));
    }
    if (extension === '.html') htmlFiles.push(full);
  }
}

await walk(root);

function labelsFor(html) {
  const lang = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
  if (lang.startsWith('hu')) {
    return {
      label: 'A BANHALMI hivatalos oldalai',
      professional: 'Szakmai oldal',
      archive: 'Művészeti archívum',
      blog: 'Esszék és blog',
      professionalUrl: 'https://www.norbertbanhalmi.com/hu/',
      archiveUrl: 'https://www.banhalmi.art/hu/'
    };
  }
  if (lang.startsWith('de')) {
    return {
      label: 'Offizielle BANHALMI Seiten',
      professional: 'Professionelle Website',
      archive: 'Kunstarchiv',
      blog: 'Essays und Blog',
      professionalUrl: 'https://www.norbertbanhalmi.com/de-at/',
      archiveUrl: 'https://www.banhalmi.art/de-at/'
    };
  }
  return {
    label: 'Official BANHALMI network',
    professional: 'Professional website',
    archive: 'Art archive',
    blog: 'Essays & blog',
    professionalUrl: 'https://www.norbertbanhalmi.com/',
    archiveUrl: 'https://www.banhalmi.art/'
  };
}

for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const isRedirectOrNoindex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || /window\.location\.(?:replace|href)/i.test(html);
  if (isRedirectOrNoindex || !html.includes('</footer>') || html.includes('data-banhalmi-ecosystem')) continue;
  const labels = labelsFor(html);
  const nav = `<nav class="banhalmi-ecosystem" data-banhalmi-ecosystem aria-label="${labels.label}"><a href="${labels.professionalUrl}">${labels.professional}</a><a href="${labels.archiveUrl}" aria-current="page">${labels.archive}</a><a href="https://blog.banhalmi.art/">${labels.blog}</a></nav>`;
  html = html.replace('</footer>', `${nav}</footer>`);
  await writeFile(file, html, 'utf8');
  changed.add(relative);
}

console.log(`Stage-one ART entity ecosystem migration updated ${changed.size} files.`);
