import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const hash = createHash('sha256');

for (const name of (await readdir(path.join(root, 'assets/css'))).filter((file) => file.endsWith('.css')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/css', name)));
}
for (const name of (await readdir(path.join(root, 'assets/js'))).filter((file) => file.endsWith('.js')).sort()) {
  hash.update(await readFile(path.join(root, 'assets/js', name)));
}

const assetDigest = hash.digest('hex').slice(0, 16);
const manifestPath = path.join(root, 'data/design-release.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.assetDigest = assetDigest;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Release asset digest synchronized: ${assetDigest}`);
