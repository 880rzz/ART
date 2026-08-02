import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = new Map([
  ['index.html', 'In pursuit of presence'],
  ['hu/index.html', 'A jelenlét nyomában'],
  ['de-at/index.html', 'Auf den Spuren der Präsenz']
]);

for (const [relative, heading] of pages) {
  const file = path.join(root, relative);
  let html = await readFile(file, 'utf8');
  const about = /(<section\b[^>]*\bid=["']about["'][^>]*>[\s\S]*?<h2\b[^>]*>)([\s\S]*?)(<\/h2>)/i;
  if (!about.test(html)) throw new Error(`${relative}: #about heading not found`);
  html = html.replace(about, `$1${heading}$3`);
  await writeFile(file, html, 'utf8');
}

const hash = createHash('sha256');
for (const dir of ['assets/css', 'assets/js']) {
  const absolute = path.join(root, dir);
  for (const file of (await readdir(absolute)).filter((name) => /\.(?:css|js)$/.test(name)).sort()) {
    hash.update(await readFile(path.join(absolute, file)));
  }
}

const releasePath = path.join(root, 'data/design-release.json');
const release = JSON.parse(await readFile(releasePath, 'utf8'));
release.release = '20260802-human-curatorial-v26';
release.assetDigest = hash.digest('hex').slice(0, 16);
release.note = 'Stable desktop/mobile About navigation and Curators visual parity across Press, Community and Writing in EN, HU and DE-AT.';
await writeFile(releasePath, `${JSON.stringify(release, null, 2)}\n`, 'utf8');

console.log('Applied the three presence headings and recorded the v26 asset digest.');
