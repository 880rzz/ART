import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent editorial guard for the six canonical life-journey views.
const root = path.resolve(import.meta.dirname, '..');
const pages = [
  'index.html',
  'hu/index.html',
  'de-at/index.html',
  'curators.html',
  'hu/curators.html',
  'de-at/curators.html'
];
const errors = [];
const cardPattern = /<li><a\b[^>]*><strong>([^<]+)<\/strong><span>([^<]+)<\/span><\/a><\/li>/g;

for (const relative of pages) {
  const html = await readFile(path.join(root, relative), 'utf8');
  for (const nested of ['&amp;amp;', '&amp;quot;', '&amp;#']) {
    if (html.includes(nested)) errors.push(`${relative}: nested HTML entity remains: ${nested}`);
  }
  for (const match of html.matchAll(cardPattern)) {
    const [, title, meta] = match;
    if (meta.startsWith(`${title} · `)) {
      errors.push(`${relative}: compact card repeats its title in metadata: ${title}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Life-journey copy audit passed: no nested entities or repeated compact-card titles across six pages.');
