import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = JSON.parse(await readFile(path.join(root, 'data/archive/books.hu.json'), 'utf8'));
const changed = [];

for (const [rel, page] of Object.entries(pages)) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  let html = original;

  html = html.replace(
    /<p class="label" style="margin-bottom:\.4rem">[^<]*<\/p>/,
    `<p class="label" style="margin-bottom:.4rem">${page.labelNew}</p>`
  );

  const bookTextPattern = /(<div class="book-text">\s*<p class="label" style="margin-bottom:\.4rem">[^<]*<\/p>)([\s\S]*?)(\s*<p class="meta">)/;
  if (!bookTextPattern.test(html)) throw new Error(`${rel}: a könyvszöveg blokk nem található`);
  html = html.replace(bookTextPattern, `$1\n    ${page.bodyNew.trim()}$3`);

  const backSection = '<section class="wrap narrow"><a class="btn" href="../index.html#books">← Összes könyv</a></section>';
  if (!html.includes(page.related)) {
    if (!html.includes(backSection)) throw new Error(`${rel}: a könyv-visszalépő szakasz nem található`);
    html = html.replace(backSection, `${page.related}\n${backSection}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed }, null, 2));
