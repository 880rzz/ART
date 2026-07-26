import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'data') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

function value(html, key, attr) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\b[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'))?.[1]
    || html.match(new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${escaped}["'][^>]*>`, 'i'))?.[1]
    || '';
}

function escaped(text) {
  return text.replace(/&(?!(?:amp|quot|#39|lt|gt);)/g, '&amp;').replace(/"/g, '&quot;');
}

await walk(root);
const changed = [];
for (const file of files) {
  const original = await readFile(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(original)) continue;
  const description = value(original, 'description', 'name') || value(original, 'og:description', 'property');
  if (!description) continue;
  const safe = escaped(description);
  let html = original;
  html = html.replace(/<meta\b[^>]*property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${safe}">`);
  html = html.replace(/<meta\b[^>]*name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${safe}">`);
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed.push(path.relative(root, file).replaceAll(path.sep, '/'));
  }
}
console.log(JSON.stringify({ changed, total: changed.length }, null, 2));
