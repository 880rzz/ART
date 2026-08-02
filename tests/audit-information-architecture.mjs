import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github', 'data', 'reports']);
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}

await walk(root);
const errors = [];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const html = await readFile(file, 'utf8');
  if (!/class=["'][^"']*apple-archive/i.test(html) || !/id=["']menu["']/i.test(html) || /http-equiv=["']refresh["']/i.test(html)) continue;
  for (const [role, fragment] of [['gallery', '#works'], ['about', '#about'], ['oeuvre', '#journey']]) {
    const candidates = [...html.matchAll(/<a\b[^>]*data-nav-role=["']([^"']+)["'][^>]*>/gi)];
    const link = candidates.find((match) => match[1] === role)?.[0] || '';
    if (!link.includes(fragment)) errors.push(`${rel}: missing ${role} menu destination ${fragment}`);
  }
}

for (const [rel, anchors] of Object.entries({
  'index.html': ['works', 'about', 'journey'],
  'hu/index.html': ['works', 'about', 'journey'],
  'de-at/index.html': ['works', 'about', 'journey']
})) {
  const html = await readFile(path.join(root, rel), 'utf8');
  for (const id of anchors) {
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) errors.push(`${rel}: missing anchor #${id}`);
  }
}

const canonicalPerson = 'https://www.norbertbanhalmi.com/about/';
const redirects = await readFile(path.join(root, '_redirects'), 'utf8');
const redirectRows = redirects
  .split(/\r?\n/)
  .map((line) => line.trim().split(/\s+/))
  .filter((parts) => parts.length >= 3);
for (const route of ['/norbert-banhalmi', '/hu/norbert-banhalmi', '/de-at/norbert-banhalmi']) {
  const matching = redirectRows.find(([source]) => source === route);
  if (!matching || matching[1] !== canonicalPerson || matching[2] !== '301') {
    errors.push(`_redirects: ${route} must resolve to the canonical Person page`);
  }
}
if (/\/about\.html/.test(redirects)) errors.push('_redirects: dead about.html target remains');

const css = await readFile(path.join(root, 'assets/css/museum-editorial.css'), 'utf8');
if (!css.includes('15. Canonical chronology component')) errors.push('museum-editorial.css: canonical chronology component missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Information architecture audit passed: Gallery, archive About, Oeuvre and canonical Person routing are explicit in all languages.');
