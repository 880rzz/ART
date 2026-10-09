import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TOKEN = JSON.parse(await readFile(path.join(ROOT, 'data/design-authority.json'), 'utf8')).assetVersion;
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '_site', 'artifacts', 'dist', 'build', 'coverage']);
const ASSETS = ['/assets/js/responsive-header-system.js', '/assets/css/site.css'];
// Homepages intentionally use a newer CSS-only token for the mobile portrait fix.
// Keep the Contact Dock JavaScript token and all other pages on design authority.
const HOME_CSS_TOKEN = '20261009-mobile-hero-bottom-v12';
const HOME_PATHS = new Set(['index.html', 'hu/index.html', 'de-at/index.html']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
  }
}

const failures = [];
let scanned = 0;
let references = 0;

for await (const file of walk(ROOT)) {
  scanned += 1;
  const html = await readFile(file, 'utf8');
  for (const asset of ASSETS) {
    let start = 0;
    while ((start = html.indexOf(asset, start)) !== -1) {
      references += 1;
      const tail = html.slice(start + asset.length, start + asset.length + 96);
      const match = tail.match(/^\?v=([^\"'\s<>]+)/);
      const relative = path.relative(ROOT, file).split(path.sep).join('/');
      const expected = asset === '/assets/css/site.css' && HOME_PATHS.has(relative) ? HOME_CSS_TOKEN : TOKEN;
      if (!match || match[1] !== expected) {
        failures.push(path.relative(ROOT, file) + ': ' + asset + (match ? '?v=' + match[1] : ' (missing version token)'));
      }
      start += asset.length;
    }
  }
}

if (failures.length) {
  console.error('Stale Contact Dock asset tokens found (' + failures.length + '):');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}

console.log('Contact Dock asset-token audit passed: scanned=' + scanned + ' references=' + references + ' token=' + TOKEN);
