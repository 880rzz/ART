import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent identity guard: ART describes the oeuvre but reuses one professional Person node.
const root = path.resolve(import.meta.dirname, '..');
const canonical = 'https://www.norbertbanhalmi.com/about/';
const legacyWwwRoot = 'https://www.banhalmi' + '.art/norbert-banhalmi';
const legacyRoot = 'https://banhalmi' + '.art/norbert-banhalmi';
const forbidden = [
  `${legacyWwwRoot}#person`,
  `${legacyRoot}#person`,
  legacyWwwRoot,
  legacyRoot
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
const legacyProfileTargets = new Map([
  ['/norbert-banhalmi', canonical],
  ['/hu/norbert-banhalmi', 'https://www.norbertbanhalmi.com/hu/eletmu/'],
  ['/de-at/norbert-banhalmi', 'https://www.norbertbanhalmi.com/de-at/werk/']
]);
for (const [route, target] of legacyProfileTargets) {
  if (!redirects.includes(`${route}  ${target}  301`)) {
    errors.push(`_redirects: ${route} must resolve to its language-correct professional landing`);
  }
}

const legacyProfileStubs = new Map([
  ['/norbert-banhalmi', 'norbert-banhalmi/index.html'],
  ['/hu/norbert-banhalmi', 'hu/norbert-banhalmi/index.html'],
  ['/de-at/norbert-banhalmi', 'de-at/norbert-banhalmi/index.html']
]);
for (const [route, file] of legacyProfileStubs) {
  const target = legacyProfileTargets.get(route);
  const html = await readFile(path.join(root, file), 'utf8');
  if (!html.includes(target)) errors.push(`${file}: missing language-correct redirect target ${target}`);
  if (!/http-equiv=["']refresh["']/i.test(html)) errors.push(`${file}: meta refresh missing`);
  if (!/window\.location\.replace/i.test(html)) errors.push(`${file}: JS forwarding missing`);
}

if (!canonicalHits) errors.push('Canonical Person identifier is not present.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Canonical Person audit passed across ${files.length} files with ${canonicalHits} references.`);
