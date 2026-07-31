import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [];
const skip = new Set(['.git', 'node_modules', '.github']);
const stylesheet = '<link rel="stylesheet" href="/assets/css/design-refinements.css?v=20260729-footer-separation-v2">';

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) htmlFiles.push(file);
  }
}

await walk(root);
let changed = 0;
for (const file of htmlFiles) {
  const original = await readFile(file, 'utf8');
  let content = original.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/design-refinements\.css\?v=[^"]+">/gi, '');
  content = content.replace(/<\/head>/i, `${stylesheet}\n</head>`);
  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ changed, stylesheet }, null, 2));
