import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const skip = new Set(['.git', '.github', 'node_modules', '_site', 'artifacts']);
const seen = { en: 0, hu: 0, de: 0 };

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const rel = path.relative(root, full).replaceAll(path.sep, '/');
    const html = fs.readFileSync(full, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html)) continue;
    if (!/<body\b[^>]*class=["'][^"']*apple-archive/i.test(html)) continue;
    const menu = /<div[^>]*id=["']menu["'][\s\S]*?(?=<main\b|<footer\b)/i.exec(html);
    assert.ok(menu, rel + ': missing archive menu');
    const links = [...menu[0].matchAll(/<a\b[^>]*class=["'][^"']*m-main[^"']*["'][^>]*href=["']([^"']+)["']/gi)].map(m => m[1]);
    assert.ok(links.length >= 5, rel + ': unexpectedly short menu');
    assert.ok(!links.some(href => /(?:^|\/)exhibitions\/ebredes\.html(?:$|[?#])/i.test(href)),
      rel + ': Ébredés must be listed as an exhibition, not a standalone main-menu link');
    seen[rel.startsWith('hu/') ? 'hu' : rel.startsWith('de-at/') ? 'de' : 'en']++;
  }
}
walk(root);
for (const [lang, count] of Object.entries(seen)) assert.ok(count >= 20, lang + ': too few canonical pages checked');
for (const prefix of ['', 'hu/', 'de-at/']) {
  const home = fs.readFileSync(path.join(root, prefix, 'index.html'), 'utf8');
  assert.match(home, /class="exhibition-map__row"\s+href="exhibitions\/ebredes\.html"/,
    prefix + ': Ébredés must remain accessible from the exhibitions catalogue');
  assert.ok(fs.existsSync(path.join(root, prefix, 'exhibitions/ebredes.html')),
    prefix + ': Ébredés exhibition record missing');
}
console.log('ART Ébredés menu placement passed: no standalone menu link; exhibitions remain accessible in EN, HU, DE.');
