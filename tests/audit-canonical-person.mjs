import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const canonical = 'https://www.norbertbanhalmi.com/about/';
const forbidden = [
  'https://www.banhalmi.art/norbert-banhalmi#person',
  'https://banhalmi.art/norbert-banhalmi#person',
  'https://www.banhalmi.art/norbert-banhalmi',
  'https://banhalmi.art/norbert-banhalmi'
];
const extensions = new Set([
  '.html', '.htm', '.json', '.jsonld', '.txt', '.md', '.mjs', '.js', '.cjs',
  '.xml', '.yaml', '.yml', '.css', '.svg', '.webmanifest', '.csv'
]);
const special = new Set(['_redirects', 'robots.txt', 'CNAME']);
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (extensions.has(path.extname(entry.name).toLowerCase()) || special.has(entry.name)) files.push(full);
  }
}

await walk(root);
let canonicalHits = 0;
const errors = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  canonicalHits += text.split(canonical).length - 1;
  for (const value of forbidden) {
    if (text.includes(value)) errors.push(`${path.relative(root, file)}: legacy Person identifier ${value}`);
  }
}

const redirects = await readFile(path.join(root, '_redirects'), 'utf8');
for (const route of ['/norbert-banhalmi', '/hu/norbert-banhalmi', '/de-at/norbert-banhalmi']) {
  if (!redirects.includes(`${route}  ${canonical}  301`)) {
    errors.push(`_redirects: ${route} must resolve to canonical Person`);
  }
}

if (!canonicalHits) errors.push('Canonical Person identifier is not present.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Canonical Person audit passed across ${files.length} files with ${canonicalHits} references.`);
