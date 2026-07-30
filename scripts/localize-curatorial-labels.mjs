import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = [
  ['curators.html', 'Curatorial framework'],
  ['hu/curators.html', 'Kurátori keretrendszer'],
  ['de-at/curators.html', 'Kuratorischer Rahmen']
];

const changed = [];
for (const [rel, label] of pages) {
  const file = path.join(root, rel);
  const original = await readFile(file, 'utf8');
  const content = original.replace(
    /(<section id="curatorial-periods"[\s\S]*?<p class="label">)[\s\S]*?(<\/p>)/i,
    `$1${label}$2`
  );
  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed.push(rel);
  }
}

console.log(JSON.stringify({ changed, total: changed.length }, null, 2));