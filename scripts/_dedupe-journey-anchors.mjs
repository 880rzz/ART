import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

for (const rel of ['index.html', 'de-at/index.html']) {
  const file = path.join(root, rel);
  let html = await readFile(file, 'utf8');
  const inserted = /(<section id="journey" class="tone-a"><div class="wrap">)\s*<span id="presence-periods" class="archive-anchor" aria-hidden="true"><\/span>/;
  if (!inserted.test(html)) throw new Error(`${rel}: inserted journey anchor was not found`);
  html = html.replace(inserted, '$1');

  const count = (html.match(/\sid=["']presence-periods["']/g) || []).length;
  if (count !== 1) throw new Error(`${rel}: expected one preserved #presence-periods anchor, found ${count}`);
  await writeFile(file, html, 'utf8');
}

console.log('Existing presence-periods anchors preserved; translated journey sections contain no duplicate IDs.');
