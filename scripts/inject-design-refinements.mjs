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
  /* Only insert when the link is genuinely absent. Stripping and re-appending
     it before </head> on every run reorders the cascade against the other
     layers — the release step at the end of the chain owns ordering. */
  let content = original;
  if (!/design-refinements\.css/i.test(content)) content = content.replace(/<\/head>/i, `${stylesheet}\n</head>`);
  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ changed, stylesheet }, null, 2));
