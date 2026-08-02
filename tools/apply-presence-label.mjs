import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const replacements = new Map([
  ['Saját szavaimmal', 'A jelenlét nyomában'],
  ['In my own words', 'In pursuit of presence'],
  ['Mit meinen eigenen Worten', 'Auf den Spuren der Präsenz']
]);
const extraFiles = new Set([
  'tools/audit_record_depth.py',
  'tests/audit-language-purity.mjs',
  'AUDIT-NYELV-ES-LINKEK-2026-08-01.md'
]);
const changed = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const relative = path.relative(root, full).replaceAll(path.sep, '/');
    if (!relative.endsWith('.html') && !extraFiles.has(relative)) continue;
    let text = await readFile(full, 'utf8');
    const original = text;
    for (const [from, to] of replacements) text = text.replaceAll(from, to);
    if (text !== original) {
      await writeFile(full, text, 'utf8');
      changed.push(relative);
    }
  }
}

await walk(root);

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

console.log(`Presence label migration updated ${changed.length} files.`);
console.log(`Release ${release.release} recorded with digest ${release.assetDigest}.`);
for (const file of changed) console.log(file);
