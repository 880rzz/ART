import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', 'node_modules', '.github', 'data', '_site']);
let reviewed = 0;
let navPages = 0;
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await inspect(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = await readFile(file, 'utf8');
    if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;
    reviewed++;
    const menu = /<div[^>]*id=["']menu["'][\s\S]*?(?=<main\b|<footer\b)/i.exec(html)?.[0];
    if (!menu) continue;
    navPages++;
    assert.doesNotMatch(menu, /<a\b[^>]*class=["'][^"']*\bm-main\b[^"']*["'][^>]*href=["'][^"']*\/exhibitions\/ebredes\.html["']/i,
      'Ébredés must not be a top-level menu item: ' + path.relative(root, file));
  }
}
await inspect(root);
assert.ok(navPages >= 75, 'Unexpected loss of ART canonical navigation');
for (const prefix of ['', 'hu/', 'de-at/']) {
  const home = await readFile(path.join(root, prefix, 'index.html'), 'utf8');
  const menu = /<div[^>]*id=["']menu["'][\s\S]*?(?=<main\b|<footer\b)/i.exec(home)?.[0];
  assert.ok(menu, prefix + ' homepage navigation missing');
  assert.equal([...menu.matchAll(/class="m-main"/g)].length, 10, prefix + ' main menu should have ten items');
  assert.match(home, /class="exhibition-map__row"\s+href="exhibitions\/ebredes\.html"/,
    prefix + ' Ébredés exhibition archive link missing');
  assert.match(home, /href="books\/book-ebredes\.html"/,
    prefix + ' Ébredés book archive link missing');
}
console.log('ART Ébredés navigation regression passed: ' + navPages + ' navigation pages inspected among ' + reviewed + ' archive pages; exhibition and book links preserved in EN/HU/DE.');
