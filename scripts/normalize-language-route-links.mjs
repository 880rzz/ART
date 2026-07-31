import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  ['index.html', '/curators.html'],
  ['hu/index.html', '/hu/curators.html'],
  ['de-at/index.html', '/de-at/curators.html']
];

const changed = [];
for (const [rel, curatorHref] of pages) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  let html = original;

  html = html.replace(
    /(<a\b[^>]*class="presence-link"[^>]*href=")[^"]*("[^>]*>)/i,
    `$1${curatorHref}$2`
  );

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));