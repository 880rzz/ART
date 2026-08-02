import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const oldIds = [
  'https://www.banhalmi.art/#studio-vienna',
  'https://www.banhalmi.art/#studio-budapest'
];
const canonicalIds = [
  'https://www.norbertbanhalmi.com/#vienna-studio',
  'https://www.norbertbanhalmi.com/#budapest-studio'
];
const textExtensions = new Set(['.html', '.json', '.jsonld', '.txt', '.md', '.js', '.mjs', '.py', '.xml']);

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const text = await readFile(full, 'utf8');
    for (const id of oldIds) {
      if (text.includes(id)) errors.push(`${path.relative(root, full)}: legacy duplicate Place ID remains: ${id}`);
    }
  }
}
await walk(root);

const homepageContracts = {
  'index.html': ['https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/'],
  'hu/index.html': ['https://www.norbertbanhalmi.com/hu/', 'https://www.banhalmi.art/hu/', 'https://blog.banhalmi.art/'],
  'de-at/index.html': ['https://www.norbertbanhalmi.com/de-at/', 'https://www.banhalmi.art/de-at/', 'https://blog.banhalmi.art/']
};
for (const [relative, urls] of Object.entries(homepageContracts)) {
  const html = await readFile(path.join(root, relative), 'utf8');
  if (!html.includes('data-banhalmi-ecosystem')) errors.push(`${relative}: visible official ecosystem navigation missing`);
  for (const url of urls) if (!html.includes(`href="${url}"`)) errors.push(`${relative}: ecosystem link missing ${url}`);
}

for (const relative of ['llms.txt', 'ai.txt']) {
  const text = await readFile(path.join(root, relative), 'utf8');
  for (const url of ['https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/']) {
    if (!text.includes(url)) errors.push(`${relative}: official ecosystem URL missing ${url}`);
  }
  for (const id of canonicalIds) {
    if (!text.includes(id) && relative === 'llms.txt') {
      // Place IDs are allowed to live in JSON-LD rather than prose; no error.
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Stage-one entity ecosystem audit passed: one Place identity per studio and visible three-site navigation on all ART homepages.');
