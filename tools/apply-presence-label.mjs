import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const replacements = new Map([
  ['Saját szavaimmal', 'A jelenlét nyomában'],
  ['In my own words', 'In pursuit of presence'],
  ['Mit meinen eigenen Worten', 'Auf den Spuren der Präsenz']
]);
const extraFiles = new Set([
  'tools/audit_record_depth.py',
  'tests/audit-language-purity.mjs',
  'AUDIT-NYELV-ES-LINKEK-2026-08-01.md'
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
    const relative = path.relative(root, full).replaceAll(path.sep, '/');
    if (!relative.endsWith('.html') && !extraFiles.has(relative)) continue;
    let text = await readFile(full, 'utf8');
    const original = text;
    for (const [from, to] of replacements) text = text.replaceAll(from, to);
    if (text !== original) {
      await writeFile(full, text, 'utf8');
      changed.push(relative);
    }
  }
}

await walk(root);
console.log(`Presence label migration updated ${changed.length} files.`);
for (const file of changed) console.log(file);
