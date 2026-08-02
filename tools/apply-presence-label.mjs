import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const homepageLabels = new Map([
  ['index.html', 'In pursuit of presence'],
  ['hu/index.html', 'A jelenlét nyomában'],
  ['de-at/index.html', 'Auf den Spuren der Präsenz']
]);
const changed = [];

for (const [relative, label] of homepageLabels) {
  const file = path.join(root, relative);
  const original = await readFile(file, 'utf8');
  const aboutSection = /(<section\b[^>]*\bid=["']about["'][^>]*>[\s\S]*?<h2\b[^>]*>)([\s\S]*?)(<\/h2>)/i;
  if (!aboutSection.test(original)) {
    throw new Error(`${relative}: the #about heading could not be located`);
  }
  const updated = original.replace(aboutSection, `$1${label}$3`);
  if (updated !== original) {
    await writeFile(file, updated, 'utf8');
    changed.push(relative);
  }
}

const digest = createHash('sha256');
const cssDir = path.join(root, 'assets/css');
for (const file of (await readdir(cssDir)).filter((name) => name.endsWith('.css')).sort()) {
  digest.update(await readFile(path.join(cssDir, file)));
}
const jsDir = path.join(root, 'assets/js');
for (const file of (await readdir(jsDir)).filter((name) => name.endsWith('.js')).sort()) {
  digest.update(await readFile(path.join(jsDir, file)));
}

const releasePath = path.join(root, 'data/design-release.json');
const release = JSON.parse(await readFile(releasePath, 'utf8'));
release.release = '20260802-human-curatorial-v26';
release.assetDigest = digest.digest('hex').slice(0, 16);
release.note = 'Human voice and ecosystem audit: presence-led introduction, stable About navigation, Curators design parity for Press, Community and Writing, final blog.banhalmi.art redirects, and corrected MOL Y2K interpretation.';
await writeFile(releasePath, `${JSON.stringify(release, null, 2)}\n`, 'utf8');

console.log(`Presence heading migration updated ${changed.length} homepages.`);
console.log(`Release ${release.release} recorded with digest ${release.assetDigest}.`);
for (const file of changed) console.log(file);
