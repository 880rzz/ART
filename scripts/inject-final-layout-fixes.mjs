import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const skip = new Set(['.git', 'node_modules', '.github']);
const link = '<link rel="stylesheet" href="/assets/css/final-layout-fixes.css?v=20260729-final-v1">';

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

await walk(root);
const changed = [];
for (const file of files) {
  const original = await readFile(file, 'utf8');
  /* Only insert when the link is genuinely absent. Stripping and re-appending
     it before </head> on every run reorders the cascade against the other
     layers — the release step at the end of the chain owns ordering. */
  let content = original;
  if (!/final-layout-fixes\.css/i.test(content)) content = content.replace(/<\/head>/i, `${link}\n</head>`);
  if (content !== original) {
    await writeFile(file, content, 'utf8');
    changed.push(path.relative(root, file).replaceAll('\\', '/'));
  }
}
console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
