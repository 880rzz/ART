import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve(import.meta.dirname, 'audit-remediate-complete-site.mjs');
const original = await readFile(file, 'utf8');
const corrected = original.replace(/chronologyHref\s*=\s*/g, 'chronologyHref: ');

if (corrected !== original) {
  await writeFile(file, corrected, 'utf8');
  console.log(JSON.stringify({ fixed: true, replacements: (original.match(/chronologyHref\s*=\s*/g) || []).length }));
} else {
  console.log(JSON.stringify({ fixed: false, replacements: 0 }));
}
