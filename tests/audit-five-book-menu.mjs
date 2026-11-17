import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'archive-record-registry.json'), 'utf8'));
const expected = { en: 'Five books', hu: 'Öt könyv', 'de-AT': 'Fünf Bücher' };
for (const [language, prefix] of Object.entries(expected)) {
  const count = registry.records.filter((entry) => entry.type === 'Book' && entry.language === language).length;
  assert.equal(count, 5, language + ' must have five canonical book records');
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const files = locs.map((url) => {
  const pathname = new URL(url).pathname;
  return pathname.endsWith('/') ? pathname.slice(1) + 'index.html' : pathname.slice(1);
});
files.push('404.html', 'hu/404.html', 'de-at/404.html');
assert.equal(new Set(files).size, files.length, 'Each canonical route must be unique');

for (const relative of files) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const lang = relative.startsWith('hu/') ? 'hu' : relative.startsWith('de-at/') ? 'de-AT' : 'en';
  const descriptions = [...html.matchAll(/<p class="m-desc">([^<]*)<\/p>/g)].map((match) => match[1]);
  const bookMenus = descriptions.filter((item) => /^(?:Three books|Három könyv|Drei Bücher|Four books|Négy könyv|Vier Bücher|Five books|Öt könyv|Fünf Bücher)\b/u.test(item));
  assert.equal(bookMenus.length, 1, relative + ': expected exactly one books-navigation description');
  assert.ok(bookMenus[0].startsWith(expected[lang]), relative + ': stale books-navigation count');
}
console.log('Five-book navigation contract: ' + files.length + ' pages, three languages; all canonical book counts match the archive.');
